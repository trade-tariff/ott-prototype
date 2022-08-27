const axios = require('axios');
const SearchFilter = require('./search_filter');
const Guide = require('./guide');
const SearchHeading = require('./search_heading');
const importFresh = require('import-fresh');
const { result, xor } = require('lodash');
const tc = require("text-case");

class SearchExtended {
    // THIS IS NO LONGER USED
    constructor(context, req, res) {
        this.context = context;
        this.format_search_term();
        this.get_url(req);
        this.sort_order = context.sort_order;

        var query_folder = "../queries/";
        var query_template = "query_suggest_dis_max.json";
        var query_template = "query_suggest_bool.json";
        this.query = importFresh(query_folder + query_template);

        /* Check to see if this is a number
            - if so, then we search with fuzzy switched off
            - else, fuzzy is AUTO
        */
        let isnum = /^\d+$/.test(context.search_term);
        if (isnum) {
            context.search_term = context.search_term.padEnd(10, "0");
            if (query_template == "query_suggest_bool.json") {
                delete this.query.query.bool.must[0].multi_match.fuzziness;
                this.query.query.bool.must[0].multi_match.fields = ["goods_nomenclature_item_id"];
                this.query.query.bool.must[0].multi_match.type = "phrase_prefix";
            } else if (query_template == "query_suggest_dis_max.json") {
                delete this.query.query.bool.must[0].multi_match.fuzziness;
                this.query.query.bool.must[0].multi_match.fields = ["goods_nomenclature_item_id"];
                this.query.query.bool.must[0].multi_match.type = "phrase_prefix";
            }
        }

        if (query_template == "query_suggest_bool.json") {
            var split_terms = false;
            if (split_terms) {
                if (this.context.search_term_split.length == 1) {
                    this.query.query.bool.must[0].multi_match.query = this.context.search_term;
                } else {
                    this.query.query.bool.must[0].multi_match.query = this.context.search_term_split[0];
                    for (var i = 0; i < this.context.search_term_split.length - 1; i++) {
                        var tmp = JSON.stringify(this.query.query.bool.must[0]);
                        var tmp2 = JSON.parse(tmp);
                        tmp2.multi_match.query = this.context.search_term_split[i + 1];
                        this.query.query.bool.must.push(tmp2);
                    }
                }
            } else {
                this.query.query.bool.must[0].multi_match.query = this.context.search_term;
                // this.query.query.bool.should.match["description.shingles"] = this.context.search_term;
            }
            // this.query.suggest.text = this.context.search_term;
        } else if (query_template == "query_suggest_dis_max.json") {
            var a = 1;
            this.query.query.dis_max.queries[0].multi_match.query = this.context.search_term;
            this.query.query.dis_max.queries[1].multi_match.query = this.context.search_term;
        }
        // this.sort_order = "relevance";
        if (this.sort_order == "alpha") {
            var sort_alpha_phrase = {
                "goods_nomenclature_item_id.raw": {
                    "order": "asc"
                },
                "productline_suffix.raw": {
                    "order": "asc"
                }
            }
            this.query.sort = sort_alpha_phrase;
        }

        this.guide = null;
        this.guide_minimum_threshold = 1;

        this.get_filters(req);
        console.log(JSON.stringify(this.query));

        var url = 'http://localhost:9200/commodities/_search';
        axios.get(url, {
            params: {
                source: JSON.stringify(this.query),
                source_content_type: 'application/json'
            }
        })
            .then((response) => {
                this.results = response.data.hits;
                if (this.sort_order == "alpha") {
                    this.sort_alpha();
                }
                this.get_guides(this.results.hits);
                this.get_headings();
                if (1 > 2) {
                    this.process_suggestions(response.data.suggest["did-you-mean"], context.search_term);
                }
                this.remove_excluded_results();
                this.process_filters();

                res.render('search/elastic', {
                    'context': this.context,
                    'hits': this.results,
                    'hit_count': this.hit_count,
                    'chapters': this.chapter_array,
                    'search_headings': this.search_headings,
                    'suggestions': this.suggestions,
                    'filters': this.filters_with_counts,
                    'applied_filters': this.filter_dict,
                    'guide': this.guide,
                    'heading_style': this.heading_style,
                    'show_chapters': this.show_chapters,
                    'show_headings': this.show_headings,
                    'url': this.url,
                    'conjunction': this.conjunction
                });
            });
    }

    get_url(req) {
        this.url = req.originalUrl;
        if (this.url.includes("?")) {
            this.conjunction = "&";
        } else {
            this.conjunction = "?";
        }
    }

    format_search_term() {
        var sw = require('stopword');

        var temp = this.context.search_term.toLowerCase().replace(/\+/g, " ");
        temp = temp.replace("-", " ");
        temp = temp.split(" ");
        temp = sw.removeStopwords(temp);
        this.context.search_term = temp.join(" ");
        this.context.search_term_split = this.context.search_term.split(" ");
    }

    // set_tokeniser(req) {
    //     var item_count = this.context.search_term.split(" ").length;

    //     if (item_count > 1) {
    //         this.query.query.bool.must[0].multi_match.analyzer = "english";
    //         var min_match = Math.max(2, item_count - 1);
    //         var min_match = item_count;
    //         this.query.query.bool.must[0].multi_match["minimum_should_match"] = min_match;
    //     }
    // }

    get_headings(req) {
        this.search_headings = [];
        this.results.hits.forEach(hit => {
            hit = hit._source;
            if (hit.goods_nomenclature_item_id.includes("8434")) {
                var a = 1;
            }
            var new_heading = new SearchHeading(hit);
            var found = false;
            if (new_heading.id.substr(2, 2) != "00") {
                this.search_headings.forEach(existing_heading => {
                    if (new_heading.id == existing_heading.id) {
                        existing_heading.count += 1;
                        found = true;
                    }
                });
                if (!found) {
                    this.search_headings.push(new_heading);
                }
            }
        });

        this.search_headings.sort(compare_headings);

        this.style_search_headings_chapters();

        function compare_headings(a, b) {
            if (a.count > b.count) {
                return -1;
            }
            if (a.count < b.count) {
                return 1;
            }
            return 0;
        }
    }

    style_search_headings_chapters() {
        // Work out how to display headings
        if (this.search_headings.length == 1) {
            this.show_headings = false;
            this.show_chapters = false;
            this.heading_style = "sh4";
        } else if (this.search_headings.length > 12) {
            if (this.chapter_array.length > 1) {
                this.show_chapters = true;
                this.show_headings = false;
            } else {
                this.show_chapters = false;
                this.show_headings = true;
            }
            // this.heading_style = "tabular";
            this.heading_style = "sh4";
        } else if (this.search_headings.length > 8) {
            this.show_chapters = false;
            this.show_headings = true;
            // this.heading_style = "tabular";
            this.heading_style = "sh4";
        } else {
            this.show_chapters = false;
            this.show_headings = true;
            switch (this.search_headings.length) {
                case 1:
                case 2:
                    this.heading_style = "sh2";
                    break;
                case 3:
                case 5:
                case 6:
                case 9:
                    this.heading_style = "sh3";
                    break;
                default:
                    this.heading_style = "sh4";
            }
        }
    }

    get_guides(hits) {
        this.get_guides_by_chapter(hits);
        // this.get_guides_by_keyword();
    }

    get_guides_by_chapter(hits) {

        // console.log("Getting guides by chapter");
        this.chapters = {}
        // Check all the hits and form a unique
        // list of chapters that contain those results, with their frequency
        hits.forEach(hit => {
            var chapter = hit._source.goods_nomenclature_item_id.substr(0, 2);
            var chapter_description = hit._source.chapter;
            if (this.chapters[chapter] === undefined) {
                this.chapters[chapter] = { "count": 1, "description": chapter_description };
            } else {
                this.chapters[chapter]["count"] += 1;
            }
        });

        // Convert this object list into a simple array for sorting
        this.chapter_array = [];
        for (var [key, value] of Object.entries(this.chapters)) {
            var a = 1;
            var description = value["description"];
            if ((description !== undefined) && (description != null)) {
                var obj = [key, value["count"], tc.sentenceCase(value["description"])];
                this.chapter_array.push(obj);
            }
        }
        var a = 1;

        // Sort the array with the maximum frequency first
        this.chapter_array.sort(compare_chapter_frequency);

        function compare_chapter_frequency(a, b) {
            if (a[1] > b[1]) {
                return -1;
            }
            if (a[1] < b[1]) {
                return 1;
            }
            return 0;
        }

        const jp = require('jsonpath');
        this.guides = require('../data/guides/guides.json');

        // To show a guide, we need to have at least x percent hits
        // Let's start with x = 25% and try it out
        var match_threshold = 25;

        var guide_found = false;
        this.chapter_array.forEach(chapter => {
            this.guides.guides.forEach(guide => {
                if (!guide_found) {
                    if (guide.chapters !== undefined) {
                        if (guide.chapters.includes(chapter[0])) {
                            if ((chapter[1] / hits.length) * 100 > match_threshold) {
                                this.guide = new Guide(guide);
                                guide_found = true;
                            }
                        }
                    }
                }
            });
        });
        var a = 1;
    }

    get_guides_by_keyword() {
        // console.log("Getting guides by keyword");
        const jp = require('jsonpath');
        this.guides = require('../data/guides/guides.json');
        var query_string = "$.guides[?(@.terms.indexOf('" + this.context.search_term + "') != -1)]"
        var result = jp.query(this.guides, query_string);
        if (result.length > 0) {
            this.guide = new Guide(result[0]);
        }
        var a = 1;
    }

    get_filters(req) {
        this.filter_list = req.query["filter"];
        this.filter_dict = [];

        if (typeof this.filter_list !== 'undefined') {
            for (var [key, value] of Object.entries(this.filter_list)) {
                var filter_field;

                if (key == "chapter") {
                    filter_field = "chapter_id";
                } else if (key == "heading") {
                    filter_field = "heading_id";
                } else {
                    filter_field = key + ".raw";
                }
                var filter_value = value;
                var filter_value_clause = {
                    "query": filter_value
                }
                var filter = {}
                filter.match = {}
                filter.match[filter_field] = filter_value_clause

                var item = {}
                item.field = key;
                item.value = value;
                this.filter_dict.push(item);

                // Using the filter clause is meant to be a lot quicker
                var real_filter_clause = {
                    "match": {}
                }
                real_filter_clause["match"][key] = filter_value;

                this.query.query.bool.must.push(filter);
                // this.query.query.bool.filter.push(real_filter_clause);
                var a = 1;
            }
        }
    }

    process_suggestions(suggestions, search_term) {
        this.suggestions = [];
        suggestions.forEach(suggestion => {
            suggestion.options.forEach(option => {
                if (option.text != search_term) {
                    this.suggestions.push(option.text);
                }
            });
        });
    }

    sort_alpha() {
        this.resolve_hierarchy_for_alpha();
        return;
        this.results.hits.sort(compare_alpha);

        function compare_alpha(a, b) {
            if (a._source.goods_nomenclature_item_id < b._source.goods_nomenclature_item_id) {
                return -1;
            }
            if (a._source.goods_nomenclature_item_id > b._source.goods_nomenclature_item_id) {
                return 1;
            }
            return 0;
        }

    }

    resolve_hierarchy_for_alpha() {
        var prior_hierarchy = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        var hierarchy_length = prior_hierarchy.length;
        this.results.hits.forEach(hit => {
            var prototype = {
                "sid": hit._source.sid,
                "goods_nomenclature_item_id": hit._source.goods_nomenclature_item_id,
                "productline_suffix": hit._source.productline_suffix,
                "description": hit._source.description,
                "class": hit._source.class
            }
            hit._source.hierarchy.push(prototype);
            hit.display_hierarchy = [];
            var index = -1
            hit._source.hierarchy.forEach(hierarchy_element => {
                hierarchy_element["indent"] = index + 1;
                index += 1;
                if (hierarchy_element.sid != prior_hierarchy[index]) {
                    hit.display_hierarchy.push(hierarchy_element);
                }
                prior_hierarchy[index] = hierarchy_element.sid;
            });
        });
    }

    process_filters() {
        this.filters_with_counts = [];
        this.results.hits.forEach(result => {
            for (var [key, value] of Object.entries(result._source)) {
                if (key.includes("filter_")) {
                    var value2 = String(value).toLowerCase();
                    var found = false;
                    this.filters_with_counts.forEach(filter => {
                        if (filter.key == key) {
                            value.forEach(value_instance => {
                                // if (!filter.values.includes(value_instance)) {
                                filter.add_value(value_instance);
                                // }
                            });
                            found = true;
                        }
                    });
                    if (!found) {
                        var new_filter = new SearchFilter(key);
                        value.forEach(value_instance => {
                            new_filter.add_value(value_instance);
                        });
                        this.filters_with_counts.push(new_filter);
                    }
                }
            }
        });

        this.tally_filter_values();
        var a = 1;
    }

    tally_filter_values() {
        var filter_display_percentage_threshold = process.env["filter_display_percentage_threshold"];
        var filter_value_count_threshold = process.env["filter_value_count_threshold"];

        this.filters_with_counts.forEach(filter => {
            filter.display = true;
            filter.value_count = 0;
            filter.values.forEach(value => {
                filter.value_count += value.count;
            });
            if ((filter.value_count / this.hit_count) * 100 < filter_display_percentage_threshold) {
                filter.display = false;
            }
            if (filter.values.length < filter_value_count_threshold) {
                filter.display = false;
            }
            filter.sort_values();
        });

        this.filters_with_counts.sort(compare_value_counts);
        var a = 1;

        function compare_value_counts(a, b) {
            if (a.value_count > b.value_count) {
                return -1;
            }
            if (a.value_count < b.value_count) {
                return 1;
            }
            return 0;
        }
    }

    deduplicate() {
        // No longer used - can't remember what it does
        this.found_commodities = [];
        this.results.hits.forEach(result => {
            result.display = true;
            if (result._source.productline_suffix != "80") {
                result.display = true;
            } else {
                if (this.found_commodities.includes(result._source.goods_nomenclature_item_id)) {
                    result.display = false;
                } else {
                    this.found_commodities.push(result._source.goods_nomenclature_item_id);
                    result.display = true;
                }
            }
        });
    }

    remove_excluded_results() {
        this.hit_count = this.results.hits.length;
        this.found_commodities = [];
        this.results.hits.forEach(result => {
            result.display = true;
            var exclusion_word_position = 9999999;
            var exclusion_words = [
                "neither",
                "other than",
                "excluding",
                "except",
                " not "
            ]
            exclusion_words.forEach(exclusion_word => {
                var pos = result._source.description.indexOf(exclusion_word);
                if (pos > -1) {
                    exclusion_word_position = pos;
                    var a = 1;
                }
            });
            if (exclusion_word_position < 9999999) {
                var pos = result._source.description.indexOf(this.context.search_term);
                if (pos > exclusion_word_position) {
                    result.display = false;
                    this.hit_count -= 1;
                }
            }
            result.display = true;
        });
    }

}
module.exports = SearchExtended

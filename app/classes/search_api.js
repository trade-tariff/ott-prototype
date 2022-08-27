const axios = require('axios');
const SearchFilter = require('./search_filter');
const Guide = require('./guide');
const SearchHeading = require('./search_heading');
const importFresh = require('import-fresh');
const { result, xor } = require('lodash');
const tc = require("text-case");

class SearchApi {
    constructor(context, req, res) {
        this.context = context;
        this.req = req;

        this.hits = [];
        this.filters = [];
        this.chapters = [];
        this.headings = [];
        this.guides = [];

        this.get_url(req);
        this.get_filters();
        this.show_commodities_threshold = process.env["show_commodities_threshold"];
        this.show_headings_threshold = process.env["show_headings_threshold"];
        this.sort_order = context.sort_order;

        var url = 'http://127.0.0.1:5001/elastic/' + context.search_term;
        if (this.applied_filters != null) {
            url += "?" + this.filter_string;
            this.has_filters = true;
        } else {
            this.has_filters = false;
        }
        console.log(url);
        axios.get(url)
            .then((response) => {
                if (response.status == 200) {
                    this.response = response.data;
                    this.hits = this.response["hits"];
                    this.filters = this.response["filters"];
                    this.chapters = this.response["chapters"];
                    this.headings = this.response["headings"];
                    this.guides = this.response["guides"];
                }

                if (typeof this.headings !== 'undefined') {
                    if (Object.keys(this.headings).length > this.show_headings_threshold) {
                        this.profile = "headings";
                    } else {
                        this.profile = "commodities";
                    }

                    this.headings.forEach(heading => {
                        if (this.has_filters) {
                            heading.apply_url = this.url + "&";
                        } else {
                            heading.apply_url = this.url + "?";
                        }
                        heading.apply_url += "filter[heading_id]=" + heading.heading;
                        var a = 1;
                    });
                }

                // console.log(this.applied_filters);

                res.render('elasticq/elasticq', {
                    'context': this.context,
                    'hits': this.hits,
                    'chapters': this.chapters,
                    'headings': this.headings,
                    'suggestions': this.suggestions,
                    'filters': this.filters,
                    'guides': this.guides,
                    'url': this.url,
                    'conjunction': this.conjunction,
                    'profile': this.profile,
                    'applied_filters': this.applied_filters
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

    get_filters() {
        var a = 1;
        var removal_url;
        var filter_count;
        var base_url = this.req.url.split("?")[0];
        this.applied_filters = this.req.query["filter"];
        if (typeof this.applied_filters !== 'undefined') {
            filter_count = Object.entries(this.applied_filters).length;
            var tmp = {};
            for (const [key, value] of Object.entries(this.applied_filters)) {
                if (filter_count == 1) {
                    removal_url = base_url;
                } else {
                    removal_url = "www.google.com";
                    removal_url = base_url;
                }
                var obj = {
                    "removal_url": removal_url,
                    "value": value
                }
                tmp[key] = obj;

                // console.log(`${key}: ${value}`);
            }
            this.applied_filters = tmp;
            var a = 1;

            this.filter_string = this.req.url.split("?").pop();
        } else {
            this.filter_string = "";
            this.applied_filters = null;
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

}
module.exports = SearchApi

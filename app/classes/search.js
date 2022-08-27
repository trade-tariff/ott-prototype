const axios = require('axios');
const Link = require('./link');

class Search {
    constructor(data, call_type) {
        this.data = data;
        this.call_type = call_type;
        this.links = [];
        this.heading_count = 0;
        this.commodity_count = 0;

        this.get_leaf_data();
        this.get_hierarchy_data();
        this.get_title();
        this.parse();
        this.sort_links();
        this.count_components();
    }

    get_title() {
        var a = 1;
        if (this.call_type == "search") {
            this.page_title = "";
        } else {
            this.page_title = this.data.data.attributes.formatted_description;
        }
    }

    get_leaf_data() {
        const fs = require('fs');
        const path = require('path');

        var directoryPath = path.join(__dirname, '..');
        var directoryPath = path.join(directoryPath, "data");
        var filename = path.join(directoryPath, "leaves.json");
        var leaves_file = fs.readFileSync(filename, 'utf8');
        this.leaves_data = JSON.parse(leaves_file);
    }

    get_hierarchy_data() {
        const fs = require('fs');
        const path = require('path');

        var directoryPath = path.join(__dirname, '..');
        var directoryPath = path.join(directoryPath, "data");
        var filename = path.join(directoryPath, "codes.json");
        var hierarchy_file = fs.readFileSync(filename, 'utf8');
        this.hierarchy_data = JSON.parse(hierarchy_file);
    }

    parse() {
        var _ = require('lodash');
        var jp = require('jsonpath');
        var i;

        if (this.call_type == "heading") {
            var included = this.data.included;
            for (i = 0; i < included.length; i++) {
                var item = included[i];
                var accepted = ["commodity"];
                if (accepted.includes(item.type)) {
                    var link = new Link();
                    link.text = item.attributes.formatted_description;
                    link.type = item.type;
                    link.id = item.attributes.goods_nomenclature_item_id;
                    link.level = item.attributes.number_indents + 1;
                    link.leaf = item.attributes.leaf;

                    this.links.push(link);
                }
            }
        } else if (this.call_type == "chapter") {
            var included = this.data.included;
            for (i = 0; i < included.length; i++) {
                var item = included[i];
                var accepted = ["heading"];
                if (accepted.includes(item.type)) {
                    var link = new Link();
                    link.text = item.attributes.formatted_description;
                    link.type = item.type;
                    link.link = "/headings/" + item.attributes.goods_nomenclature_item_id.substring(0, 4); // + "/mushrooms";
                    link.id = item.attributes.goods_nomenclature_item_id;
                    link.level = 0; //item.attributes.number_indents + 1;
                    link.leaf = false; //item.attributes.leaf;

                    this.links.push(link);
                }
            }
            var a = 1;
        } else {
            // A standard search
            var results = this.data.results;
            for (i = 0; i < results.length; i++) {
                var item = results[i];
                var link = new Link();


                link.id = item.goods_nomenclature_item_id;
                link.text = item.description;
                link.type = item.type;
                link.level = 0;

                // var query_string = "$[?(@.goods_nomenclature_item_id == '" + link.id + "')]";
                // var result = jp.query(this.leaves_data, query_string);
                // if (result.length > 0) {
                //     link.leaf = true;
                // } else {
                //     link.leaf = false;
                // }

                var query_string = "$[?(@.goods_nomenclature_item_id == '" + link.id + "')]";
                var result = jp.query(this.hierarchy_data, query_string);
                link.hierarchy = "";
                if (result.length > 0) {
                    link.leaf = true;
                    if (typeof result[0].hierarchy !== 'undefined') {
                        for (var j = result[0].hierarchy.length - 2; j>=0; j--) {
                            var hierarchy_item = result[0].hierarchy[j];
                            link.hierarchy += hierarchy_item + " — ";
                        }
                        link.hierarchy = _.trim(link.hierarchy, " — ");
                        // console.log (link.hierarchy);
                    }
                    var a = 1;
                } else {
                    link.leaf = false;
                }

                if (link.hierarchy == " — ") {
                    link.hierarchy = "";
                }

                if (link.type == "heading") {
                    if (link.leaf) {
                        link.type = "commodity";
                        link.link = "";
                    } else {
                        link.link = "/headings/" + item.goods_nomenclature_item_id.substring(0, 4);
                    }
                    this.links.push(link);
                } else {
                    link.link = "";
                    if (link.leaf) {
                        this.links.push(link);
                    }

                }

            }

        }

    }

    count_components() {
        var jp = require('jsonpath');
        this.links.forEach(link => {
            if (link.type == "heading") {
                link.sort_index = 0;
                this.heading_count += 1;
            } else {
                this.commodity_count += 1;
                link.sort_index = 1;
            }
            var query_string = "$[?(@.goods_nomenclature_item_id == '" + link.id + "')]";
            var result = jp.query(this.leaves_data, query_string);
            if (result.length > 0) {
                link.leaf = true;
            } else {
                link.leaf = false;
            }


        });
    }

    sort_links() {
        this.links.sort(compare_types_codes);

        function compare_types_codes(a, b) {
            if (a.id > b.id) {
                return 1;
            }
            if (a.id < b.id) {
                return -1;
            }
            return 0;
        }
    }
}
module.exports = Search

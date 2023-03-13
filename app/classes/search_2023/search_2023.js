const e = require('express')
const axios = require('axios')
const Hit2023 = require('./hit_2023');

require('../global.js')

class Search2023 {
    constructor(req, response) {
        this.data = response.data
        this.included = response.included
        this.tree = Array(13).fill("");
        this.last_result = ""
        this.parse_data()
    }

    parse_data() {
        this.parse_commodities()
        this.sort_commodities()
        this.expand_commodities()
        this.build_hierarchy_narrative()
    }

    parse_commodities() {
        this.goods_nomenclatures = []
        this.commodities = []
        var entities = ["commodity", "subheading", "heading", "chapter",]
        this.goods_nomenclatures_dict = {}
        this.included.forEach(item => {
            if (entities.includes(item.type)) {
                var goods_nomenclature = new Hit2023(item)
                this.goods_nomenclatures.push(goods_nomenclature)
                this.goods_nomenclatures_dict[goods_nomenclature.id] = goods_nomenclature
            }
        });
    }

    expand_commodities() {
        this.goods_nomenclatures.forEach(goods_nomenclature => {
            goods_nomenclature.ancestors.forEach(ancestor => {
                ancestor.goods_nomenclature_item_id = this.goods_nomenclatures_dict[ancestor.id]["goods_nomenclature_item_id"]
                ancestor.description = this.goods_nomenclatures_dict[ancestor.id]["description"]
            });
            goods_nomenclature.populate_tree()
        });
    }

    sort_commodities() {
        this.goods_nomenclatures.sort(compare_gn)

        function compare_gn(a, b) {
            if (a.goods_nomenclature_item_id < b.goods_nomenclature_item_id) {
                return -1
            }
            if (a.goods_nomenclature_item_id > b.goods_nomenclature_item_id) {
                return 1
            }
            return 0
        }
    }

    build_hierarchy_narrative() {
        console.log("build_hierarchy_narrative")

        // Put the commodities into their own array
        var max_depth = 13
        this.previous_tree = Array(max_depth).fill(null);
        this.goods_nomenclatures.forEach(goods_nomenclature => {
            if (goods_nomenclature.type == "commodity") {
                this.commodities.push(goods_nomenclature)
            }
        });

        // Work out what to show in terms of ancestry
        var hit_count = this.commodities.length
        for (var i = 0; i < hit_count - 1; i += 1) {
            var c1 = this.commodities[i]
            if (c1.type == "chapter") {
                c1.indent = 0
            } else if (c1.type == "heading") {
                c1.indent = 1
            } else {
                c1.indent = c1.ancestors.length
            }
            for (var j = 0; j < c1.ancestors.length; j += 1) {
                if (this.previous_tree[j] == null) {
                    c1.ancestors[j].indent = j
                    c1.display_tree.push(c1.ancestors[j])
                } else if (c1.ancestors[j].id != this.previous_tree[j].id) {
                    c1.ancestors[j].indent = j
                    c1.display_tree.push(c1.ancestors[j])
                }
            }
            this.previous_tree = Array(max_depth).fill(null);
            for (var j = 0; j < c1.ancestors.length; j += 1) {
                this.previous_tree[j] = c1.ancestors[j]
            }
        }
        var a = 1
    }
}
module.exports = Search2023

const e = require('express')
const axios = require('axios')
const Ancestor2023 = require('./ancestor_2023');

require('../global.js')

class Hit2023 {
    constructor(data) {
        this.ancestors = []
        this.display_tree = []
        this.tree = Array(13).fill("");
        this.data = data
        this.id = this.data.id
        this.type = this.data.type
        this.indent = 0
        this.goods_nomenclature_item_id = this.data.attributes.goods_nomenclature_item_id
        this.productline_suffix = this.data.attributes.producline_suffix
        this.description = this.data.attributes.description
        this.heading_id = this.data.attributes.heading_id
        this.chapter_id = this.data.attributes.chapter_id
        this.data.relationships.ancestors.data.forEach(ancestor_data => {
            var ancestor = new Ancestor2023(ancestor_data)
            this.ancestors.push(ancestor)
        });
    }

    populate_tree() {
        var index = -1
        this.ancestors.forEach(ancestor => {
            index += 1
            this.tree[index] = ancestor
        });
        var a = 1
    }
}
module.exports = Hit2023

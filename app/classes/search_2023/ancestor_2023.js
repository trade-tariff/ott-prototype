const e = require('express')
const axios = require('axios')

require('../global.js')

class Ancestor2023 {
    constructor(data) {
        this.id = data.id
        this.type = data.type
        this.goods_nomenclature_item_id = ""
        this.description = ""
        this.indent = 0
    }

}
module.exports = Ancestor2023

class SearchHeading {
    constructor(hit) {
        this.id = hit.goods_nomenclature_item_id.substr(0, 4);
        if (hit.class == "heading") {
            this.description = hit.description;
        } else {
            this.description = hit.ancestor_1;
        }
        this.description_full = this.description;
        this.count = 1;

        // this.format_description();
    }

    format_description() {
        var ellipsize = require('ellipsize');
        this.description = ellipsize(this.description, 150);
    }
}
module.exports = SearchHeading
class AdditionalCode {
    constructor(item) {
        this.id = item["id"];
        this.code = item["attributes"]["code"];
        this.description = item["attributes"]["formatted_description"];
        this.additional_code_type = this.code[0];

        this.get_overlay();
    }

    get_overlay() {
        this.overlay = this.description;
        this.hint = "";
        var data = require('../data/additional_codes.json');
        var jp = require('jsonpath');
        var query_string = '$.data[?(@.code == "' + this.code + '")]'
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            this.overlay = result[0].overlay;
            this.hint = result[0].hint;
        }
    }

}
module.exports = AdditionalCode
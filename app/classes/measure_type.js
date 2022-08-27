class MeasureType {
    constructor(item) {
        this.id = item["id"];
        if (item.hasOwnProperty("attributes")) {
            this.description = item["attributes"]["description"];
            this.measure_type_series_id = item["attributes"]["measure_type_series_id"];
            this.get_type();
        } else {
            this.description = null;
            this.measure_type_series_id = null;
        }
        this.get_overlay();
    }

    get_type() {
        var financial_measure_type_series = ["C", "D", "F", "J", "M", "O", "P", "Q"];
        this.financial = financial_measure_type_series.includes(this.measure_type_series_id);
    }

    get_overlay() {
        var measure_types = require('../data/measure_types.json');
        var jp = require('jsonpath');
        var query_string = '$[?(@.measure_type == "' + this.id + '")]'
        var result = jp.query(measure_types, query_string);
        if (result.length > 0) {
            var res = result[0];
            if (res.overlay != "") {
                this.overlay = res.overlay;
            }
            if (res.hint != "") {
                this.hint = res.hint;
            }

        } else {
            this.overlay = ""; // this.description;
            this.hint = "";
        }
    }
}
module.exports = MeasureType
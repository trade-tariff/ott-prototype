class Unit {
    constructor(measurement_unit_code, measurement_unit_qualifier_code) {
        this.measurement_unit_code = measurement_unit_code;
        this.measurement_unit_qualifier_code = measurement_unit_qualifier_code;
        this.unit_value = "";
        if (this.measurement_unit_code == null) {
            this.measurement_unit_code = "";
        }
        this.unit_field = this.measurement_unit_code;
        if (this.measurement_unit_qualifier_code == null) {
            this.measurement_unit_qualifier_code = "";
        } else {
            this.unit_field += "-" + this.measurement_unit_qualifier_code;
        }



        this.unit_question = "";
        this.unit_hint = ""
        this.get_question();
    }

    get_question() {
        if (this.measurement_unit_code == "") {
            this.unit_question = "";
            this.unit_hint = "";
        } else {
            var json_units = require('./measurement_units2.json');
            json_units.forEach(item => {
                if ((item["measurement_unit_code"] == this.measurement_unit_code) && (item["measurement_unit_qualifier_code"] == this.measurement_unit_qualifier_code)) {
                    this.unit_question = item["unit_question"];
                    this.unit_hint = item["unit_hint"];
                    this.unit = item["unit"];
                }
            });
        }
    }
}
module.exports = Unit
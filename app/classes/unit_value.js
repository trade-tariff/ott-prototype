class UnitValue {
    constructor(unit_key, unit_value) {
        this.unit_key = unit_key;
        this.unit_value = unit_value;
        this.unit_key = this.unit_key.replace("unit_value_", "");
        this.unit_friendly = "";
        if (this.unit_key.indexOf("-") !== -1) {
            var parts = this.unit_key.split(" ");
            this.measurement_unit_code = parts[0];
            this.measurement_unit_qualifier_code = parts[1];
        } else {
            this.measurement_unit_code = this.unit_key;
            this.measurement_unit_qualifier_code = "";
        }
        this.get_friendly();
        this.unit_string = String(this.unit_value) + " " + this.unit_friendly;
    }

    get_friendly() {
        if (this.measurement_unit_code == "") {
            this.unit_question = "";
            this.unit_hint = "";
        } else {
            var json_units = require('./measurement_units2.json');
            json_units.forEach(item => {
                if ((item["measurement_unit_code"] == this.measurement_unit_code) && (item["measurement_unit_qualifier_code"] == this.measurement_unit_qualifier_code)) {
                    this.unit_friendly = item["unit"];
                }
            });
        }
    }
}
module.exports = UnitValue
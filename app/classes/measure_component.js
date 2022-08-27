const Unit = require('./unit');


class MeasureComponent {
    constructor(req, item) {
        this.id = item["id"];
        if (this.id == "2046830-01") {
            var a = 1;
        }
        this.duty_amount = item["attributes"]["duty_amount"];
        this.monetary_unit_code = item["attributes"]["monetary_unit_code"];
        // if (this.monetary_unit_code == "EUR") {
        //     this.monetary_unit_code = "GBP";
        //     this.duty_amount = this.duty_amount * req.session.data["exchange_rate"];
        // }
        this.monetary_unit_abbreviation = null;
        this.measurement_unit_code = item["attributes"]["measurement_unit_code"];
        this.measurement_unit_qualifier_code = null;
        this.unit = null;
        this.has_minimum = false;
        this.has_maximum = false;

        this.with_meursing = {
            "duty_expression_id": "01",
            "duty_amount": 0,
            "monetary_unit_code": "EUR",
            "measurement_unit_code": null,
            "measurement_unit_qualifier_code": null
        };

        // Get the additional code (for Meursing calcs)
        if (req != null) {
            this.meursing_code = req.session.data["meursing-code"];
        } else {
            this.meursing_code = "";
        }

        if (this.measurement_unit_code != null) {
            this.measurement_unit_combined = this.measurement_unit_code;
            if (this.measurement_unit_qualifier_code != null) {
                this.measurement_unit_combined += " " + this.measurement_unit_qualifier_code;
            }
            // this.unit = new Unit(this.measurement_unit_combined);
            this.unit = new Unit(this.measurement_unit_code, this.measurement_unit_qualifier_code);
        }

        this.duty_expression_description = item["attributes"]["duty_expression_description"];
        this.duty_expression_abbreviation = item["attributes"]["duty_expression_abbreviation"];
        this.meursing_duty_expressions = ["12", "14", "21", "25", "27", "29"];
        this.is_meursing = false;

        this.parse_id();
        this.check_specific();
        this.get_short_monetary_unit_code();
        this.get_duty_string();
    }

    get_short_monetary_unit_code() {
        var currencies = [
            {
                "long": "GBP",
                "short": "£"
            },
            {
                "long": "EUR",
                "short": "€"
            }
        ]
        //console.log(currencies);
        currencies.forEach(currency => {
            if (this.monetary_unit_code == currency["long"]) {
                this.monetary_unit_abbreviation = currency["short"];
            }
        });
    }

    check_specific() {
        if ((this.measurement_unit_code != null) || (this.is_meursing)) {
            this.specific = true;
        } else {
            this.specific = false;
        }
    }

    parse_id() {
        this.measure_id = this.id.substring(0, this.id.length - 3);
        this.duty_expression_id = this.id.substring(this.id.length - 2, this.id.length);
        //console.log(this.measure_id + ' : ' + this.duty_expression_id);
        if (this.meursing_duty_expressions.includes(this.duty_expression_id)) {
            this.is_meursing = true;
        } else {
            this.is_meursing = false;
        }
    }

    get_measurement_unit() {
        var measurement_units = require('./measurement_units.json');
        var s;
        s = this.measurement_unit_code;
        measurement_units.forEach(item => {
            if (item.measurement_unit_code == this.measurement_unit_code) {
                s = item.abbreviation;
            }
        });
        return (s);
    }

    get_qualifier() {
        return this.measurement_unit_qualifier_code
    }

    get_duty_string() {
        // var MAX_STRING = ") <i>or </i> (";
        // var MIN_STRING = ") <i>or </i> (";

        // var MAX_STRING = ") or<br>(";
        // var MIN_STRING = ") or<br>(";

        var MAX_STRING = "MAX ";
        var MIN_STRING = "MIN ";

        var decimal_places = 2;

        this.duty_string = "";
        var duty_amount = parseFloat(this.duty_amount)
        var duty_amount = duty_amount.toFixed(decimal_places);

        switch (this.duty_expression_id) {
            case "01":
                if (this.monetary_unit_code == null) {
                    this.duty_string += duty_amount + " %"; // + "% * customs value";
                } else {
                    this.duty_string += " " + this.monetary_unit_abbreviation + duty_amount + " ";
                    if (this.measurement_unit_code != null) {
                        this.duty_string += " / " + this.get_measurement_unit();
                        if (this.measurement_unit_qualifier_code != null) {
                            this.duty_string += " / " + this.get_qualifier();
                        }
                    }
                }
                break;
            case "04": // All three of these together
            case "19":
            case "20":
                // Do stuff
                if (this.monetary_unit_code == null) {
                    this.duty_string += " + " + duty_amount + " %"; // "% * customs value";
                } else {
                    this.duty_string += " + " + this.monetary_unit_abbreviation + duty_amount + " ";
                    if (this.measurement_unit_code != null) {
                        this.duty_string += " / " + this.get_measurement_unit();
                        if (this.measurement_unit_qualifier_code != null) {
                            this.duty_string += " / " + this.get_qualifier();
                        }
                    }
                }
                break;
            case "15":
                this.has_minimum = true;
                if (this.monetary_unit_code == null) {
                    this.duty_string += MIN_STRING + duty_amount + " %"; // * customs value";
                } else {
                    this.duty_string += MIN_STRING + this.monetary_unit_abbreviation + duty_amount + " ";
                    if (this.measurement_unit_code != null) {
                        this.duty_string += " / " + this.get_measurement_unit();
                        if (this.measurement_unit_qualifier_code != null) {
                            this.duty_string += " / " + this.get_qualifier();
                        }
                    }
                }
                break;

            case "17":
            case "35":
                this.has_maximum = true;
                if (this.monetary_unit_code == null) {
                    this.duty_string += MAX_STRING + duty_amount + " %"; // * customs value";
                } else {
                    this.duty_string += MAX_STRING + this.monetary_unit_abbreviation + duty_amount + " ";
                    if (this.measurement_unit_code != null) {
                        this.duty_string += " / " + this.get_measurement_unit();
                        if (this.measurement_unit_qualifier_code != null) {
                            this.duty_string += " / " + this.get_qualifier();
                        }
                    }
                }
                break;
            case "12":
                this.duty_string += " + <abbr title='Agricultural component'>AC</abbr>";
                break;
            case "14":
                this.duty_string += " + <abbr title='Reduced agricultural component'>AC (R)</abbr>";
                break;
            case "21":
                this.duty_string += " + <abbr title='Sugar duty'>SD</abbr>";
                break;
            case "27":
                this.duty_string += " + <abbr title='Flour duty'>FD</abbr>";
                break;
            case "25":
                this.duty_string += " + <abbr title='Reduced sugar duty'>SD (R)</abbr>";
                break;
            case "29":
                this.duty_string += " + <abbr title='Reduced flour duty'>FD (R)</abbr>";
                break;
        }
        this.duty_string_with_meursing = this.duty_string;
        //this.duty_string = "(" + this.duty_string + ")";

    }

    set_meursing_overlay(meursing_duties) {
        var array_ea = ["12", "14"]; // 674
        var array_sugar = ["21", "25"]; // 672
        var array_flour = ["27", "29"]; // 673

        if (array_ea.includes(this.duty_expression_id)) {
            meursing_duties.forEach(m => {
                if ((m["measure_type_id"] == "674") && (m["geographical_area_id"] == "1011")) {
                    this.with_meursing["duty_amount"] = m["duty_amount"];
                    var replacement = "<span class='meursing_replaced'>" + m["duty_amount"].toFixed(2).toString() + " EUR / 100kg</span>";
                    // var replacement = "<span class='meursing_replaced'>€" + m["duty_amount"].toString() + " / 100kg</span>";
                    this.duty_string_with_meursing = this.duty_string.replace("<abbr title='Reduced agricultural component'>AC (R)</abbr>", replacement);
                    this.duty_string_with_meursing = this.duty_string_with_meursing.replace("<abbr title='Agricultural component'>AC</abbr>", replacement);
                }
            });
        } else if (array_sugar.includes(this.duty_expression_id)) {
            meursing_duties.forEach(m => {
                if ((m["measure_type_id"] == "672") && (m["geographical_area_id"] == "1011")) {
                    this.with_meursing["duty_amount"] = m["duty_amount"];
                    // var replacement = "<span class='meursing_replaced'>€" + m["duty_amount"].toString() + " / 100kg</span>";
                    var replacement = "<span class='meursing_replaced'>" + m["duty_amount"].toFixed(2).toString() + " EUR / 100kg</span>";
                    this.duty_string_with_meursing = this.duty_string;
                    this.duty_string_with_meursing = this.duty_string_with_meursing.replace("<abbr title='Reduced sugar duty'>SD (R)</abbr>", replacement);
                    this.duty_string_with_meursing = this.duty_string_with_meursing.replace("<abbr title='Sugar duty'>SD</abbr>", replacement);
                }
            });
        } else if (array_flour.includes(this.duty_expression_id)) {
            meursing_duties.forEach(m => {
                if ((m["measure_type_id"] == "673") && (m["geographical_area_id"] == "1011")) {
                    this.with_meursing["duty_amount"] = m["duty_amount"];
                    // var replacement = "<span class='meursing_replaced'>€" + m["duty_amount"].toString() + " / 100kg</span>";
                    var replacement = "<span class='meursing_replaced'>" + m["duty_amount"].toFixed(2).toString() + " EUR / 100kg</span>";
                    this.duty_string_with_meursing = this.duty_string;
                    this.duty_string_with_meursing = this.duty_string_with_meursing.replace("<abbr title='Reduced flour duty'>FD (R)</abbr>", replacement);
                    this.duty_string_with_meursing = this.duty_string_with_meursing.replace("<abbr title='Flour duty'>FD</abbr>", replacement);
                    var a = 1;
                }
            });
        }
        // console.log(this.duty_string_with_meursing);
    }
}
module.exports = MeasureComponent
const axios = require('axios');
const { xor } = require('lodash');
const UnitValue = require('./unit_value');

class Error_handler {
    validate_date(req) {
        //console.log("Error handler: Validating date");
        var err = false;
        var import_date_day = req.session.data["import_date-day"];
        var import_date_month = req.session.data["import_date-month"];
        var import_date_year = req.session.data["import_date-year"];

        if (import_date_day > 31 || import_date_day < 1) {
            err = true;
            return err;
        }
        if (import_date_month > 12 || import_date_month < 1) {
            err = true;
            return err;
        }
        if (import_date_year < 2021) {
            err = true;
            return err;
        }

        const dayjs = require('dayjs');
        var date_string = import_date_year + "-" + import_date_month + "-" + import_date_day;
        let date_object = dayjs(date_string);
        req.session.data["date_string"] = date_object.format("D MMM YYYY");
    
        return (err);
    }

    validate_destination(req) {
        //console.log("Error handler: Validating destination");
        var err = false;
        var destination = req.session.data["destination"] + "";

        if ((destination == "") || (destination == "undefined")) {
            err = true;
            return err;
        }
        return (err);
    }

    validate_origin(req) {
        //console.log("Error handler: Validating origin");
        var err = false;
        var origin = req.session.data["origin"] + "";

        if ((origin == "") || (origin == "undefined")) {
            err = true;
            return err;
        }
        return (err);
    }

    validate_monetary_value(req) {
        //console.log("Error handler: Validating monetary value");
        var err = false;
        var monetary_value = req.session.data["monetary_value"] + "";
        var currency = req.session.data["currency"] + "";
        if (monetary_value == "") {
            err = true;
            return err;
        }
        // if ((currency == "") || (currency == "undefined")) {
        //     err = true;
        //     return err;
        // }
        return (err);
    }

    validate_unit_value(req) {
        //console.log("Error handler: Validating unit value");
        var err = false;
        var unit_values = [];
        req.session.data["unit_string"] = "";
        for (const key in req.session.data) {
            var key_value = req.session.data[key];
            var a = 1;
            if (key.indexOf("unit_value_") !== -1) {
                var v = new UnitValue(key, key_value)
                req.session.data["unit_string"] += v.unit_string;
                unit_values.push(v);
                console.log(`${key}: ${req.session.data[key]}`);
            }
        }
        req.session.data["unit_values"] = unit_values;
        var a = 1;


        var unit_value = req.session.data["unit_value"] + "";

        if (unit_value == "") {
            err = true;
            return err;
        }
        return (err);
    }

    validate_meursing(req) {
        //console.log("Error handler: Validating Meursing additional code");
        var err = false;
        var meursing_code = req.session.data["meursing_code"] + "";

        if (meursing_code.length != 3) {
            err = true;
            return err;
        } else {
            //var ret = this.check_meursing_code_exists(meursing_code);
            var ret = true;
            //console.log(ret);
            if (ret == true) {
                req.session.data["meursing_code"] = "7" + req.session.data["meursing_code"];
            } else {
                err = true;
                return err;
            }
        }
        return (err);
    }

    check_meursing_code_exists = async (meursing_code) => {
    //check_meursing_code_exists(meursing_code) {
        var ret;
        axios.get('http://127.0.0.1:5000/meursing_code_list')
            .then((response) => {
                var data = response.data;
                if (data.includes(meursing_code)) {
                    //console.log("Valid " + meursing_code);
                    ret = true;
                } else {
                    //console.log("Invalid " + meursing_code);
                    ret = false;
                }
            }).catch(({response}) => {
                ret = false;
            }).finally(() => {
                return (ret);
            });
        return (true);
    };
}


module.exports = Error_handler
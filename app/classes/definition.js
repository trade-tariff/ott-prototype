require("./global");

class Definition {
    constructor(item) {
        this.id = item["id"];
        this.initial_volume = item["attributes"]["initial_volume"];
        this.validity_start_date = item["attributes"]["validity_start_date"];
        this.validity_end_date = item["attributes"]["validity_end_date"];
        this.status = item["attributes"]["status"];
        this.description = item["attributes"]["description"];
        this.balance = item["attributes"]["balance"];
        this.measurement_unit = item["attributes"]["measurement_unit"];
        this.measurement_unit_qualifier = item["attributes"]["measurement_unit_qualifier"];

        //this.format_dates();
    }
    
    format_dates() {
        this.validity_start_date = format_date(this.validity_start_date);
        this.validity_end_date = format_date(this.validity_end_date);
    }
}
module.exports = Definition

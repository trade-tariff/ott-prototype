require("./global");

class LegalAct {
    constructor(item) {
        this.id = item["id"];
        this.friendly = null;
        this.initial_volume = item["attributes"]["initial_volume"];
        this.validity_start_date = item["attributes"]["validity_start_date"];
        this.validity_end_date = item["attributes"]["validity_end_date"];
        this.officialjournal_number = item["attributes"]["officialjournal_number"];
        this.officialjournal_page = item["attributes"]["officialjournal_page"];
        this.published_date = item["attributes"]["published_date"];
        this.regulation_code = item["attributes"]["regulation_code"];
        this.regulation_url = item["attributes"]["regulation_url"];

        this.get_friendly();
    }

    get_friendly() {
        if (this.id != "") {
            this.friendly = this.id.substr(0, 1) + this.id.substr(4, 4) + "/" + this.id.substr(1, 2); // D0202451 -> D2451/02
        }
    }
}
module.exports = LegalAct

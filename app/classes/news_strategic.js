class NewsStrategic {
    constructor(item) {
        this.id = item["id"];
        this.definition_id = null;
        this.definition = null;
        this.licensed = false;
        this.check_for_licensed_quota();

        try {
            var def_data = item["relationships"]["definition"]["data"];
            this.definition_id = def_data["id"];
        } catch (e) {
            // do nothing
        }
    }
}
module.exports = NewsStrategic

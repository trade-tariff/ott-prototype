class OrderNumber {
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

    check_for_licensed_quota() {
        if (this.id.substr(0, 3) == "094") {
            this.licensed = true;
        }
    }
}
module.exports = OrderNumber

// "relationships": {
//     "definition": {
//         "data": {
//             "id": "3069", xxxx
//             "type": "definition"
//         }
//     }
// }
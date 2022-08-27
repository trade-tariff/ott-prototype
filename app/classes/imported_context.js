class ImportedContext {
    constructor() {
        var a = 1;
    }

    get_origin_description() {
        const path = require('path');
        const fs = require('fs');
        var jp = require('jsonpath');

        const filename = path.join(__dirname, '../assets/data/geographical_areas.json');
        var data = fs.readFileSync(filename, 'utf8');
        data = JSON.parse(data);
        var query_string = '$.data[?(@.id == "' + this.origin + '")]'
        var result = jp.query(data, query_string);
        this.origin_description = result[0].attributes.description;
    }

    get_destination_description() {
        if (this.destination == "NI") {
            this.destination_description = "Northern Ireland";
        } else {
            this.destination_description = "England, Scotland or Wales";
        }
    }
}

module.exports = ImportedContext
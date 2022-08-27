const SearchFilterEntry = require('./search_filter_entry');

class SearchFilter {
    constructor(key, value = null) {
        var filter_data = require('../data/search/filters.json');
        var instance = filter_data[key.replace("filter_", "")];
        this.key = key;
        this.display_name = instance.display_name;
        this.level = instance.level;
        this.info = instance.info;
        this.values = [];
        if (value != null) {
            this.add_value(value);
        }
    }

    add_value(new_value) {
        var found = false;
        this.values.forEach(value => {
            if (value.value == new_value) {
                found = true;
                value.count += 1;
            }
        });
        if (!found) {
            var search_filter_entry = new SearchFilterEntry(new_value);
            this.values.push(search_filter_entry);
        }
    }

    sort_values() {
        this.values.sort(compare_filters);

        function compare_filters(a, b) {
            if (a.count > b.count) {
                return -1;
            }
            if (a.count < b.count) {
                return 1;
            }
            return 0;
        }
    }

}
module.exports = SearchFilter

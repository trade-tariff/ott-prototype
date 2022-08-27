class GeographicalArea {
    constructor(item = null) {
        if (item != null) {
            this.id = item["id"];
            this.description = item["attributes"]["description"];
            this.children_geographical_areas = [];
            this.members = [];
            this.member_strings = [];

            if (item.hasOwnProperty("relationships")) {
                var item2 = item["relationships"];
                if (item2.hasOwnProperty("children_geographical_areas")) {
                    this.children_geographical_areas = item["relationships"]["children_geographical_areas"]["data"];
                    this.has_members = true;
                    this.parse_members();
                }
            }
            this.country_name = this.get_country_description(this.id);
            this.check_area_type();
        } else {
            this.id = null;
            this.description = null;
            this.children_geographical_areas = [];
            this.members = [];
            this.member_strings = [];
            this.country_name = null;
        }
    }

    check_area_type() {
        var str = "Hello World!";
        if (this.id.length == 4) {
            this.geographical_area_code = 1 // Area group
        } else {
            this.geographical_area_code = 0 // Country
        }
        var n = str.length; 
    }

    get_country_description(id) {
        var country_name;
        var countries = require('../data/countries.json');
        countries.forEach(item => {
           if (item["geographical_area_id"] == id) {
               country_name = item["description"];
           }
        });
        return(country_name);
        
    }

    parse_members() {
        var member;
        if (this.has_members) {
            this.children_geographical_areas.forEach(cga => {
                member = new GeographicalArea();
                member.id = cga.id;
                member.description = this.get_country_description(member.id)
                this.members.push(member);
                this.member_strings.push(member.id);
            });
        }
        //this.children_geographical_areas = null;
    }

}
module.exports = GeographicalArea

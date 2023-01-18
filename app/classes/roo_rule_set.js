const RooRule = require('./roo_rule');

class RooRuleSet {
    constructor(rule_set, included) {
        this.included = included
        this.id = rule_set["id"]
        this.heading = rule_set["attributes"]["heading"]
        this.subdivision = rule_set["attributes"]["subdivision"]
        var tmp = rule_set["relationships"]["rules"]["data"]
        this.rule_ids = []
        tmp.forEach(element => {
            this.rule_ids.push(element["id"])
        });
        // this.summary = proof["summary"]
        // this.url = proof["url"]
        var a = 1
        this.get_rules()
        delete this.included
    }

    get_rules() {
        this.rules = []
        this.rule_ids.forEach(rule_object_id => {
            this.included.forEach(element => {
                var a = 1
                if (element["id"] == rule_object_id) {
                    var rule = new RooRule(element)
                    this.rules.push(rule)
                    var a = 1
                }
            });
        });
        var a = 1
    }

}
module.exports = RooRuleSet
const RooProof = require('./roo_proof');
const RooRuleSet = require('./roo_rule_set');

class RooScheme {
    constructor(scheme, included) {
        this.scheme = scheme
        this.included = included
        this.get_scheme_data()
    }

    get_scheme_data() {
        this.scheme_code = this.scheme["id"]
        this.title = this.scheme["attributes"]["title"]
        this.countries = this.scheme["attributes"]["countries"]
        this.proof_ids = this.scheme["relationships"]["proofs"]["data"]
        this.rule_set_ids = this.scheme["relationships"]["rule_sets"]["data"]
        this.rule_ids = this.scheme["relationships"]["rules"]["data"]

        this.get_proofs()
        this.get_rule_sets()
        this.get_country_strings()
        delete this.scheme
        delete this.included
    }

    get_proofs() {
        this.proofs = []
        this.proof_ids.forEach(proof_object => {
            this.included.forEach(element => {
                var a = 1
                if (element["id"] == proof_object["id"]) {
                    var proof = new RooProof(element["attributes"])
                    this.proofs.push(proof)
                }
            });
        });
        delete this.proof_ids
    }

    get_rule_sets() {
        this.rule_sets = []
        this.rule_set_ids.forEach(rule_set_object => {
            this.included.forEach(element => {
                if (element["id"] == rule_set_object["id"]) {
                    var rule_set = new RooRuleSet(element, this.included)
                    this.rule_sets.push(rule_set)
                }
            });
        });
        delete this.rule_ids
        delete this.rule_set_ids
    }

    get_country_strings() {
        this.country_strings = []
        var geo_dict = require('../data/geo_dict.json');
        this.countries.forEach(country => {
            if (geo_dict[country] !== undefined) {
                var country_string = geo_dict[country]["description"]
                this.country_strings.push(country_string)
            }
        });
        this.country_strings.sort()
    }

}
module.exports = RooScheme
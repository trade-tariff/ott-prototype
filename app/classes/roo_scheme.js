const RooProof = require('./roo_proof');
const RooRuleSet = require('./roo_rule_set');

class RooScheme {
    constructor(scheme, included) {
        this.scheme = scheme
        this.included = included
        this.get_scheme_data()
        var a = 1
    }

    get_scheme_data() {
        this.scheme_id = this.scheme["id"]
        this.title = this.scheme["attributes"]["title"]
        this.countries = this.scheme["attributes"]["countries"]
        this.proof_ids = this.scheme["relationships"]["proofs"]["data"]
        this.rule_set_ids = this.scheme["relationships"]["rule_sets"]["data"]
        this.rule_ids = this.scheme["relationships"]["rules"]["data"]
        var a = 1

        this.get_proofs()
        this.get_rule_sets()
    }

    get_proofs() {
        this.proofs = []
        this.proof_ids.forEach(proof_object => {
            this.included.forEach(element => {
                var a = 1
                if (element["id"] == proof_object["id"]) {
                    var proof = new RooProof(element["attributes"])
                    this.proofs.push(proof)
                    var a = 1
                }
            });
        });
        var a = 1
    }

    get_rule_sets() {
        this.rule_sets = []
        this.rule_set_ids.forEach(rule_set_object => {
            this.included.forEach(element => {
                var a = 1
                if (element["id"] == rule_set_object["id"]) {
                    var rule_set = new RooRuleSet(element, this.included)
                    this.rule_sets.push(rule_set)
                    var a = 1
                }
            });
        });
        var a = 1
    }

}
module.exports = RooScheme
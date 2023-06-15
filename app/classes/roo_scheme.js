const RooProof = require('./roo_proof');
const RooRuleSet = require('./roo_rule_set');

class RooScheme {
    constructor(scheme, included = null) {
        this.scheme = scheme
        this.proofs = []
        if (included == null) {
            this.get_scheme_data_from_config()
            this.get_proofs_from_local_config()
        } else {
            this.included = included
            this.get_scheme_data_from_api()
            this.get_proofs_from_local_config()
        }
        var a = 1
    }

    get_scheme_data_from_config() {
        this.scheme_code = this.scheme["scheme_code"]
        this.title = this.scheme["title"]
        // this.proofs_source = this.scheme["proofs"]["documents"]
        this.proofs_source = this.scheme["proof_codes"]
        this.cumulation_methods = this.scheme["cumulation_methods"]
        this.ord = this.scheme["ord"]
        this.articles = this.scheme["articles"]
        this.features = this.scheme["features"]
        this.introductory_notes_file = this.scheme["introductory_notes_file"]
        this.fta_intro_file = this.scheme["fta_intro_file"]
        this.links = this.scheme["links"]
        this.countries = this.scheme["countries"]
    }

    get_scheme_data_from_api() {
        this.scheme_code = this.scheme["id"]
        this.title = this.scheme["attributes"]["title"]
        this.countries = this.scheme["attributes"]["countries"]
        this.proof_ids = this.scheme["relationships"]["proofs"]["data"]
        this.rule_set_ids = this.scheme["relationships"]["rule_sets"]["data"]
        this.rule_ids = this.scheme["relationships"]["rules"]["data"]

        // this.get_proofs_from_api()
        this.get_rule_sets()
        this.get_country_strings()
        delete this.scheme
        delete this.included
    }

    get_proofs_from_api() {
        // Gets proofs from the remote API
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

    get_schemes_file() {
        var jp = require('jsonpath')
        var data = require('../data/roo/uk/roo_schemes_uk.json');
        data = data['schemes']
        this.scheme_code = "dcts-ldcs"
        var query_string = "$[?(@.scheme_code == '" + this.scheme_code + "')]"
        var my_schemes = jp.query(data, query_string)
        my_schemes.forEach(scheme => {
            this.proofs_source = scheme["proofs"]
            // this.proofs_source = scheme["proof_codes"]
        });
    }

    get_proofs_from_local_config() {
        if (typeof this.proofs_source === 'undefined') {
            this.get_schemes_file()
        }
        // Gets proofs from local config and MD files
        this.proofs = []

        this.proofs_source.forEach(proof_obj => {
            var proof = new RooProof(proof_obj, this.scheme_code)
            this.proofs.push(proof)
        });
        var a = 1
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
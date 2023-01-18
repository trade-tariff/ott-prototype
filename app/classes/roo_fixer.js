const RooScheme = require('./roo_scheme');

class RooFixer {
    constructor(roo_data, context) {
        this.data = roo_data.data
        this.included = roo_data.included
        this.context = context
        this.roo_schemes = []
        this.proof_overlays = {}

        this.parse_data()
        this.get_schemes_file()
        this.apply_subtexts()

        delete this.data
        delete this.included
        delete this.context
    }

    parse_data() {
        this.scheme_count = this.data.length
        this.data.forEach(scheme => {
            var roo_scheme = new RooScheme(scheme, this.included)
            this.roo_schemes.push(roo_scheme)
        });

        this.scheme_codes = []
        this.roo_schemes.forEach(scheme => {
            this.scheme_codes.push(scheme.scheme_code)
        });
    }

    get_schemes_file() {
        var data = require('../data/roo/uk/roo_schemes_uk.json');
        var schemes = data["schemes"]
        schemes.forEach(scheme => {
            if (this.scheme_codes.includes(scheme.scheme_code)) {
                this.proof_overlays[scheme.scheme_code] = scheme.proofs
            }
        });
        delete this.scheme_codes
    }

    apply_subtexts() {
        this.roo_schemes.forEach(roo_scheme => {
            var subtexts = this.proof_overlays[roo_scheme.scheme_code]
            roo_scheme.proofs.forEach(proof => {
                subtexts.forEach(subtext => {
                    if (subtext.summary == proof.summary) {
                        proof.subtext = subtext.subtext
                        var a = 1
                    }
                });
            });
        });
    }
}
module.exports = RooFixer
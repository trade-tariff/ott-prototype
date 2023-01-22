const RooScheme = require('./roo_scheme');

class RooProofs {
    constructor(context) {
        this.context = context
        this.roo_schemes = []
        this.proof_overlays = {}

        this.get_schemes_file()
    }


    get_schemes_file() {
        var data = require('../data/roo/uk/roo_schemes_uk.json');
        this.schemes_source = data["schemes"]
        this.schemes = []
        this.schemes_source.forEach(scheme => {
            var roo_scheme = new RooScheme(scheme)
            this.roo_schemes.push(roo_scheme)
        });
    }
}
module.exports = RooProofs
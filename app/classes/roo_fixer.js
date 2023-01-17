const RooScheme = require('./roo_scheme');

class RooFixer {
    constructor(roo_data, context) {
        this.data = roo_data.data
        this.included = roo_data.included
        this.context = context
        this.roo_schemes = []

        this.parse_data()
        var a = 1
    }

    parse_data() {
        this.scheme_count = this.data.length
        this.data.forEach(scheme => {
            var roo_scheme = new RooScheme(scheme, this.included)
            this.roo_schemes.push(roo_scheme)
        });
        delete this.data
        delete this.included
        delete this.context
    }
}
module.exports = RooFixer
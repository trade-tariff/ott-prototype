class Footnote {
    constructor(code, description) {
        this.code = code;
        this.description = description;

        this.classify();
    }

    classify() {
        this.footnote_type = this.code.substr(0, 2);
        var commodity_types = [
            "PN",
            "NC",
            "TN"
        ]
        if (commodity_types.includes(this.footnote_type)) {
            this.footnote_class = "commodity";
        } else {
            this.footnote_type = "measure";
        }
    }
}
module.exports = Footnote
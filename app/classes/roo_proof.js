var MarkdownIt = require('markdown-it')


class RooProof {
    constructor(proof, scheme_code = null) {
        this.summary = proof["summary"]
        this.proof_class = proof["proof_class"]
        this.url = proof["url"]
        this.subtext = ""
        if (scheme_code != null) {
            this.scheme_code = scheme_code
            this.get_real_subtext()
        }
    }

    get_real_subtext(self) {
        const path = require('path')
        var fs = require('fs');

        var folder = process.cwd() + "/app/data/roo/proofs/proofs-by-scheme"
        folder = path.join(folder, this.scheme_code)
        var filename = path.join(folder, this.proof_class + ".md")
        console.log(filename)
        if (fs.existsSync(filename)) {
            var data = fs.readFileSync(filename, 'utf8');
            var md = new MarkdownIt();
            this.html_content = md.render(data);
            this.html_content = this.govify(this.html_content);
        }
        else {
            this.html_content = "Missing"
        }
    }

    govify(s) {
        s = s.replace(/<a /g, "<a target='_blank' ");
        s = s.replace(/<h1/g, "<h1 class='govuk-heading-l'");
        s = s.replace(/<h2/g, "<h2 class='govuk-heading-m'");
        s = s.replace(/<h3/g, "<h3 class='govuk-heading-s'");
        s = s.replace(/<h4/g, "<h4 class='govuk-heading-s'");
        s = s.replace(/<ul/g, "<ul class='govuk-list govuk-list--bullet'");
        s = s.replace(/<ol/g, "<ol class='govuk-list govuk-list--number'");

        s = s.replace(/<h3 class='govuk-heading-s'>([^<]*)<\/h3>/gm, "<h3 class='govuk-heading-s' id='$1'>$1</h3>");

        return (s);
    }

}
module.exports = RooProof
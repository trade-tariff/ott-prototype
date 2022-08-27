var MarkdownIt = require('markdown-it');
const Commodity = require('./commodity.js');
const axios = require('axios');
const GlossaryTerm = require('./glossary_term.js');

class Roo {
    constructor(req, key) {

        this.key = key;
        this.get_eu_countries();
        this.content = "";
        this.commodity = null;
        this.product_specific_rules = []

        this.get_roo_config();
    }

    get_roo_config() {
        var data = require('../data/roo/xi/roo_schemes.json');
        var jp = require('jsonpath');
        if (this.key.length == 2) {
            var query_string = "$.schemes[?(@.countries.indexOf('" + this.key + "') != -1)]";
        } else {
            var query_string = "$.schemes[?(@.code =='" + this.key + "')]";
        }
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            var my_node = result[0];
            this.code = my_node["code"];
            this.links = my_node["links"];
            this.title = my_node["title"];

            this.filename = my_node["fta_intro_file"];
            if (this.filename != "") {
                var filename = 'app/data/roo/' + this.filename;

                var fs = require('fs');
                var data = fs.readFileSync(filename, 'utf8');
                var md = new MarkdownIt();
                this.content = md.render(data);
                this.content = this.govify(this.content);
            }
        }
    }

    set_commodity(commodity) {
        var a = 1;
        this.commodity = commodity;
    }

    get_rules() {
        // This bit of JSONPath allows you to search between 2 extents
        var data = require('../data/roo/eu.json');
        var jp = require('jsonpath');
        var query_string = '$[?(@.key_first <= "' + this.commodity + '" && @.code_high >= "' + this.commodity + '")]'
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            this.rule_of_origin = result[0].rule_of_origin;
            this.product_specific_rules = result[0].product_specific_rules;
            var a = 1;
        } else {
            this.rule_of_origin = "";
        }
        this.get_abbreviations();

    }

    get_all_abbreviations(file = "", title = "") {
        this.glossary_terms = [];
        if (file == "") {
            var terms = ["CC", "CTC", "CTH", "CTSH", "RVC", "MaxNOM", "EXW", "sub-heading", "heading", "Accumulation"];
            this.title = "";
        } else {
            var terms = [file];
            this.title = title;
        }
        terms.forEach(term => {
            var path = "app/data/roo/definitions/" + term + ".md";
            var fs = require('fs');
            var data = fs.readFileSync(path, 'utf8');
            var md = new MarkdownIt();
            var description = md.render(data);
            description = this.govify(description);

            var glossary_term = new GlossaryTerm();
            glossary_term.term = term;
            glossary_term.description = description;
            this.glossary_terms.push(glossary_term);
        });
    }

    get_abbreviations() {
        this.abbreviations = "";
        var terms = ["CTC", "CC", "CTH", "MaxNOM", "EXW", "sub-heading", "heading"];
        terms.forEach(term => {
            if (this.rule_of_origin.indexOf(term) !== -1) {
                var path = "app/data/roo/definitions/" + term + ".md";
                var fs = require('fs');
                var data = fs.readFileSync(path, 'utf8');
                var md = new MarkdownIt();
                var abbreviation = md.render(data);
                abbreviation = this.govify(abbreviation);
                this.abbreviations += abbreviation;
            }
        });
    }

    get_content(filename) {
        var path = "app/data/roo/" + this.key + "/" + filename + ".md";
        var fs = require('fs');
        var data = fs.readFileSync(path, 'utf8');
        var md = new MarkdownIt();
        this.text = md.render(data);
        this.text = this.govify(this.text);
    }

    get_eu_countries() {
        var eu_countries = ["BE", "FR", "DE", "NL", "LU", "ES", "PL", "PT", "IT", "SV", "FI", "SL", "SK", "LT", "LV", "AT", "ML", "CY", "GR", "HN", "EU"];
        if (eu_countries.includes(this.key.toUpperCase())) {
            this.key = "EU";
        }
    }

    govify(s) {
        s = s.replace(/<h1/g, "<h1 class='govuk-heading-l'");
        s = s.replace(/<h2/g, "<h2 class='govuk-heading-m'");
        s = s.replace(/<h3/g, "<h3 class='govuk-heading-s'");
        s = s.replace(/<ul/g, "<ul class='govuk-list govuk-list--bullet'");
        s = s.replace(/<ol/g, "<ol class='govuk-list govuk-list--number'");
        return (s);
    }

}
module.exports = Roo
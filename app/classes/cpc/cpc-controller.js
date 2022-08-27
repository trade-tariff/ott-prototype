var path = require('path');
var fs = require('fs');
var MarkdownIt = require('markdown-it');
var jp = require('jsonpath');

class CPCController {
    constructor() {
        this.data_category = "";
        this.permitted_procedure_codes = [];
        this.request_codes = [];
        this.previous_codes = [];
        this.get_content_path();
    }

    get_content_path() {
        this.path = path.join(__dirname, '..');
        this.path = path.join(this.path, '..');
        this.path = path.join(this.path, 'data');
        this.path = path.join(this.path, 'cpc');
        this.path_cpc = path.join(this.path, 'markdown-cpc');
        this.path_apc = path.join(this.path, 'markdown-apc');
    }

    get_declaration_categories(scope) {
        var content = require('../../data/cpc/cpc-categories.json');
        var query_string = "$[?(@.scope.indexOf('" + scope + "') != -1)]"
        var result = jp.query(content, query_string);
        this.declaration_categories = result;
    }

    get_request_codes() {
        var content = require('../../data/cpc/cpc-combos.json');
        this.request_codes = content;
        this.sort_request_codes();
    }

    sort_request_codes() {
        this.request_codes.sort(compare_request_codes_by_sequence);

        function compare_request_codes_by_sequence(a, b) {
            if (a.sequence > b.sequence) {
                return 1;
            }
            if (a.sequence < b.sequence) {
                return -1;
            }
            return 0;
        }
    }

    get_previous_codes() {
        var content = require('../../data/cpc/cpc-combos.json');
        if (this.request_code != "") {
            var query_string = '$[?(@.request_code == "' + this.request_code + '")].previous_codes';
            var result = jp.query(content, query_string);
            this.previous_codes = result[0];
            // this.previous_codes.forEach(code => {
            //     code.description = code.description.replace('OSR', 'Onward Supply Relief (OSR)');
            //     code.description = code.description.replace('CW', 'Customs Warehousing (CW)');
            //     code.description = code.description.replace('IP', 'Inward Processing (IP)');
            //     code.description = code.description.replace('OP', 'Outward Processing (OP)');
            //     code.description = code.description.replace('TA', 'Temporary Admission (TA)');
            //     code.description = code.description.replace('FZ', 'Free Zone (FZ)');
            // });
            var a = 1;
        }
    }

    get_request_code_notes() {
        var filename1 = this.request_code + "-notes.md";
        var filename2 = this.request_code + "-completion-notes.md";
        var filepath1 = path.join(this.path_cpc, filename1);
        var filepath2 = path.join(this.path_cpc, filename2);

        // Get notes
        var data = fs.readFileSync(filepath1, 'utf8');
        var md = new MarkdownIt();
        this.request_code_notes = md.render(data);
        this.request_code_notes = this.govify(this.request_code_notes);

        // Get completion notes
        var data = fs.readFileSync(filepath2, 'utf8');
        var md = new MarkdownIt();
        this.request_code_completion_notes = md.render(data);
        this.request_code_completion_notes = this.govify(this.request_code_completion_notes);
    }

    get_previous_code_notes() {
        this.previous_code_description = this.get_previous_code_content("description");
        this.previous_code_conditions = this.get_previous_code_content("conditions");
        this.previous_code_restrictions = this.get_previous_code_content("restrictions");
    }

    get_apc_notes() {
        var filename = this.apc + ".md";
        var filepath = path.join(this.path_apc, filename);
        var data = fs.readFileSync(filepath, 'utf8');
        var md = new MarkdownIt();
        var temp = md.render(data);
        this.apc_notes = this.govify(temp);
    }

    get_previous_code_content(content_type) {
        var filename = this.previous_code + "-" + content_type + ".md";
        var filepath = path.join(this.path_cpc, filename);
        var data = fs.readFileSync(filepath, 'utf8');
        var md = new MarkdownIt();
        var temp = md.render(data);
        temp = this.govify(temp);
        return (temp);
    }

    get_additional_code_content() {
        // Get the notes
        var filename = this.apc + ".md";
        var filepath = path.join(this.path_apc, filename);
        var data = fs.readFileSync(filepath, 'utf8');
        var md = new MarkdownIt();
        var temp = md.render(data);
        this.apc_notes = this.govify(temp);

        // Get the title
        var apc_content = require('../../data/cpc/apcs.json');
        var query_string = '$[?(@.code == "' + this.apc + '")]';
        var result = jp.query(apc_content, query_string);
        this.apc_description = result[0].description;
    }

    govify(s) {
        s = s.replace(/<h1/g, "<h1 class='govuk-heading-l govuk-!-margin-bottom-1'");
        s = s.replace(/<h2/g, "<h2 class='govuk-heading-m govuk-!-margin-bottom-1'");
        s = s.replace(/<h3/g, "<h3 class='govuk-heading-s govuk-!-margin-bottom-1'");
        s = s.replace(/<h4/g, "<h4 class='govuk-heading-s govuk-!-margin-bottom-1'");
        s = s.replace(/<ul/g, "<ul class='govuk-list govuk-list--bullet'");
        return (s);
    }

    get_apcs() {
        var content = require('../../data/cpc/cpc-combos.json');
        if (this.previous_code != "") {
            var query_string = '$..[?(@.code == "' + this.previous_code + '")]';
            var result = jp.query(content, query_string);
            result = result[0];
            this.union_apcs = result.union_apcs;
            this.national_apcs = result.national_apcs;
            var a = 1;
        }

        var apc_content = require('../../data/cpc/apcs.json');

        this.union_apcs2 = [];
        for (var i = 0; i < this.union_apcs.length; i++) {
            var tmp = this.union_apcs[i];
            var query_string = '$[?(@.code == "' + tmp + '")]';
            var result = jp.query(apc_content, query_string);
            result = result[0];
            this.union_apcs2.push(result);
        }

        this.national_apcs2 = [];
        for (var i = 0; i < this.national_apcs.length; i++) {
            var tmp = this.national_apcs[i];
            var query_string = '$[?(@.code == "' + tmp + '")]';
            var result = jp.query(apc_content, query_string);
            result = result[0];
            this.national_apcs2.push(result);
        }
        var a = 1;
    }

    // get_request_codes_safe() {
    //     var content = require('../../data/cpc/cpc-categories.json');
    //     if (this.data_category != "") {
    //         var query_string = '$[?(@.code == "' + this.data_category + '")]';
    //         var _ = require('lodash');
    //         var result = jp.query(content, query_string);
    //         if (result.length > 0) {
    //             var a = 1;
    //             this.permitted_procedure_codes = result[0]["permitted_procedure_codes"];
    //             var content = require('../../data/cpc/cpc-request-codes.json');

    //             var match_string = "";
    //             this.permitted_procedure_codes.forEach(ppc => {
    //                 match_string += "@.code =='" + ppc + "' || ";
    //             });
    //             match_string = _.trimEnd(match_string, " || ");

    //             var query_string = '$[?(match)]';
    //             query_string = query_string.replace("match", match_string);
    //             var result = jp.query(content, query_string);
    //             this.request_codes = result;
    //             var a = 1;
    //         }
    //     }
    // }

}
module.exports = CPCController

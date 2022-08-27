const Unit = require('./unit');
var MarkdownIt = require('markdown-it');
var _ = require('lodash');


class MeasureConditionCodeGroup {
    constructor(condition_code, condition) {
        this.condition_code = condition_code;
        if (typeof this.condition_code === 'undefined') {
            this.condition_code = "";
        }

        this.condition = condition;
        if (typeof this.condition !== 'undefined') {
            this.condition = this.condition.substring(3);
        } else {
            this.condition = "";
        }
        this.overlay = "";
        this.subtext_single = "";
        this.subtext_multiple = "";
        this.intro_text = "";
        this.columns = [];
        this.get_overlay();
        this.measure_conditions = [];
    }

    get_overlay() {
        var jp = require('jsonpath');
        var data = require('../data/action_codes/action_codes_overlay.json');
        var query_string = '$.condition_code_overlays[?(@.condition_code == "' + this.condition_code + '")]';
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            this.overlay = result[0].overlay;
            this.intro_text = result[0].intro_text;
            this.subtext_single = result[0].subtext_single;
            this.subtext_multiple = result[0].subtext_multiple;
            this.requirement_prefix = result[0].requirement_prefix;
            this.show_5a5b = result[0].show_5a5b;
            this.columns = result[0].columns;
            if (this.overlay != "") {
                this.condition = this.overlay;
            }
        } else {
            // defaults
            this.overlay = "";
            this.intro_text = "";
            this.subtext_single = "You must meet this condition.";
            this.subtext_multiple = "You must meet one of these conditions.";
            this.requirement_prefix = "";
            this.show_5a5b = true;
            this.columns = [{
                "field": "document_code",
                "label": "Document code"
            },
            {
                "field": "requirement",
                "label": "Requirement"
            },
            {
                "field": "action",
                "label": "Action"
            }]
        }
    }
}
module.exports = MeasureConditionCodeGroup
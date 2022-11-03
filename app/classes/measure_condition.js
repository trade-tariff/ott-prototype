const Unit = require('./unit');
var MarkdownIt = require('markdown-it');
var _ = require('lodash');


class MeasureCondition {
    constructor(req, item) {
        this.action_codes_that_apply_duties = ['01', '02', '03', '11', '12', '13', '15', '27', '34']
        this.id = item["id"];
        if (this.id == 1633480) {
            var a = 1;
        }
        this.action = item["attributes"]["action"];
        this.action_code = item["attributes"]["action_code"];
        this.condition = item["attributes"]["condition"];
        this.condition_code = item["attributes"]["condition_code"];
        this.condition_duty_amount = item["attributes"]["condition_duty_amount"];
        this.condition_measurement_unit_code = item["attributes"]["condition_measurement_unit_code"];
        this.condition_measurement_unit_qualifier_code = item["attributes"]["condition_measurement_unit_qualifier_code"];
        this.condition_monetary_unit_code = item["attributes"]["condition_monetary_unit_code"];
        this.document_code = item["attributes"]["document_code"] + "";
        this.duty_expression = item["attributes"]["duty_expression"];
        this.requirement = item["attributes"]["requirement"];
        this.instance_count = 1;
        this.condition_class = "";
        this.condition_class_index = null;
        this.display_action_column = false;

        this.condition_subtext_single = "";
        this.condition_subtext_multiple = "";

        this.get_measure_condition_class();

        this.appendix_5a = {};
        this.appendix_5a.guidance_cds = "";
        this.appendix_5a.guidance_chief = "";
        this.appendix_5a.description = "";

        this.trim_requirement();
        this.check_positivity();
        this.check_condition_class();
        this.get_appendix_5a();
        // this.overlay_action();
    }

    overlay_action() {
        var jp = require('jsonpath');
        var data = require('../data/action_codes/action_codes_overlay.json');

        // Get overlay for action
        var query_string = '$.action_code_overlays[?(@.action_code == "' + this.action_code + '")]';
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            this.action = result[0]["overlay"];
        }

        // Get overlay for condition code
        var query_string = '$.condition_code_overlays[?(@.condition_code == "' + this.condition_code + '")]';
        var result = jp.query(data, query_string);
        if (result.length > 0) {
            this.condition = result[0]["overlay"];
            this.condition_subtext_single = result[0]["subtext_single"];
            this.condition_subtext_multiple = result[0]["subtext_multiple"];
        }
    }

    get_measure_condition_class() {
        if (this.condition_code == "V") {
            this.measure_condition_class = "eps";
        } else {
            var a = 1;
        }
    }

    check_condition_class() {
        if (this.positive) {
            if (this.document_code == "") {
                if (this.condition_code == "V") {
                    var a = 1;
                    this.condition_class = "threshold";
                    this.intro_label = "";
                    this.condition_class_label = "";
                    this.condition_class_index = 3;
                    this.document_code = "";
                    this.display_action_column = true;
                    this.measure_condition_class = "eps";

                } else if (this.action_codes_that_apply_duties.includes(this.action_code)) {
                    this.intro_label = "Documentation requirement";
                    this.condition_class = "certificate";
                    this.condition_class_label = "Rule";
                    this.condition_class_index = 1;
                    this.document_code = "n/a"
                    this.requirement = "No document provided";
                    this.display_action_column = true;
                    this.measure_condition_class = "duty_influencing";
                } else {
                    this.condition_class = "threshold";
                    this.intro_label = "Threshold condition";
                    this.condition_class_label = "Exemption";
                    this.condition_class_index = 3;
                    this.document_code = "n/a"
                    this.measure_condition_class = "threshold";

                    const regex = /<span>(.*)<\/span> <abbr title='(.*)'>/gm;
                    var m = regex.exec(this.requirement);
                    if (m != null) {
                        if (m.length > 2) {
                            if (m[2] == "Litre") {
                                this.requirement = "<span class='threshold'>Volume threshold (ltr)</span><br />The volume of the imported goods does not exceed " + Math.round(m[1]) + " litres."
                            }
                            else if (m[2] == "Kilogram") {
                                this.requirement = "<span class='threshold'>Weight threshold (kg)</span><br />The weight of the imported goods does not exceed " + Math.round(m[1]) + " kilogrammes."
                            }
                        }
                    }
                }

            } else if (this.document_code.substring(0, 1) == "Y") {
                this.condition_class = "exception";
                this.intro_label = "Conditional exemption";
                this.condition_class_index = 2;
                this.condition_class_label = "Exemption";
                this.display_action_column = false;
                this.measure_condition_class = "exemption";
            } else if (this.document_code == "C084") {
                this.intro_label = "Conditional exemption";
                this.condition_class = "exception";
                this.condition_class_label = "Exemption";
                this.condition_class_index = 2;
                this.display_action_column = false;
                this.measure_condition_class = "exemption";
            } else {
                this.intro_label = "Documentation requirement";
                this.condition_class = "certificate";
                this.condition_class_label = "Rule";
                this.condition_class_index = 1;
                this.display_action_column = false;
                this.measure_condition_class = "certificate";
            }
        } else {
            this.intro_label = "";
            this.condition_class = "negative";
            this.condition_class_label = "";
            this.condition_class_index = 99;
        }

    }

    append_condition(mc) {
        console.log("Appending a condition");

        var conjunction_string = " & ";
        if (this.condition_class == "certificate") {
            if (mc.condition_class == "certificate") {
                this.requirement = "Provide both of these documents:<br><br><b>" + this.document_code + "</b> " + this.requirement;
                this.requirement += "<br><br><span class='conjunction'>and</span><br><br><b>" + mc.document_code + "</b> " + mc.requirement;
                this.document_code += conjunction_string + mc.document_code;
            } else if (mc.condition_class == "exception") {
                this.requirement += " <br><br><i>and</span><br><br> " + mc.requirement;
                this.document_code += conjunction_string + mc.document_code;
            } else if (mc.condition_class == "threshold") {
                this.requirement += " <br><br><span class='conjunction'>and</span><br><br> " + mc.requirement;
            }
        }
        else if (this.condition_class == "exception") {
            if (mc.condition_class == "exception") {
                this.requirement += " <br><br><span class='conjunction'>and</span><br><br> " + mc.requirement;
                this.document_code += conjunction_string + mc.document_code;
            } else if (mc.condition_class == "threshold") {
                if (this.requirement.toLowerCase().includes("your shipment")) {
                    mc.requirement = mc.requirement.replace(/your shipment/gsmi, "");
                }
                this.requirement += " <br><br><span class='conjunction'>and</span><br><br> " + mc.requirement;
            }
        }
    }

    trim_requirement() {
        if (this.requirement != null) {
            var regex = /.*: (.*)/gm;
            var repl = "$1";
            this.requirement = this.requirement.replace(regex, repl);
        } else {
            this.requirement = null;
        }
    }

    check_positivity() {
        var negative_actions = [
            "The entry into free circulation is not allowed",
            "Export is not allowed",
            "Import is not allowed",
            "Measure not applicable",
            "Declared subheading not allowed",
            "Import/export not allowed after control",
            "Declaration to be corrected  - box 33, 37, 38, 41 or 46 incorrect"
        ]
        if (negative_actions.includes(this.action)) {
            this.positive = false;
        } else {
            this.positive = true;
        }
    }

    get_appendix_5a() {
        var jp = require('jsonpath');
        if (this.document_code == "n/a") {
            var a = 1; 
        }
        if ((this.document_code != "") && (this.document_code != "unspecified") && (this.document_code != "n/a")) {
            var data = require('../data/appendix-5a/chief_cds_guidance.json');
            // var query_string = '$.document_codes[?(@.code == "' + this.document_code + '")]';
            // var query_string = '$.[?(@.code == "' + this.document_code + '")]';
            var query_string = "$." + this.document_code;
            var result
            try {
                result = jp.query(data, query_string);
            } catch (error) {
                result = []
            }

            if (result.length > 0) {
                var guidance_cds = result[0].guidance_cds;
                var guidance_chief = result[0].guidance_chief;
                var applies_to_chief = result[0].applies_to_chief;

                var md = new MarkdownIt();
                this.appendix_5a.guidance_cds = md.render(guidance_cds);
                this.appendix_5a.guidance_chief = md.render(guidance_chief);

                var status_codes = require('../data/appendix-5a/chief_cds_guidance.json'); 
                status_codes = status_codes["status_codes"]; 

                if (this.document_code == "N990") {
                    var a = 1;
                }

                if (1 > 2) {
                    for (const [key, value] of Object.entries(status_codes)) {
                        var find_me = "(" + key + ")";
                        var replace_with = "<abbr title='" + value + "'>$1</abbr>";
                        var re = new RegExp(find_me, "g");
                        this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(re, replace_with);
                        this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(re, replace_with);

                        var find_me = "(" + key + "),";
                        var replace_with = "<abbr title='" + value + "'>$1</abbr>,";
                        var re = new RegExp(find_me, "g");
                        this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(re, replace_with);
                        this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(re, replace_with);

                        var find_me = "(" + key + ")\</p\>";
                        var replace_with = "<abbr title='" + value + "'>$1</abbr></p>";
                        var re = new RegExp(find_me, "g");
                        this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(re, replace_with);
                        this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(re, replace_with);

                        var find_me = "(" + key + ")\\*";
                        var replace_with = "<abbr title='" + value + "'>$1</abbr>* ";
                        var re = new RegExp(find_me, "g");
                        this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(re, replace_with);
                        this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(re, replace_with);
                    }
                }

                this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(/<ul>/g, "<ul class='govuk-list govuk-list--bullet'>")
                this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(/<ul>/g, "<ul class='govuk-list govuk-list--bullet'>")

                this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(/&lt;/g, "<")
                this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(/&lt;/g, "<")

                this.appendix_5a.guidance_cds = this.appendix_5a.guidance_cds.replace(/&gt;/g, ">")
                this.appendix_5a.guidance_chief = this.appendix_5a.guidance_chief.replace(/&gt;/g, ">")
                var a = 1
            }
        }
    }

    get_status_code_descriptions() {
        var status_codes = require('../data/appendix-5a/chief_cds_guidance.json');
        status_codes = status_codes["status_codes"];
        this.status_code_descriptions = [];
        this.appendix_5a.status_codes.forEach(sc => {
            var item = {}
            item["status_code"] = sc;
            item["description"] = status_codes[sc];
            this.status_code_descriptions.push(item);
        });
        var a = 1;
    }

    equates_to(mc) {
        // Condition_duty_amount and document_code being the same shows that conditions are indentical
        if ((this.document_code == mc.document_code) && (this.condition_duty_amount == mc.condition_duty_amount)) {
            return (true);
        } else {
            return (false);
        }
    }
}
module.exports = MeasureCondition
const Commodity = require('./commodity.js')
const Measure = require('./measure.js')
const DutyExpression = require('./duty_expression.js')
const Footnote = require('./footnote.js')

class Subheading {
    constructor(json, goods_nomenclature_item_id = null) {
        var t, c, m, de, f, measure_class, indent_class;

        this.subheading = goods_nomenclature_item_id;

        this.json = json;
        this.commodities = [];
        this.hierarchy = [];
        this.measures = [];
        this.duty_expressions = [];
        this.footnotes = [];
        this.data = this.json["data"];
        this.included = this.json["included"];
        this.section_note = "";
        this.section_id = "";
        this.section_title = "";
        this.subheading_ancestry = [];

        // Get the basic data from the API, prior to organising into an atomic object for the nunjucks
        this.included.forEach(obj => {
            var t = obj["type"];
            switch (t) {
                case "commodity":
                    var sid = obj["id"];
                    var goods_nomenclature_item_id = obj["attributes"]["goods_nomenclature_item_id"];
                    var productline_suffix = obj["attributes"]["producline_suffix"];
                    var description = obj["attributes"]["formatted_description"];
                    var number_indents = obj["attributes"]["number_indents"];
                    if (number_indents > 1) {
                        indent_class = " indent";
                    } else {
                        indent_class = "";
                    }
                    var leaf = obj["attributes"]["leaf"];
                    var parent_sid = obj["attributes"]["parent_sid"];

                    c = new Commodity(sid, goods_nomenclature_item_id, productline_suffix, description, number_indents, leaf, parent_sid, indent_class);
                    var overview_measures = obj["relationships"]["overview_measures"]["data"];
                    overview_measures.forEach(item => {
                        m = new Measure(item["id"], this.goods_nomenclature_item_id, null, null, null, null);
                        c.measures.push(m);
                    });
                    this.commodities.push(c);
                    break;

                case "measure":
                    var measure_type_id = obj["relationships"]["measure_type"]["data"]["id"];
                    var vat = obj["attributes"]["vat"];
                    measure_class = this.get_measure_class(measure_type_id);
                    m = new Measure(obj["id"], this.goods_nomenclature_item_id, null, measure_type_id, vat, measure_class);
                    this.measures.push(m);
                    break;

                case "duty_expression":
                    var measure_id = obj["id"].replace("-duty_expression", "");
                    var base = obj["attributes"]["base"];
                    var formatted_base = obj["attributes"]["formatted_base"];
                    de = new DutyExpression(measure_id, base, formatted_base);
                    this.duty_expressions.push(de);
                    break;

                case "footnote":
                    var code = obj["attributes"]["code"];
                    var description = obj["attributes"]["formatted_description"];
                    f = new Footnote(code, description);
                    this.footnotes.push(f);
                    break;

                case "section":
                    this.section_id = obj["attributes"]["position"];
                    this.section_title = obj["attributes"]["title"];
                    var section_note = obj["attributes"]["section_note"];
                    if ((typeof (section_note) == "object") && (section_note != null)) {
                        //console.log("I AM AN OBJECT");
                        this.section_note = section_note["content"];
                    } else {
                        //console.log("I AM A STRING");
                        this.section_note == null ? "" : section_note;
                    }
                    break;

                case "chapter":
                    this.chapter_id = obj["attributes"]["goods_nomenclature_item_id"].substr(0, 2);
                    this.chapter_title = obj["attributes"]["formatted_description"];
                    var a = 1;
                    break;
            }
        });

        // Assign the duty expressions to the measures
        this.measures.forEach(m => {
            this.duty_expressions.forEach(de => {
                if (de.measure_id == m.id) {
                    m.duty_expression = de.formatted_base;
                }
            });
        });

        // Assign the measures to the commodity codes
        this.commodities.forEach(c => {
            c.measures.forEach(m => {
                this.measures.forEach(m2 => {
                    if (m2.id == m.id) {
                        switch (m2.measure_class) {
                            case "mfn":
                                c.mfn = m2.duty_expression;
                                break;
                            case "supplementary_unit":
                                c.supplementary_unit = m2.duty_expression;
                                break;
                            case "vat":
                                c.vat = m2.duty_expression;
                                break;
                        }
                    }
                });
            });
        });

        this.get_hierarchy();
        if (this.subheading != null) {
            this.get_subheading_hierarchy();
        }

        return (this);
    }

    get_hierarchy() {
        this.hierarchy = [];
        var commodity_count = this.commodities.length;
        for (var i = 0; i < commodity_count; i++) {
            var c = this.commodities[i];
            if (c.number_indents == 1) {
                if (i < (commodity_count - 1)) {
                    if (!c.leaf) {
                        c.get_descendants(this.commodities, 1, i + 1);
                    }
                }
                this.hierarchy.push(c);
            }
        }
    }

    get_subheading_hierarchy() {
        var subheading;
        var running_indents, start_indents;
        this.subheading_ancestry = [];
        var found = false;
        var found_index;
        var commodity_count = this.commodities.length;

        // Go from end to start to find the codes that are in the ancestor hierarchy
        for (var i = commodity_count - 1; i >= 0; i--) {
            var commodity = this.commodities[i];
            if (!found) {
                if (commodity.goods_nomenclature_item_id == this.subheading.padEnd(10, "0")) {
                    this.subheading_ancestry.push(commodity.sid);
                    running_indents = commodity.number_indents;
                    start_indents = commodity.number_indents;
                    found = true;
                    found_index = i;
                }
            } else {
                if (commodity.number_indents < running_indents) {
                    running_indents = commodity.number_indents;
                    this.subheading_ancestry.push(commodity.sid);
                }
            }
        }

        // Go from start to end to find the codes that are in the depdendent (child) hierarchy
        for (var i = found_index + 1; i < commodity_count; i++) {
            var commodity = this.commodities[i];

            if (commodity.number_indents >= start_indents) {
                running_indents = commodity.number_indents;
                this.subheading_ancestry.push(commodity.sid);
            }
            if (commodity.number_indents < start_indents) {
                break;
            }
            

        }
    }

    get_measure_class(measure_type_id) {
        var measure_class;
        var mfn_types = ["103", "105"];
        var supplementary_unit_types = ["109", "110"];
        if (mfn_types.indexOf(measure_type_id) > -1) {
            measure_class = "mfn"
        }
        else if (supplementary_unit_types.indexOf(measure_type_id) > -1) {
            measure_class = "supplementary_unit"
        }
        else {
            measure_class = "vat"
        }
        return (measure_class);
    }
}

module.exports = Subheading;


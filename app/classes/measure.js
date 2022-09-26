const e = require('express');
const { max } = require('lodash');
const MeasureConditionCodeGroup = require('./measure_condition_code_group');

class Measure {
    constructor(id = null, goods_nomenclature_item_id, req = null, measure_type_id = null, vat = null, measure_class = null) {
        this.id = id;
        this.goods_nomenclature_item_id = goods_nomenclature_item_id;
        this.measure_type_id = measure_type_id;
        this.measure_type_description = null;
        this.measure_class = measure_class;
        this.duty_expression = null;
        this.financial = null;
        this.relevant = false;
        this.measure_components = [];
        this.reduction_indicator = 1;
        this.condition_content_file = "";
        this.condition_content = "";
        this.overwrite_measure_conditions = false;
        this.display_action_column = false;
        this.measure_condition_class = "standard"; // Options are eps, standard // duty, control
        this.has_document_codes = false;
        this.has_duplicate_conditions = false;
        this.measure_condition_code_groups = [];
        this.has_shared_conditions = false;
        this.show_condition_code_group_titles = false;
        this.preference_code = "";

        // Get the additional code (for Meursing calcs)
        if (req != null) {
            this.meursing_code = req.session.data["meursing-code"];
        } else {
            this.meursing_code = "";
        }

        // Conditions
        this.measure_condition_ids = [];
        this.certificates = [];
        this.measure_conditions = [];
        this.has_conditions = false;
        this.popup_message = "";

        // Footnotes
        this.has_footnotes = false;
        this.footnotes = [];

        // Geography
        this.geographical_area = null;
        this.geographical_area_id = null;
        this.geographical_area_description = null;
        this.additional_code_id = null;
        this.additional_code = null;
        this.additional_code_code = null;
        this.combined_duty = "";
        this.combined_duty_after_meursing = "";
        this.order_number = null;
        this.order_number_id = null;
        this.import = null;
        this.legal_base = "";
        this.legal_acts = [];
        this.legal_act_ids = [];
        this.excluded_country_string = "";
        this.excluded_countries = [];
        this.excluded_country_ids = [];
        this.has_meursing = false;
        this.display_block = "";
        this.duty_bearing = null;
        this.condition_codes = [];
    }

    structure_conditions() {
        // Strategic
        this.get_special_conditions();

        var _ = require('lodash');
        this.condition_codes = [];
        this.positive_condition_count = 0;

        this.get_measure_condition_code_groups(); // New code
        if (this.measure_condition_code_groups.length > 1) {
            this.check_for_shared_conditions()
        }

        this.get_exposed_conditions();
    }

    get_measure_type_url () {
        var a = 1;
        this.measure_type_url = "/measure_type/" + this.measure_type_id + "/" + this.preference_code;
      }
    get_measure_condition_code_groups() {
        // Strategic

        // Group the conditions according to the new measure condition groups object
        // MCCGs are only used when there are multiple groups and there are no shared entities
        // They are not used when there are multiple groups with shared conditions

        if (this.id == 3878978) {
            var a = 1;
        }

        this.exposed_conditions = [];
        if (this.measure_conditions.length > 0) {
            this.measure_conditions.forEach(mc => {
                if (mc.positive) {
                    // Populate the exposed conditions
                    // May not be needed
                    if (this.exposed_conditions.length > 0) {
                        var found = false;
                        this.exposed_conditions.forEach(ec => {
                            if (ec.measure_condition.equates_to(mc)) {
                                ec.instance_count += 1;
                                ec.condition_code = "n/a"
                                found = true;
                            }
                        });
                        if (!found) {
                            var ec = {
                                "instance_count": 1,
                                "condition_code": mc.condition_code,
                                "measure_condition": mc
                            }
                            this.exposed_conditions.push(ec);
                        }
                    } else {
                        var ec = {
                            "instance_count": 1,
                            "condition_code": mc.condition_code,
                            "measure_condition": mc
                        }
                        this.exposed_conditions.push(ec);
                    }
                    var a = 1;

                    // Populate the measure condition groups
                    if (this.measure_condition_code_groups.length > 0) {
                        var found = false;
                        this.measure_condition_code_groups.forEach(mccg => {
                            if (mccg.condition_code == mc.condition_code) {
                                if (!found) {
                                    mccg.measure_conditions.push(mc);
                                    found = true;
                                }
                            }
                        });
                        if (!found) {
                            var mccg = new MeasureConditionCodeGroup(mc.condition_code, mc.condition);
                            mccg.measure_conditions.push(mc);
                            this.measure_condition_code_groups.push(mccg);
                        }
                    } else {
                        var mccg = new MeasureConditionCodeGroup(mc.condition_code, mc.condition);
                        mccg.measure_conditions.push(mc);
                        this.measure_condition_code_groups.push(mccg);
                    }
                }
            });
        }
        var a = 1;
    }

    check_for_shared_conditions() {
        // Strategic
        // Condition_duty_amount and document_code being the same shows that conditions are indentical
        var _ = require('lodash');
        var positive_conditions = [];
        this.has_shared_conditions = false;
        this.measure_conditions.forEach(mc => {
            if (mc.positive) {
                var item = { "document_code": mc.document_code, "condition_duty_amount": mc.condition_duty_amount }
                positive_conditions.push(item);
            }
        });
        var positive_conditions_deduped = _.uniqWith(positive_conditions, _.isEqual);
        if (positive_conditions_deduped.length != positive_conditions.length) {
            this.has_shared_conditions = true;
        }
    }

    get_exposed_conditions() {
        // Strategic
        if (this.id == 3878177) {
            var a = 1;
        }
        else if (this.id == 3887764) {
            var a = 1;
        }

        if (this.measure_condition_code_groups.length == 1) {
            // Single measure condition code group
            // Nothing fancy can happen
            // Scenario A: this is the same as scenario C below
            this.show_condition_code_group_titles = false;
        } else {
            // Multiple condition code groups, therefore we can 
            // go one of two ways: with or without shared conditions
            if (this.has_shared_conditions) {
                // Waste controls, vet controls, pet food
                this.show_condition_code_group_titles = false;
                this.combine_conditions();
            } else {
                this.show_condition_code_group_titles = true;
                // Fluorinated gases, EPS on FTAs
                // Scenario C: same as A
            }
        }
    }

    combine_conditions() {
        this.sort_exposed_measure_conditions();
        // Strategic
        // There must be precisely 2 condition code groups
        // When conditions are combined, measure condition code groups are no longer relevant
        var a = 1;

        // Loop through the measure_condition code groups 
        // need two arrays
        // Build up arrays to represent the horizontal and vertical lists (of 2 groups)
        var found;
        this.condition_codes = [];
        var working_conditions = [];
        this.exposed_conditions.forEach(ec => {
            if (ec.instance_count == 1) {
                found = false;
                if (this.condition_codes.length > 0) {
                    this.condition_codes.forEach(cc => {
                        if (cc.condition_code == ec.condition_code) {
                            cc["conditions"].push(ec.measure_condition);
                            found = true;
                        }
                    });
                    if (!found) {
                        var entity = {
                            "condition_code": ec.condition_code,
                            "conditions": [
                                ec.measure_condition
                            ]
                        }
                        this.condition_codes.push(entity);
                    }
                } else {
                    var entity = {
                        "condition_code": ec.condition_code,
                        "conditions": [
                            ec.measure_condition
                        ]
                    }
                    this.condition_codes.push(entity);
                }
            } else {
                working_conditions.push(ec.measure_condition);
            }
        });

        // Only when we have precisely 2 condition code groups
        if (this.condition_codes.length == 2) {
            this.condition_codes[0]["conditions"].forEach(cc0 => {
                this.condition_codes[1]["conditions"].forEach(cc1 => {
                    let tmp = Object.assign(Object.create(Object.getPrototypeOf(cc0)), cc0);
                    tmp.append_condition(cc1);
                    working_conditions.push(tmp);
                });
            });
        }
        this.exposed_conditions = working_conditions;

        // Create a disambiguated list of measures for displaying the Appendix 5a and 5b information
        this.codes_for_5a = [];
        this.measure_conditions.forEach(mc => {
            if (mc.positive) {
                if ((mc.document_code != "n/a") && (mc.document_code != "")) {
                    var found = false;
                    this.codes_for_5a.forEach(code => {
                        if (code.document_code == mc.document_code) {
                            found = true;
                        }
                    });
                    if (!found) {
                        this.codes_for_5a.push(mc);
                    }
                }
            }
        });
    }

    sort_exposed_measure_conditions() {
        // Strategic
        // List the shared entities at the top, followed by the items with an instance count of 1
        this.exposed_conditions.sort(compare_condition_counts);

        function compare_condition_counts(a, b) {
            if (a.instance_count < b.instance_count) {
                return 1;
            }
            if (a.instance_count > b.instance_count) {
                return -1;
            }
            return 0;
        }
    }

    assign_conditions_to_condition_code_groups() {
        // Used when there are no shared measure conditions between groups
        this.condition_code_tally = {};
        this.exposed_conditions.forEach(ec => {
            if (ec.condition_code in this.condition_code_tally) {
                this.condition_code_tally[ec.condition_code] += 1;
            } else {
                this.condition_code_tally[ec.condition_code] = 1;
            }

        });
    }

    get_special_conditions() {
        // Strategic
        // Get any special measure conditions (for small brewers relief)
        // Theoretically, if this is called, then the rest is not required.
        const fs = require('fs');
        var special_conditions = require('../data/special_conditions.json');

        for (var i = 0; i < special_conditions.length; i++) {
            var sc = special_conditions[i];
            if (this.additional_code == null) {
                if ((sc.additional_code == null) && (this.measure_type_id == sc.measure_type_id) && (this.goods_nomenclature_item_id == sc.goods_nomenclature_item_id)) {
                    this.condition_content_file = sc.content_file;
                    var filename = process.cwd() + "/app/views/conditions/" + this.condition_content_file;
                    this.condition_content = fs.readFileSync(filename, 'utf8');
                    this.overwrite_measure_conditions = sc.overwrite;
                    break;
                }
            } else {
                if ((this.additional_code_code == sc.additional_code) && (this.measure_type_id == sc.measure_type_id) && (this.goods_nomenclature_item_id == sc.goods_nomenclature_item_id)) {
                    this.condition_content_file = sc.content_file;
                    var filename = process.cwd() + "/app/views/conditions/" + this.condition_content_file;
                    this.condition_content = fs.readFileSync(filename, 'utf8');
                    this.overwrite_measure_conditions = sc.overwrite;
                    break;
                }
            }
        }
    }

    get_excluded_country_string() {
        var listify = require('listify');
        const eu_countries = [
            'AT',
            'BE',
            'BG',
            'HR',
            'CY',
            'CZ',
            'DK',
            'EE',
            'FI',
            'FR',
            'DE',
            'GR',
            'HU',
            'IE',
            'IT',
            'LV',
            'LT',
            'LU',
            'MT',
            'NL',
            'PL',
            'PT',
            'RO',
            'SK',
            'SI',
            'ES',
            'SE'
        ]
        this.excluded_country_descriptions = [];

        var contains_eu = eu_countries.every(elem => this.excluded_country_ids.includes(elem));

        if (contains_eu) {
            this.excluded_country_descriptions.push("European Union countries");
            this.excluded_countries.forEach(ex => {
                if ((!eu_countries.includes(ex.id)) && (ex.id != "EU")) {
                    this.excluded_country_descriptions.push(ex.description);
                }
            });
        }
        else {
            this.excluded_countries.forEach(ex => {
                this.excluded_country_descriptions.push(ex.description);
            });
        }
        this.excluded_country_string = listify(this.excluded_country_descriptions);
        this.excluded_country_string = this.excluded_country_string.replace(", and", " and");
    }

    combine_duties() {
        this.has_minimum = false;
        this.has_maximum = false;
        this.combined_duty = "";
        this.combined_duty_with_meursing = "";

        // Count the number of clauses in the duty
        // If there are MAX or MIX types, then there are multiple clauses
        this.multi_clause = false;
        this.measure_components.forEach(mc => {
            mc.reduction_indicator = this.reduction_indicator;
            if ((mc.has_maximum) || (mc.has_minimum)) {
                this.multi_clause = true;
            }
        });
        // if (this.multi_clause) {
        //     this.combined_duty = "(";
        // }

        if (this.measure_type_id == "103") {
            var a = 1;
        }

        this.measure_components.forEach(mc => {
            if (mc.has_maximum) {
                this.has_maximum = true;
            }
            if (mc.has_minimum) {
                this.has_minimum = true;
            }
            this.combined_duty += mc.duty_string + " ";
            this.combined_duty_with_meursing += mc.duty_string_with_meursing + " ";
            if (mc.is_meursing) {
                this.has_meursing = true;
            }
        });
        this.combined_duty_with_meursing = this.combined_duty_with_meursing.trim();

        this.combined_duty = this.combined_duty.replace(/ \)/g, ")");
        if (this.multi_clause) {
            var a = 1;
        }
        this.combined_duty = this.combined_duty.trim()

        this.component_count = this.measure_components.length;
        if (this.component_count == 0) {
            this.duty_value = 0;
        } else if (this.component_count == 1) {
            this.duty_value = this.measure_components[0].duty_amount ?? 0;
            var a = 1;
        } else {
            this.duty_value = parseInt(this.combined_duty);
            var a = 1;
        }
    }
}
module.exports = Measure
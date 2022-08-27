const axios = require('axios')

const Measure = require("./measure");
const MeasureComponent = require("./measure_component");
const MeasureCondition = require("./measure_condition");
const Footnote = require("./footnote");
const MeasureType = require("./measure_type");
const GeographicalArea = require("./geographical_area");
const AdditionalCode = require("./additional_code");
const Calculation = require("./calculation");
const OrderNumber = require("./order_number");
const Definition = require("./definition");
const LegalAct = require("./legal_act");
const DutyExpression = require("./duty_expression");
const Certificate = require("./certificate");
const { forEach } = require('lodash');
const { threadId } = require('worker_threads');

class Commodity {
    constructor(sid = null, goods_nomenclature_item_id = null, productline_suffix = null, description = null, number_indents = null, leaf = null, parent_sid = null, indent_class = null) {
        this.sid = sid;
        this.goods_nomenclature_item_id = goods_nomenclature_item_id;
        this.productline_suffix = productline_suffix;
        this.description = description;
        this.number_indents = number_indents;
        this.indent_class = "";
        this.leaf = leaf;
        this.parent_sid = parent_sid;
        this.indent_class = indent_class;
        this.supplementary_unit = null;
        this.measure_type_series_id = null;
        this.measures = [];
        this.has_meursing = false;
        this.has_remedies = false;
        this.is_end_use = false;
        this.country_name = "";
        this.phase = "";
        this.units = [];
        this.multiplier = 1;
        this.duty_expressions = [];
        this.vat = null;
        this.unit_values = null;

        this.get_heading_class();

        this.quotas = [];
        this.quota_order_numbers = [];
        this.mfns = [];
        this.vats = [];
        this.excises = [];
        this.preferences = [];
        this.remedies = [];
        this.suspensions = [];

        this.footnotes = [];

        this.mfn_array = ["103", "105", "109"];
        this.agri_array = ["488", "489", "490"];
        this.preference_array = ["142", "145", "106"];
        this.suspension_array = ["112", "115", "117", "119"];
        this.quota_array = ["143", "146", "122", "123"];
        this.supplementary_unit_array = ["109", "110"];
        this.remedy_array = ["551", "552", "553", "554", "555", "561", "562", "563", "564", "565", "566", "570", "695", "696"];

        this.meursing_blob = null;
        this.exchange_rate = "";
        this.filter = null;
        this.additional_codes = [];
        this.additional_code_class = "";

        if (this.goods_nomenclature_item_id != null) {
            this.formatted_commodity_code = this.goods_nomenclature_item_id
            this.format_commodity_code();
        }

        this.children = [];
        if (this.leaf) {
            this.vat = "20%";
            this.third_country_duty = "0.00%";
            this.supplementary_unit = "";
        } else {
            this.vat = "";
            this.third_country_duty = "";
            this.supplementary_unit = "";
        }

        this.customs_duties_measures = [];

        this.get_preference_codes();
    }

    get_preference_codes() {
        this.preference_codes = require('../data/preference_codes/preference_codes.json');
        var a = 1;
    }

    assign_preference_codes() {
        var gsp_areas = ["2005", "2020", "2027"];
        this.measures.forEach(m => {
            var a = 1;
            var preference_codes = this.preference_codes["measure_types"][m.measure_type_id];
            if (typeof preference_codes !== 'undefined') {
                if (gsp_areas.includes(m.geographical_area_id)) {
                    m.preference_code = preference_codes[0];
                } else {
                    m.preference_code = preference_codes[preference_codes.length - 1];
                }
            }
        });
    }

    get_heading_class() {
        if (this.number_indents <= 1) {
            this.heading_class = " b";
        } else {
            this.heading_class = "";
        }
    }

    get_data(json, country = null, date = null) {
        this.data = json["data"];
        this.included = json["included"];
        this.sid = this.data["id"];
        this.goods_nomenclature_item_id = this.data["attributes"]["goods_nomenclature_item_id"];
        this.description = this.data["attributes"]["formatted_description"];

        this.description = this.description.replace(/<br>  /g, "<br>");
        this.description = this.description.replace(/<br> /g, "<br>");
        this.description = this.description.replace(/<br><br><br><br>/g, "<br>");
        this.description = this.description.replace(/<br><br><br>/g, "<br>");
        this.description = this.description.replace(/<br><br>/g, "<br>");

        this.number_indents = this.data["attributes"]["number_indents"];
        this.basic_duty_rate_string = this.data["attributes"]["basic_duty_rate"];
        if (this.basic_duty_rate_string == null) {
            this.basic_duty_rate_string = "variable";
        }
        this.format_basic_duty_rate();

        this.formatted_commodity_code = this.goods_nomenclature_item_id;
        this.format_commodity_code();
        this.get_cheg_code();
    }

    get_cheg_code() {
        this.is_hs_code = false;
        if (this.goods_nomenclature_item_id.substr(4, 6) == "000000") {
            this.cheg_code = this.goods_nomenclature_item_id.substr(0, 4);
            this.cheg_hs_code = this.cheg_code;
            this.is_hs_code = true;

        } else if (this.goods_nomenclature_item_id.substr(6, 4) == "0000") {
            this.cheg_code = this.goods_nomenclature_item_id.substr(0, 6);
            this.cheg_hs_code = this.cheg_code;
            this.is_hs_code = true;

        } else if (this.goods_nomenclature_item_id.substr(8, 2) == "00") {
            this.cheg_code = this.goods_nomenclature_item_id.substr(0, 8);
            this.cheg_hs_code = this.goods_nomenclature_item_id.substr(0, 6);
        } else {
            this.cheg_code = this.goods_nomenclature_item_id;
            this.cheg_hs_code = this.goods_nomenclature_item_id.substr(0, 6);
        }
    }

    get_measure_data(req, origin, override_block = false, measure_types = "financial") {

        // console.log("Getting measure data");
        var m, mc, mt, g, ac, la, id, item2;

        this.origin = origin;
        this.origin_obj = new GeographicalArea();
        this.country_name = this.origin_obj.get_country_description(origin);
        this.country_name2 = this.origin_obj.get_country_description(req.session.data["country"]);

        this.measures = [];
        this.measure_components = [];
        this.measure_conditions = [];
        this.footnotes = [];
        this.measure_types = [];
        this.geographical_areas = [];
        this.additional_codes = [];
        this.order_numbers = [];
        this.definitions = [];
        this.legal_acts = [];
        this.crumb = "";
        this.ancestry = [];

        this.chapter_note = "";
        this.section_note = "";

        // Get all the measures + measure components
        this.included.forEach(item => {
            if (item["type"] == "section") {
                var description = item["attributes"]["title"];
                this.section_id = item.attributes.position;
                this.section_title = item.attributes.title;
                this.ancestry.push(description);
                this.section_note = item.attributes["section_note"];

            } else if (item["type"] == "chapter") {
                var description = item["attributes"]["formatted_description"];
                this.ancestry.push(description);
                this.chapter_note = item.attributes["chapter_note"];

            } else if (item["type"] == "heading") {
                var description = item["attributes"]["formatted_description"];
                this.ancestry.push(description);

            } else if (item["type"] == "commodity") {
                var description = item["attributes"]["formatted_description"];
                this.ancestry.push(description);

            } else if (item["type"] == "measure") {
                id = item["id"];
                m = new Measure(id, this.goods_nomenclature_item_id, req);
                m.origin = item["attributes"]["origin"];
                m.effective_start_date = item["attributes"]["effective_start_date"];
                m.effective_end_date = item["attributes"]["effective_end_date"];
                m.import = item["attributes"]["import"];
                m.excise = item["attributes"]["excise"];
                m.vat = item["attributes"]["vat"];
                m.measure_type_id = item["relationships"]["measure_type"]["data"]["id"];
                m.measure_type = new MeasureType(item["relationships"]["measure_type"]["data"]);
                m.geographical_area_id = item["relationships"]["geographical_area"]["data"]["id"];

                // Get additional code
                if (item.hasOwnProperty("relationships")) {
                    item2 = item["relationships"];
                    if (item2.hasOwnProperty("additional_code")) {
                        m.additional_code_id = item["relationships"]["additional_code"]["data"]["id"];
                        // console.log(m.additional_code_id);
                    }
                }

                // Get footnotes
                var footnotes = item["relationships"]["footnotes"]["data"];
                if (footnotes.length > 0) {
                    m.has_footnotes = true;
                    footnotes.forEach(footnote => {
                        f = new Footnote(footnote.id, "");
                        m.footnotes.push(f);
                    });
                }

                // Get legal base / legal acts
                var legal_acts = item["relationships"]["legal_acts"]["data"];
                legal_acts.forEach(legal_act => {
                    m.legal_act_ids.push(legal_act["id"]);
                });

                // Get excluded_countries
                var excluded_countries = item["relationships"]["excluded_countries"]["data"];
                excluded_countries.forEach(excluded_country => {
                    m.excluded_country_ids.push(excluded_country["id"]);
                });

                // Get any special measure conditions (for small brewers relief)
                var special_conditions = require('../data/special_conditions.json');
                var a = 1;

                // Get measure condition IDs (IDs only)
                var measure_conditions = item["relationships"]["measure_conditions"]["data"];
                measure_conditions.forEach(measure_condition => {
                    m.measure_condition_ids.push(measure_condition["id"]);
                });

                // Get quota order number
                try {
                    m.order_number_id = item["relationships"]["order_number"]["data"]["id"];
                    this.quota_order_numbers.push(m.order_number_id);
                    var a = 1
                } catch (error) {
                    // Do nothing
                }

                // if (m.import == true) {
                //     this.measures.push(m);
                // }

                this.measures.push(m);

            } else if (item["type"] == "measure_component") {
                mc = new MeasureComponent(req, item);
                this.measure_components.push(mc);

            } else if (item["type"] == "measure_condition") {
                mc = new MeasureCondition(req, item);
                this.measure_conditions.push(mc);

            } else if (item["type"] == "measure_type") {
                mt = new MeasureType(item);
                this.measure_types.push(mt);

            } else if (item["type"] == "footnote") {
                var f = new Footnote(item.attributes.code, item.attributes.formatted_description);
                this.footnotes.push(f);

            } else if (item["type"] == "geographical_area") {
                g = new GeographicalArea(item);
                this.geographical_areas.push(g);

            } else if (item["type"] == "additional_code") {
                ac = new AdditionalCode(item);
                this.additional_codes.push(ac);

            } else if (item["type"] == "order_number") {
                ac = new OrderNumber(item);
                this.order_numbers.push(ac);

            } else if (item["type"] == "definition") {
                ac = new Definition(item);
                this.definitions.push(ac);

            } else if (item["type"] == "legal_act") {
                la = new LegalAct(item);
                this.legal_acts.push(la);

            } else if (item["type"] == "duty_expression") {
                var measure_id = item["id"].replace("-duty_expression", "");
                var base = item["attributes"]["base"];
                var formatted_base = item["attributes"]["formatted_base"];
                var obj = new DutyExpression(measure_id, base, formatted_base);
                this.duty_expressions.push(obj);
            }
        });

        this.get_export_measure_ids();

        this.count_footnotes();

        this.ancestry.push(this.description);
        var i;
        for (i = 0; i < this.ancestry.length; i++) {
            if (i == this.ancestry.length - 1) {
                this.crumb += "<strong>";
            }
            this.crumb += this.ancestry[i];
            if (i == this.ancestry.length - 1) {
                this.crumb += "</strong>";
            } else {
                this.crumb += " — ";
            }
        }

        this.commodity_description_trail = "";
        for (i = 2; i < this.ancestry.length; i++) {
            if (i == this.ancestry.length - 1) {
                this.commodity_description_trail += "<strong>" + this.ancestry[i] + "</strong>";
            } else {
                this.commodity_description_trail += this.ancestry[i];

            }
            if (i < this.ancestry.length - 1) {
                this.commodity_description_trail += " — ";
            }
        }

        this.assign_duty_expressions();
        this.assign_geographical_areas();
        this.assign_additional_codes();

        this.assign_measure_components(req);
        this.get_third_country_duty();
        this.get_preferential_duty();
        this.assign_measure_conditions();
        if (origin != "basic") {
            this.remove_irrelevant_measures(measure_types);
        }
        this.get_units();
        this.get_supplementary_unit();
        this.get_measure_type_descriptions();
        this.get_measure_country_descriptions();
        this.categorise_measures(override_block);
        this.get_customs_duties_string();
        this.assign_definitions_to_order_numbers();
        this.assign_legal_acts_to_measures();
        this.assign_footnotes_to_measures();
        this.assign_geographical_area_descriptions_to_exclusions();
        this.strip_exclusions_from_geographical_area()

        this.sort_additional_codes();
        this.get_additional_code_class();


        this.calculate_vat();
        this.calculate_excise();

        var valid_phases = ["results"];
        if (valid_phases.includes(this.phase)) {
            this.calculate_excise();
            this.calculate_vat();
            this.calculate_mfn();
            this.calculate_quotas();
        }
        this.assign_preference_codes();
    }

    get_third_country_duty() {
        this.third_country_duty = "";
        this.measures.forEach(m => {
            if ((m.measure_type_id == "103") || (m.measure_type_id == "105")) {
                this.third_country_duty = m.combined_duty.trim();
                var a = 1;
            }
        });
    }

    get_preferential_duty() {
        this.show_also = false;
        this.preferential_tariff_duty = null;
        this.preferential_quota_duty = null;
        this.preferential_quota_quota = null;
        this.measures.forEach(m => {
            if ((m.measure_type_id == "142") || (m.measure_type_id == "145")) {
                this.preferential_tariff_duty = m.combined_duty.trim();
                // console.log(this.preferential_tariff_duty);
                var a = 1;
            }
            if ((m.measure_type_id == "143") || (m.measure_type_id == "146")) {
                this.preferential_quota_duty = m.combined_duty.trim();
                this.preferential_quota_quota = m.order_number_id;
                var a = 1;
            }
        });

        if ((this.third_country_duty == "0.00 %") && (this.preferential_tariff_duty == "0.00 %")) {
            this.show_also = true;
        }

    }

    get_export_measure_ids() {
        var data = this.data;
        var export_measure_ids = this.data.relationships.export_measures.data;
        this.export_measure_ids = [];
        export_measure_ids.forEach(m => {
            this.export_measure_ids.push(m.id);
        });
        var a = 1;
    }

    count_footnotes() {
        this.commodity_footnote_count = 0;
        this.footnotes.forEach(footnote => {
            if (footnote.footnote_class == "commodity") {
                this.commodity_footnote_count++;
            }
        });
        var a = 1;
    }

    get_certificates() {
        this.certificates = [];
        //const valid_series = ["C", "D", "P", "Q"];
        const valid_series = ["C", "D"];
        this.measures.forEach(m => {
            if (valid_series.includes(m.measure_type_series_id)) {
                if (m.has_conditions) {
                    if (m.duty_expression.base == '') {
                        m.measure_conditions.forEach(mc => {
                            if (mc.document_code != "") {
                                var cert_count = this.certificates.length;
                                var i;
                                var found = false;
                                if (cert_count > 0) {
                                    for (i = 0; i < cert_count; i++) {
                                        if (this.certificates[i].document_code == mc.document_code) {
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                                if (found == false) {
                                    var certificate = new Certificate();
                                    certificate.document_code = mc.document_code;
                                    certificate.requirement = mc.requirement;
                                    certificate.duty_expression = mc.duty_expression;
                                    certificate.measure_type_id = m.measure_type_id;
                                    certificate.measure_type_description = m.measure_type_description;
                                    this.certificates.push(certificate);
                                }
                            }
                        });
                    }
                }
            }
        });
        var b = 2;
    }

    get_additional_code_class() {
        if (this.additional_codes.length > 0) {
            this.additional_code_class = this.additional_codes[0].code[0];
            var a = 1;
            var data = require('../data/additional_codes.json');
            var jp = require('jsonpath');

            // Get the type
            var query_string = '$.types[?(@.type == "' + this.additional_code_class + '")]';
            var result = jp.query(data, query_string);
            if (result.length > 0) {
                var additional_code_heading = result[0].heading;
                var query_string = '$.headings[?(@.heading == "' + additional_code_heading + '")]';
                var result = jp.query(data, query_string);
                if (result.length > 0) {
                    this.additional_code_overlay = result[0].overlay;
                    this.additional_code_hint = result[0].hint;
                }
            }
        }
    }

    sort_additional_codes() {
        this.additional_codes.sort(compare_additional_codes);



        function compare_additional_codes(a, b) {
            if (a.code < b.code) {
                return -1;
            }
            if (a.code > b.code) {
                return 1;
            }
            return 0;
        }
    }

    strip_exclusions_from_geographical_area() {
        this.measures.forEach(measure => {
            if (measure.geographical_area.geographical_area_code == 1) {
                var exclusions = measure.excluded_country_ids;
                var looper = 0;
                measure.geographical_area.members.forEach(ga => {
                    if (exclusions.includes(ga.id)) {
                        measure.geographical_area.members.splice(looper, 1);
                        measure.geographical_area.member_strings.splice(looper, 1);
                    }
                    looper += 1;
                });
            }
        });
    }

    get_measure_country_descriptions() {
        this.measures.forEach(measure => {
            this.geographical_areas.forEach(geographical_area => {
                if (geographical_area.id == measure.geographical_area_id) {
                    measure.geographical_area_description = geographical_area.description;
                    measure.geographical_area_code = geographical_area.geographical_area_code;
                    if (measure.geographical_area_description == "ERGA OMNES") {
                        measure.geographical_area_description = "All countries";
                    }
                }
            });
        });
    }

    get_measure_type_descriptions() {
        this.measures.forEach(measure => {
            this.measure_types.forEach(measure_type => {
                if (measure_type.id == measure.measure_type_id) {
                    if (measure.measure_type.overlay == "") {
                        measure.measure_type_description = measure_type.description;
                        measure.measure_type.description = measure_type.description;
                    } else {
                        measure.measure_type_description = measure.measure_type.overlay;
                        measure.measure_type.description = measure.measure_type.overlay;
                    }
                    measure.measure_type_series_id = measure_type.measure_type_series_id;
                }
            });
        });
    }

    assign_definitions_to_order_numbers() {
        this.definitions.forEach(definition => {
            this.order_numbers.forEach(order_number => {
                if (order_number.definition_id == definition.id) {
                    order_number.definition = definition;
                }
            });
        });
        this.measures.forEach(measure => {
            this.order_numbers.forEach(order_number => {
                if (order_number.id == measure.order_number_id) {
                    measure.order_number = order_number;
                }
            });
        });
    }

    assign_geographical_area_descriptions_to_exclusions() {
        this.geographical_areas.forEach(ga => {
            this.measures.forEach(measure => {
                measure.excluded_country_ids.forEach(excluded_country => {
                    if (excluded_country == ga.id) {
                        measure.excluded_countries.push(ga);
                    }
                });
            });
        });

        this.measures.forEach(measure => {
            measure.get_excluded_country_string();
        });
    }

    assign_legal_acts_to_measures() {
        this.legal_acts.forEach(legal_act => {
            this.measures.forEach(measure => {
                measure.legal_act_ids.forEach(legal_act_id => {
                    if (legal_act_id == legal_act.id) {
                        measure.legal_acts.push(legal_act);
                    }
                });
            });
        });
        this.measures.forEach(measure => {
            if (measure.legal_acts.length > 0) {
                measure.legal_base = measure.legal_acts[0].friendly;
            }
        });
    }

    assign_footnotes_to_measures() {
        this.footnotes.forEach(footnote1 => {
            this.measures.forEach(measure => {
                measure.footnotes.forEach(footnote2 => {
                    if (footnote1.code == footnote2.code) {
                        footnote2.description = footnote1.description;
                    }
                });
            });
        });
    }

    calculate_vat() {
        var _ = require('lodash');
        if (this.vats.length > 1) {
            // this.vat_string = "Imports of commodity <strong>" + this.goods_nomenclature_item_id + "</strong> may be subject to an import <abbr title='Value-added tax'>VAT</abbr></a> rate of ";
            this.vat_string = "An import <abbr title='Value-added tax'>VAT</abbr></a> rate of ";
            if (this.vats.length == 1) {
                this.vat_string += " either ";
            }
        } else {
            this.vat_string = "Goods are subject to an import <a href='https://www.gov.uk/vat-rates'><abbr title='Value-added tax'>VAT</abbr></a> rate of ";
            // this.vat_string = "An import <abbr title='Value-added tax'>VAT</abbr></a> rate of ";
        }
        var index = 0;
        var vat_count = this.vats.length;
        var conjunctions = [];
        this.vats.sort((a, b) => (a.measure.duty_value < b.measure.duty_value) ? 1 : -1)
        switch (vat_count) {
            case 1:
                conjunctions = [];
                break;
            case 2:
                conjunctions = [' or '];
                break;
            case 3:
                conjunctions = [', ', ' or '];
                break;
            case 4:
                conjunctions = [', ', ', ', ' or '];
                break;
        }
        this.vats.forEach(calc => {
            calc.calculate();
            index++;
            if (index > 1) {
                this.vat_string += conjunctions[index - 2];
            }
            this.vat_string += "<strong>" + _.trim(calc.measure.combined_duty.replace(" * customs value", "")) + "</strong>";
            // this.vat_string +=  _.trim(calc.measure.combined_duty.replace(" * customs value", ""));
        });
        if (this.vats.length > 1) {
            this.vat_string += " may apply if certain conditions are met.</li>";
            this.vat_string += "<li>Read more about <a href='https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services'>VAT rates on different goods and services</a> and the conditions that apply to these rates.</li>";
        } else {
            this.vat_string += ".";
        }
    }

    calculate_excise() {
        if (this.excises.length == 0) {
            this.excise_string = "<a href='https://www.gov.uk/government/publications/uk-trade-tariff-excise-duties-reliefs-drawbacks-and-allowances/uk-trade-tariff-excise-duties-reliefs-drawbacks-and-allowances'>Excise duties</a> are not chargeable on this commodity.";
        } else {
            this.excise_string = "<a href='https://www.gov.uk/government/publications/uk-trade-tariff-excise-duties-reliefs-drawbacks-and-allowances/uk-trade-tariff-excise-duties-reliefs-drawbacks-and-allowances'>Excise duties</a> apply to the import of commodity " + this.goods_nomenclature_item_id + ".";
            // this.excises.forEach(calc => {
            //     calc.calculate();
            // });

        }
        var a = 1;
    }

    calculate_mfn() {
        return;
        var result;
        this.value_for_vat = this.total_cost;
        this.mfns.forEach(calc => {
            calc.calculate();
            result = calc.result;
            this.value_for_vat = this.total_cost + result;
            var a = 1;
        });

        // Recalculate the VAT in the light of the MFN
        this.vats.forEach(calc => {
            calc.monetary_value = this.value_for_vat
            calc.calculate();
        });

        var vat_count = this.vats.length;
        if (vat_count == 1) {
            this.mfns[0].addVatRate(this.vats[0]);
        } else {
            var a = 1;
            var vat_exempt = false;
            var vat_zero = false;
            var vat_reduced = false;
            var vat_appendage_string = "";
            this.vats.forEach(calc => {
                if (calc.measure.measure_type_id == "VTS" || (calc.measure.additional_code_code == null && calc.measure.measure_type_id == '305')) {
                    // Standard VAT
                    this.mfns[0].addVatRate(this.vats[0]);

                } else if (calc.measure.measure_type_id == "VTE" || (calc.measure.additional_code_code == null && calc.measure.measure_type_id == 'VATE')) {
                    // Exempt from VAT
                    vat_exempt = true;

                } else if (calc.measure.measure_type_id == "VTZ" || (calc.measure.additional_code_code == null && calc.measure.measure_type_id == 'VATZ')) {
                    // Zero-rated VAT
                    vat_zero = true;

                } else if (calc.measure.measure_type_id == "VTA" || (calc.measure.additional_code_code == null && calc.measure.measure_type_id == 'VATR')) {
                    // Reduced-rated VAT
                    vat_reduced = true;
                    var a = 1;
                    console.log("reduced rate");
                }
            });
            var sentence_started = false;
            if (vat_reduced == true) {
                var calc_string = this.mfns[0].vat.calculation_string.replace(/ \)/g, ")");
                vat_appendage_string = '<br><br>Your import may also be eligible for <strong>reduced rate VAT</strong> (' + calc_string + ')';
                this.mfns[0].vat.vat_appendage_string += vat_appendage_string;
                sentence_started = true;
            }
            if (vat_exempt == true) {
                if (sentence_started) {
                    vat_appendage_string = 'or <strong>VAT-exemption</strong>';
                } else {
                    vat_appendage_string = '<br><br>Your import may be also <strong>VAT-exempt</strong>';
                }
                this.mfns[0].vat.vat_appendage_string += vat_appendage_string;
                sentence_started = true;
            }
            if (vat_zero == true) {
                if (sentence_started) {
                    vat_appendage_string = ' or <strong>zero-rate VAT</strong>';
                } else {
                    vat_appendage_string = '<br><br>Your import may also be eligible for <strong>zero-rate VAT</strong>';
                }
                this.mfns[0].vat.vat_appendage_string += vat_appendage_string;
            }
            if (this.mfns[0].vat.vat_appendage_string != "") {
                this.mfns[0].vat.vat_appendage_string += '.<br><br>Read more about <a target="_blank" href="https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services">rates of VAT on different goods and services (opens in new tab)</a>'
            }


        }

    }

    calculate_quotas() {
        this.quotas.forEach(calc => {
            calc.calculate();
        });
    }

    calculate_preferences() {
        this.preferences.forEach(calc => {
            calc.calculate();
        });
    }

    // Assign the geographical area to the measure
    assign_geographical_areas() {
        this.measures.forEach(m => {
            this.geographical_areas.forEach(g => {
                if (m.geographical_area_id == g.id) {
                    m.geographical_area = g;
                }
            });
        });

    }

    // Assign duty expressions
    assign_duty_expressions() {
        this.measures.forEach(m => {
            this.duty_expressions.forEach(de => {
                if (m.id == de.measure_id) {
                    m.duty_expression = de;
                }
            });
        });

    }

    // Assign the additional code to the measure
    assign_additional_codes() {
        this.measures.forEach(m => {
            this.additional_codes.forEach(ac => {
                if (m.additional_code_id == ac.id) {
                    m.additional_code = ac;
                    m.additional_code_code = ac.code
                }
            });
        });

    }

    // Assign the measure components to the measures - also check for Meursing
    assign_measure_components(req) {
        this.measure_components.forEach(mc => {
            this.measures.forEach(m => {
                if (mc.measure_id == m.id) {
                    var a = 1;
                    if (mc.is_meursing) {
                        m.has_meursing = true;
                        this.has_meursing = true;
                    }
                    m.measure_components.push(mc);
                }
            });
        });

        // Set the Meursing duties for each component
        if (this.has_meursing) {
            var data = require('../data/meursing_duties.json');
            var jp = require('jsonpath');
            var query_string = '$.duties[?(@.geographical_area_id == "1011" && @.additional_code_id == "' + this.meursing_code + '")]'
            var result = jp.query(data, query_string);
            req.session.data["meursing-duties"] = result;
            if (result.length == 0) {
                this.measures.forEach(m => {
                    m.measure_components.forEach(mc => {
                        mc.duty_string_with_meursing = "";
                    });
                });
            } else {
                this.measures.forEach(m => {
                    m.measure_components.forEach(mc => {
                        if (mc.is_meursing) {
                            mc.set_meursing_overlay(result);
                        }
                    });
                });

            }
        }

        this.measures.forEach(m => {
            m.combine_duties();
        });
    }

    assign_measure_conditions() {
        this.measures.forEach(m => {
            m.measure_condition_ids.forEach(mc2 => {
                this.measure_conditions.forEach(mc => {
                    if (mc.id == mc2) {
                        m.measure_conditions.push(mc);
                        m.has_conditions = true;
                        if (mc.display_action_column) {
                            m.display_action_column = true;
                        }
                        if (mc.condition_code == "V") {
                            m.measure_condition_class = "eps";
                        }
                        if (mc.document_code != "") {
                            m.has_document_codes = true;
                        }
                    }
                });
            });
            m.structure_conditions();
        });
    }

    // Remove any measures that are not financial or are not relevant to my country
    remove_irrelevant_measures(measure_types) {
        var i;
        this.measures.forEach(m => {
            m.irrelevant_additional_code = false;
            // Check that we are just looking at financial measures
            this.measure_types.forEach(mt => {
                if (mt.id == m.measure_type_id) {
                    m.financial = mt.financial;
                    m.measure_type_series_id = mt.measure_type_series_id;
                }
            });

            // Check that we are ignoring measures with a additional code of 2551 or 2552
            var barred_codes = ['2551', '2552'];
            var additional_code_id;
            if (m.additional_code != null) {
                additional_code_id = m.additional_code.code
            } else {
                additional_code_id = "";
            }
            if (barred_codes.includes(additional_code_id)) {
                m.irrelevant_additional_code = true;
                console.log("Splicing " + additional_code_id);
            }

            // Check that we are just looking at measures aligned to the chosen country
            if ((m.geographical_area_id == this.origin) || (m.geographical_area.member_strings.includes(this.origin))) {
                m.relevant = true;
            }
        });

        if (measure_types == "financial") {
            for (i = this.measures.length - 1; i >= 0; --i) {
                var m = this.measures[i];
                if ((m.irrelevant_additional_code == true) || (m.financial == false) || (m.relevant == false)) {
                    this.measures.splice(i, 1);
                }
            }
        } else {
            for (i = this.measures.length - 1; i >= 0; --i) {
                var m = this.measures[i];
                if ((m.irrelevant_additional_code == true) || (m.has_conditions == false) || (m.relevant == false)) {
                    this.measures.splice(i, 1);
                }
            }
        }
    }

    // Get the supplementary unit
    get_supplementary_unit() {
        this.supplementary_unit = "";
        this.supplementary_unit_description = "";
        this.supplementary_unit_chief_code = "";
        this.supplementary_unit_abbreviation = "";
        this.measures.forEach(m => {
            if (this.supplementary_unit_array.includes(m.measure_type_id)) {
                this.supplementary_unit = m.measure_components[0].measurement_unit_code;
                this.lookup_supplementary_unit();
                var a = 1;
            }
        });
    }

    lookup_supplementary_unit() {
        const fs = require('fs');
        const path = require('path');

        var directoryPath = path.join(__dirname, '..');
        var directoryPath = path.join(directoryPath, "data");
        var filename = path.join(directoryPath, "supplementary_units.json");
        var unit_file = fs.readFileSync(filename, 'utf8');
        var supplementary_units = JSON.parse(unit_file);

        supplementary_units.forEach(su => {
            if ((su.unit_code == this.supplementary_unit) && (su.unit_qualifier == "")) {
                this.supplementary_unit_description = su.description;
                this.supplementary_unit_chief_code = su.chief_code;
                this.supplementary_unit_abbreviation = su.abbreviation;
            }
        });
    }

    // Work out the units
    get_units() {
        // Check all of the measures associated with this commodity / country context
        // and assign them to the "units" array
        this.measures.forEach(m => {
            if (!this.supplementary_unit_array.includes(m.measure_type_id)) {
                m.measure_components.forEach(mc => {
                    if (m.measure_type_id != '490') {
                        if (mc.unit != null) {
                            var found = false;
                            for (let unit of this.units) {
                                if ((unit.measurement_unit_code == mc.measurement_unit_code) && (unit.measurement_unit_qualifier_code == mc.measurement_unit_qualifier_code)) {
                                    var found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                this.units.push(mc.unit);
                            }
                        }
                    }
                });
            }
        });
        this.units.sort((a, b) => (a.measurement_unit_code > b.measurement_unit_code) ? 1 : -1)

        this.multiplier = 1;

        // If the goods use Meursing, then the unit must be kilograms, as that is how the Meursing
        // duties are assigned
        // this.measurement_unit = "";
        // this.measurement_units = [];
        // if (this.has_meursing) {
        //     this.units = ["KGM"];
        //     this.measurement_unit = "kilograms";
        //     this.measurement_units = ["kilograms"];
        // }
        // console.log(this.measurement_units);
    }

    pass_request(req) {
        this.req_data = req.session.data;
        this.currency = this.get_req_data("currency")
        this.monetary_value = this.get_req_data("monetary_value")
        this.total_cost = parseFloat(req.session.data["monetary_value"]);
        if (req.session.data["insurance_cost"] != "") {
            this.total_cost += parseFloat(req.session.data["insurance_cost"]);
        }
        if (req.session.data["shipping_cost"] != "") {
            this.total_cost += parseFloat(req.session.data["shipping_cost"]);
        }

        this.unit_value = this.get_req_data("unit_value")
        this.meursing_code = this.get_req_data("meursing_code");
        this.company = this.get_req_data("company");
        this.meursing_code = req.session.data["meursing-code"];
        var a = 1;
    }

    get_req_data(prop) {
        if (this.req_data.hasOwnProperty(prop)) {
            return this.req_data[prop];
        } else {
            return null;
        }
    }

    sort_measures() {
        //console.log("Sorting measures");
        this.measures.sort(compare_blocks);
        this.measures.sort(compare_measure_types);
        this.measures.sort(compare_geo);

        this.display_blocks.sort(compare_display_blocks);


        function compare_geo(a, b) {
            if (a.geographical_area.geographical_area_code < b.geographical_area.geographical_area_code) {
                return 1;
            }
            if (a.geographical_area.geographical_area_code > b.geographical_area.geographical_area_code) {
                return -1;
            }
            return 0;
        }

        function compare_display_blocks(a, b) {
            if (a.index > b.index) {
                return 1;
            }
            if (a.index < b.index) {
                return -1;
            }
            return 0;
        }

        function compare_measure_types(a, b) {
            if (a.measure_type_id < b.measure_type_id) {
                return -1;
            }
            if (a.measure_type_id > b.measure_type_id) {
                return 1;
            }
            return 0;
        }

        function compare_blocks(a, b) {
            if (a.display_block.index > b.display_block.index) {
                return -1;
            }
            if (a.display_block.index < b.display_block.index) {
                return 1;
            }

            // if (a.sort_block.sort < b.sort_block.sort) {
            //     return -1;
            // }
            // if (a.sort_block.sort > b.sort_block.sort) {
            //     return 1;
            // }

            return 0;
        }
    }


    // Categorise the measures
    categorise_measures(override_block = false) {
        // console.log("Categorising measures");
        delete require.cache['./display_block_options.json'];

        const fs = require('fs');
        const path = require('path');

        var directoryPath = path.join(__dirname, '..');
        var directoryPath = path.join(directoryPath, "classes");
        var filename = path.join(directoryPath, "display_block_options.json");
        var display_block_options_file = fs.readFileSync(filename, 'utf8');
        var display_block_options = JSON.parse(display_block_options_file);
        var display_sort_options = require('./display_sort_options.json');

        for (var [key, value] of Object.entries(display_block_options)) {
            var block = display_block_options[key];
            block.explainers.prose = block.explainers.prose.replace(/{commodity}/g, this.goods_nomenclature_item_id);
            block.explainers.prose_ni = block.explainers.prose_ni.replace(/{commodity}/g, this.goods_nomenclature_item_id);

            block.explainers.prose = block.explainers.prose.replace(/\{country_name\}/g, this.country_name2);
            block.explainers.prose_ni = block.explainers.prose_ni.replace(/\{country_name\}/g, this.country_name2);

            block.explainers.prose = block.explainers.prose.replace(/\{country\}/g, this.country);
            block.explainers.prose_ni = block.explainers.prose_ni.replace(/\{country\}/g, this.country);

            this.country = "SG";
            if (this.country.length == 0) {
                block.explainers.prose = block.explainers.prose.replace(/\{conditional_country\}.*\{\/conditional_country\}/g, "To <strong>check how to import commodity " + this.goods_nomenclature_item_id + "</strong>, select the <a href='/country/" + this.goods_nomenclature_item_id + "'>country from which you are importing</a><!-- from the dropdown above//-->.");
            } else {
                block.explainers.prose = block.explainers.prose.replace(/\{conditional_country\}/g, "");
                block.explainers.prose = block.explainers.prose.replace(/\{\/conditional_country\}/g, "");
            }
        }

        this.display_blocks = [];
        this.measures.forEach(m => {
            // Check for end use
            if (m.measure_type_id == "105") {
                this.is_end_use = true;
            }

            if (this.export_measure_ids.includes(m.id)) {
                m.block = "export";
                m.duty_bearing = false;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }
            } else if (m.measure_type_series_id == "P") {
                m.block = "vat";
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                this.vats.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));

            } else if (m.measure_type_series_id == "Q") {
                m.block = "excise";
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                this.excises.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));
            }
            else if (this.mfn_array.includes(m.measure_type_id)) {
                m.block = "mfns";
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }
                var calc = new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob);
                this.mfns.push(calc);

                if (!this.customs_duties_measures.includes(m.measure_type_id)) {
                    this.customs_duties_measures.push(m.measure_type_id);
                }

            } else if (this.agri_array.includes(m.measure_type_id)) {
                m.block = "agri"
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }
                //this.mfns.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));

            } else if (this.preference_array.includes(m.measure_type_id)) {
                m.block = "preferences"
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                this.preferences.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));

                if (!this.customs_duties_measures.includes(m.measure_type_id)) {
                    this.customs_duties_measures.push(m.measure_type_id);
                }

            } else if (this.remedy_array.includes(m.measure_type_id)) {
                this.has_remedies = true;
                m.block = "remedies"
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                this.remedies.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));

            } else if (this.suspension_array.includes(m.measure_type_id)) {
                m.block = "suspensions"
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                this.suspensions.push(new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob));

                if (!this.customs_duties_measures.includes(m.measure_type_id)) {
                    this.customs_duties_measures.push(m.measure_type_id);
                }

            } else if (this.quota_array.includes(m.measure_type_id)) {
                m.block = "quotas"
                m.duty_bearing = true;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

                var obj = new Calculation(m, this.currency, this.total_cost, this.unit_values, this.multiplier, this.meursing_code, this.company, this.meursing_blob);
                this.quotas.push(obj);

            } else {
                if (override_block == true) {
                    m.block = "other_uk"
                } else if (override_block == "smart") {
                    var a = 1;
                } else {
                    m.block = "other"
                }
                m.duty_bearing = false;
                m.sort_block = display_sort_options[m.block]
                m.display_block = display_block_options[m.sort_block.block]

                if (!this.display_blocks.includes(m.display_block)) {
                    this.display_blocks.push(m.display_block);
                }

            }
        });
        var a = 1;
    }

    get_customs_duties_string() {
        this.customs_duties_measures.sort();
        this.customs_duties_string = "";

        for (let i = 0; i < this.customs_duties_measures.length; i++) {
            let my_duty_id = this.customs_duties_measures[i];
            for (let j = 0; j < this.measure_types.length; j++) {
                let measure_type = this.measure_types[j];
                if (measure_type.id == my_duty_id) {
                    this.customs_duties_string += "<p>" + measure_type.hint + "</p>"
                }
            }
        }
        var a = 1;
    }

    format_basic_duty_rate() {
        var s;
        s = this.basic_duty_rate_string;
        s = s.replace("</span>", "");
        s = s.replace(/\<span[^\>]+\>/g, "");
        this.basic_duty_rate = s;
    }

    format_commodity_code() {
        this.heading_code = "";
        if (this.leaf != true) {
            if (this.formatted_commodity_code.substr(6, 4) == "0000") {
                this.formatted_commodity_code = this.formatted_commodity_code.substr(0, 6);
            }
            else if (this.formatted_commodity_code.substr(8, 2) == "00") {
                this.formatted_commodity_code = this.formatted_commodity_code.substr(0, 8);
            }
        }
        this.fcc2();
    }

    fcc2() {
        var s = "";
        var empty_cell = "<span>&nbsp;&nbsp;</span>";
        if (typeof this.goods_nomenclature_item_id !== 'undefined') {
            if (this.leaf) {
                s += "<span>" + this.goods_nomenclature_item_id.substr(0, 4) + "</span>";
                s += "<span>" + this.goods_nomenclature_item_id.substr(4, 4) + "</span>";
                s += "<span>" + this.goods_nomenclature_item_id.substr(8, 2) + "</span>";
            } else {
                if (this.productline_suffix != "80") {
                    s = "";
                } else {
                    s += "<span>" + this.goods_nomenclature_item_id.substr(0, 4) + "</span>";
                    // 6-digit codes
                    if (this.goods_nomenclature_item_id.substr(6, 4) == "0000") {
                        s += "<span>" + this.goods_nomenclature_item_id.substr(4, 2) + "&nbsp;&nbsp;</span>" + empty_cell;
                    }
                    // 8-digit codes
                    else if (this.goods_nomenclature_item_id.substr(8, 2) == "00") {
                        s += "<span>" + this.goods_nomenclature_item_id.substr(4, 4) + "</span>" + empty_cell;
                    }
                    // 10-digit codes
                    else {
                        s += "<span>" + this.goods_nomenclature_item_id.substr(4, 4) + "</span>";
                        s += "<span>" + this.goods_nomenclature_item_id.substr(8, 2) + "</span>";
                    }
                }
            }
        } else {
            s = "";
        }
        this.heading_code = s;
    }


    set(arr) {
        return arr.reduce(function (a, val) {
            if (a.indexOf(val) === -1) {
                a.push(val);
            }
            return a;
        }, []);
    }

    get_exchange_rate() {
        this.exchange_rate = "0.8951";
        // axios.get('https://api.exchangeratesapi.io/latest')
        //     .then((response) => {
        //         console.log("Getting exchange rate");
        //         var data = response.data;
        //         this.exchange_rate = parseFloat(data["rates"]["GBP"]);
        //     });
    }

    get_descendants(commodities, number_indents, start_at) {
        var commodity_count = commodities.length;
        for (var i = start_at; i < commodity_count; i++) {
            var c = commodities[i];
            if (c.number_indents == number_indents + 1) {
                if (i < (commodity_count - 1)) {
                    if (!c.leaf) {
                        c.get_descendants(commodities, number_indents + 1, i + 1);
                    }
                }
                this.children.push(c);
            } else if (c.number_indents == number_indents) {
                break;
            }
            // console.log(c.number_indents);
        }
    }

}
module.exports = Commodity
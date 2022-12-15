var nomar = require("nomar");
var MarkdownIt = require('markdown-it');
var _ = require('underscore');
const e = require("express");

require('./classes/global.js');

module.exports = function (env) {

    /**
     * Instantiate object used to store the methods registered as a
     * 'filter' (of the same name) within nunjucks. You can override
     * gov.uk core filters by creating filter methods of the same name.
     * @type {Object}
     */
    var filters = {}

    /* ------------------------------------------------------------------
      add your methods to the filters obj below this comment block:
      @example:
  
      filters.sayHi = function(name) {
          return 'Hi ' + name + '!'
      }
  
      Which in your templates would be used as:
  
      {{ 'Paul' | sayHi }} => 'Hi Paul'
  
      Notice the first argument of your filters method is whatever
      gets 'piped' via '|' to the filter.
  
      Filters can take additional arguments, for example:
  
      filters.sayHi = function(name,tone) {
        return (tone == 'formal' ? 'Greetings' : 'Hi') + ' ' + name + '!'
      }
  
      Which would be used like this:
  
      {{ 'Joel' | sayHi('formal') }} => 'Greetings Joel!'
      {{ 'Gemma' | sayHi }} => 'Hi Gemma!'
  
      For more on filters and how to write them see the Nunjucks
      documentation.
  
    ------------------------------------------------------------------ */
    filters.get_slice = function (str, start, lngth) {
        if (typeof str !== 'undefined') {
            s = str.substr(start, lngth);
            return s;
        } else {
            return "";
        }
    }

    filters.uri_encode = function (s) {
        return (encodeURIComponent(s));
    }

    filters.sing_plur = function (s, cnt) {
        var pluralize = require('pluralize')
        s = pluralize(s, cnt);
        return (s);
    }

    filters.remove_extension = function (s) {
        var my_array = s.split(".");
        s = my_array[0];
        return (s);
    }

    filters.format_psr = function (rule_text, minimal = false) {
        md = new MarkdownIt();
        rule_text = rule_text.replace(/;/g, ';\n');
        rule_text = md.render(rule_text);
        rule_text = rule_text.replace(/<ul/g, '<ul class="govuk-list xgovuk-list--bullet"');

        if (minimal) {
            rule_text = rule_text.replace("{{CC}}", "");
            rule_text = rule_text.replace("{{CTH}}", "");
            rule_text = rule_text.replace("{{CTSH}}", "");
            rule_text = rule_text.replace("{{WO}}", "");
            rule_text = rule_text.replace("{{EXW}}", "");
            rule_text = rule_text.replace("(RVC)", "");
            rule_text = rule_text.replace("(FOB)", "");
            rule_text = rule_text.replace("MaxNOM", "");
        } else {
            rule_text = rule_text.replace("{{CC}}", "<span class='roo_explainer'><strong>CC rule - change of chapter</strong><br>A product complies with the CC rule when all non-originating materials used in its production are classified in a different HS chapter than the product.</span>");
            rule_text = rule_text.replace("{{CTH}}", "<span class='roo_explainer'><strong>CTH rule - change in tariff heading</strong><br>A product complies with the CTH rule when all non-originating materials used in its production are classified in a different HS heading than the product.</span>");
            rule_text = rule_text.replace("{{CTSH}}", "<span class='roo_explainer'><strong>CTSH rule - change in tariff subheading</strong><br>A product complies with the CTSH rule when all of the non-originating materials used in its production are classified in a different HS subheading than the product.</span>");
            rule_text = rule_text.replace("{{WO}}", "<span class='roo_explainer'><strong>Wholly obtained</strong><br>The 'wholly obtained' rule applies mainly to basic agricultural products, fishery products, minerals, or waste and scrap.<br><br>Wholly obtained products are goods obtained entirely in the territory of one country without the addition of any non-originating materials.</span>");
            rule_text = rule_text.replace("{{EXW}}", "<span class='roo_explainer'><strong>Ex-works price</strong><br>When importing on Ex Works terms, the buyer is responsible for the whole shipment from door to door.  All costs and liabilities are with the buyer. The only responsibility for a seller during the whole transportation process is to ensure that the goods they are selling are made available for collection at their premises.</span>");
            rule_text = rule_text.replace("(RVC)", "(<a href='/help/#RVC'>RVC</a>)");
            rule_text = rule_text.replace("(FOB)", "(<a href='/help/#FOB'>FOB</a>)");
            rule_text = rule_text.replace("MaxNOM", "<a href='/help/#MaxNOM'>MaxNOM</a> (Maximum value of non-originating materials)");
        }

        return (rule_text);
    }

    filters.scope_to_full = function (scope_id) {
        if (scope_id == "xi") {
            return "Northern Ireland"
        } else {
            return "United Kingdom"
        }
    }

    filters.upper_case = function (str) {
        str = str.toUpperCase();;
        return (str);
    }

    filters.lowerFirst = function (str) {
        var _ = require('lodash');
        str = _.lowerFirst(str);
        return (str);
    }

    filters.lowerFirstExcept = function (str, str2) {
        if (str != str2) {
            var _ = require('lodash');
            str = _.lowerFirst(str);
        }
        return (str);
    }

    filters.upperFirst = function (str) {
        var _ = require('lodash');
        str = _.upperFirst(str);
        return (str);
    }

    filters.insert_vat_excise = function (str, vat_string, excise_string) {
        str = str.replace("{{ vat_text }}", vat_string);
        str = str.replace("{{ excise_text }}", excise_string);
        return (str);
    }

    filters.capitalise = function (str) {
        var _ = require('lodash');
        str = _.capitalize(str);
        return (str);
    }

    filters.title_case = function (str) {
        var _ = require('lodash');
        str = _.capitalize(_.toLower(str));
        str = str.replace("uk", "UK");
        str = str.replace("union", "Union");
        str = str.replace("Vat", "VAT");
        str = str.replace("Hmi", "HMI");
        return (str);
    }

    filters.title_case_vat_excise = function (str) {
        var _ = require('lodash');
        var tmp = _.toLower(str);
        if (tmp.indexOf("excise") > -1) {
            str = _.capitalize(_.toLower(str));
            str = str.replace("uk", "UK");
            str = str.replace("union", "Union");
            str = str.replace("Vat", "VAT");
            str = str.replace("Hmi", "HMI");
        }
        return (str);
    }

    filters.display_currency = function (str) {
        var euros = ["EUR", "EUROS", "EURO"];
        if (euros.includes(str)) {
            return "€";
        } else {
            return "£";
        }
    }

    filters.plural = function (str) {
        var pluralize = require('pluralize');
        var s = pluralize(str);
        return s;
    }

    filters.format_number = function (str, dec_places) {
        var s = format_number(str, dec_places);
        return s;
    }

    filters.format_date = function (str, fmt) {
        var s;
        if (str == "") {
            s = "";
        } else {
            s = format_date(str, fmt);
        }
        return s;
    }

    filters.format_balance = function (s) {
        var format = require('format-number');
        var formattedNumber = format({ truncate: 12 })(s);
        return formattedNumber;
    }

    filters.decimals = function (str, cnt) {
        var i = parseFloat(str)
        var n = i.toFixed(cnt).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        return n;
    }

    filters.substring = function (str, start, lngth) {
        if (typeof str !== 'undefined') {
            return str.substr(start, lngth);
        } else {
            return "";
        }
    }

    filters.format_commodity_code = function (str, separator = " ") {
        if (typeof str !== 'undefined') {
            s = str.substr(0, 4) + separator;
            s += str.substr(4, 2) + separator;
            s += str.substr(6, 2) + separator;
            s += str.substr(8, 2);
            return s;
        } else {
            return "";
        }
    }

    filters.format_commodity_code2 = function (str) {
        if (typeof str !== 'undefined') {
            s = "<span>" + str.substr(0, 4) + "</span>";
            if (str.length > 4) {
                s += "<span>" + str.substr(4, 4) + "</span>";
            }
            if (str.length > 8) {
                s += "<span>" + str.substr(8, 2) + "</span>";
            }
            return s;
        } else {
            return "";
        }
    }

    filters.format_and_trim_commodity_code = function (str, end_line = false) {
        var s = global.format_and_trim_commodity_code(str, end_line);
        return (s);
    }

    filters.format_commodity_code3 = function (str, entity) {
        var s;
        if (typeof str !== 'undefined') {
            if ((entity.class == "chapter")) {
                s = str.substr(0, 2);
            } else if ((entity.class == "subheading") || (entity.class == "heading")) {
                if (str.slice(-6) == "000000") {
                    s = "<span>" + str.substr(0, 4) + "</span>";
                } else if (str.slice(-4) == "0000") {
                    s = "<span>" + str.substr(0, 4) + "</span>";
                    s += "<span>" + str.substr(4, 2) + "</span>";
                } else if (str.slice(-2) == "00") {
                    s = "<span>" + str.substr(0, 4) + "</span>";
                    s += "<span>" + str.substr(4, 4) + "</span>";
                } else {
                    s = "<span>" + str.substr(0, 4) + "</span>";
                    s += "<span>" + str.substr(4, 4) + "</span>";
                    s += "<span>" + str.substr(8, 2) + "</span>";
                }
            } else {
                s = "<span>" + str.substr(0, 4) + "</span>";
                s += "<span>" + str.substr(4, 4) + "</span>";
                s += "<span>" + str.substr(8, 2) + "</span>";
            }
            return s;
        } else {
            return "";
        }
    }

    filters.format_order_number = function (str, separator = ".") {
        if (typeof str !== 'undefined') {
            s = str.substr(0, 2) + separator;
            s += str.substr(2, 4);
            return s;
        } else {
            return "";
        }
    }

    filters.roman = function (str) {
        if (typeof str !== 'undefined') {
            return nomar(parseInt(str));
        } else {
            return "";
        }
    }

    filters.convert_markdown = function (str, hide_bullets = false, add_back_to_top = false, insert_toc = false) {
        console.log(str)
        if ((typeof str === 'undefined') || (!str)) {
            return ("")
        } else {
            str = str.replace(/-&nbsp;/g, "- ")
            var menu = ""
            try {
                if (typeof str !== 'undefined') {
                    if (add_back_to_top) {
                        str += "\n\n{{ top }}\n"
                    }

                    md = new MarkdownIt();
                    str = str.replace(/\* ([0-9]{1,2})\\. /g, '$1. ');
                    str = str.replace(/  \* \(([a-z]{1,2})\)/g, '\n\n    $1. ');

                    var markdown_text = md.render(str);
                    markdown_text = markdown_text.replace(/&lt;/g, "<");
                    markdown_text = markdown_text.replace(/&gt;/g, ">");
                    markdown_text = markdown_text.replace(/<h1>/g, "<h1 class='govuk-heading-l'>");
                    markdown_text = markdown_text.replace(/<h2>/g, "<h2 class='govuk-heading-m'>");
                    markdown_text = markdown_text.replace(/<h3>/g, "<h3 class='govuk-heading-s'>");
                    markdown_text = markdown_text.replace(/<h4>/g, "<h4 class='govuk-heading-xs'>");
                    markdown_text = markdown_text.replace(/{{ top }}/g, "<a href='#top'>Back to top</a>");
                    markdown_text = markdown_text.replace(/<table>/g, '<table class="govuk-table">');
                    markdown_text = markdown_text.replace(/<tr>/g, '<tr class="govuk-table__row">');
                    markdown_text = markdown_text.replace(/<th>/g, '<th scope="col" class="govuk-table__header">');
                    markdown_text = markdown_text.replace(/<td>/g, '<td class="govuk-table__cell">');
                    markdown_text = markdown_text.replace(/<thead>/g, '<thead class="govuk-table__head">');
                    markdown_text = markdown_text.replace(/<tbody>/g, '<tbody class="govuk-table__body">');

                    if (hide_bullets) {
                        markdown_text = markdown_text.replace(/<ul>/g, "<ul class='govuk-list'>")
                    } else {
                        markdown_text = markdown_text.replace(/<ul>/g, "<ul class='govuk-list govuk-list--bullet'>")
                    }
                    markdown_text = markdown_text.replace(/<ol>/g, "<ol class='govuk-list govuk-list--number'>")


                    // insert_toc = false
                    if (insert_toc) {
                        // Create the table of contents
                        str = "\n" + str
                        const regex_h2 = /[^#]## [^\n]+\n/ig
                        let matches = str.match(regex_h2);
                        if (matches) {
                            let contents = []
                            matches.forEach(match => {
                                match = match.replace("## ", "").replace("\n", "").trim()
                                contents.push(match)
                            });
                            if (contents.length > 0) {
                                menu = '<h2 class="gem-c-contents-list__title">Contents</h2><ol class="gem-c-contents-list__list govuk-!-margin-bottom-6">'
                                contents.forEach(item => {
                                    var item2 = item.toLowerCase().replace(/[^0-9a-z]/ig, "-")
                                    menu += '<li class="gem-c-contents-list__list-item gem-c-contents-list__list-item--dashed"><a class="gem-c-contents-list__link govuk-link govuk-link--no-underline" href="#' + item2 + '">' + item + '</a></li>'
                                });
                                menu += '</ol>'
                            }
                            markdown_text = menu + markdown_text

                            // Update the h2 tags
                            const regex_h2b = /<h2 class='govuk-heading-m'>([^<]+)<\/h2>/gm
                            let matches2 = markdown_text.match(regex_h2b);
                            let contents2 = []
                            matches2.forEach(match => {
                                var match2 = match.replace("<h2 class='govuk-heading-m'>", "").replace("</h2>", "").trim()
                                var match3 = match2.toLowerCase().replace(/[^0-9a-z]/ig, "-")
                                var a = 1
                                markdown_text = markdown_text.replace(match, "<h2 class='govuk-heading-m' id='" + match3 + "'>" + match2 + "</h2>");
                            });
                        }
                    }
                    return markdown_text;
                } else {
                    return "";
                }
            } catch {
                var a = 1;
            }
        }
    }

    filters.fwdslash = function (s) {
        if (s == "") {
            return "";
        } else {
            return (s + "/");
        }
    }

    filters.other_scope = function (current_url, scope) {
        current_url = String(current_url);

        if (current_url != "") {
            if (current_url.slice(-1) != "/") {
                current_url += "/";
            }
        }

        if (scope == "xi") {
            // Get UK URL if you are currenly on XI service
            current_url = current_url.replace("/xi", "");
            current_url = current_url.replace("{{ scope_id }}", "");
        } else {
            // Get XI URL if you are currenly on UK service
            if (current_url.indexOf("{{ scope_id }}") !== -1) {
                current_url = current_url.replace("{{ scope_id }}", "xi");
            } else {
                current_url = "/xi" + current_url;
            }
        }

        current_url = current_url.replace("//", "/");
        return (current_url);
    }

    filters.filter_erga_omnes = function (s) {
        if (s == "ERGA OMNES") {
            return ("All countries");
        } else {
            return (s);
        }
    }

    filters.add_comm_code_href = function (s) {
        s = s.replace(/<h1/g, "<h1 class='govuk-heading-l'");

        var regex = /([0-9]{10})/g;
        var repl = "<a href='/commodities/$1'>$1</a>";
        s = s.replace(regex, repl);
        return (s);
    }

    filters.url_safe = function (s) {
        s = s.toLowerCase().replace(/ /g, "_");
        return (s);
    }

    filters.strip_zeros = function (s) {
        if (s.substr(s.length - 4) == "0000") {
            s = s.substr(0, 6);
        } else if (s.substr(s.length - 2) == "00") {
            s = s.substr(0, 8);
        }
        return (s);
    }


    filters.cleanse = function (s) {
        s = s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "");
        return (s);
    }

    filters.highlight = function (s, term) {
        const pluralize = require('pluralize');

        if (s.includes("phosphorus and potassium;")) {
            var a = 1;
        }

        if (typeof term !== 'undefined') {
            var all_terms = [];
            var out = "";
            term = term.toLowerCase();
            var terms = term.split(" ");
            // var terms = term.split(/[\s,;]+/);

            terms.forEach(term => {
                all_terms.push(pluralize(term, 1));
                all_terms.push(pluralize(term, 2));
            });

            all_terms.forEach(term => {
                var replace = "(\\b)(" + term + ")(\\b)";
                var re = new RegExp(replace, "gmi");

                s = s.replace(re, "$1<span class='hi'>$2</span>$3");
            });
            out = s;
        } else {
            out = s;
        }

        return (out);
    }

    filters.pad_start = function (s, item_count, pad_char = '0') {
        s = s.padStart(item_count, pad_char)
        return s
    }

    filters.pad_end = function (s, item_count, pad_char = '0') {
        s = s.padEnd(item_count, pad_char)
        return s
    }

    filters.trim_string = function (s) {
        if (s == null) {
            return "";
        } else {
            s = s.trim();
            return (s);
        }
    }

    filters.strip_formatting = function (s) {
        var regex = /\<abbr[^\>]+\>/g;
        s = s.replace(regex, "");

        var regex = /\<\/abbr\>/g;
        s = s.replace(regex, "");

        var regex = /\<\/span\>/g;
        s = s.replace(regex, "");

        var regex = /\<span\>/g;
        s = s.replace(regex, "");

        return (s)
    }

    filters.linkify = function (s) {
        if (s == null) { s = "" }
        s = s.toLowerCase()
        s = s.replace(/[^a-zA-Z]/g, "")
        return s
    }

    filters.no_break = function (s) {
        s = s.replace(" ", "&nbsp;")
        return s
    }

    filters.link_roo_terms = function (s) {
        s = s.replace("EXW", '<a href="/static/roo/exw">EXW</a>')
        s = s.replace("MaxNOM", '<a href="/static/roo/maxnom">MaxNOM</a>')
        s = s.replace("RVC", '<a href="/static/roo/rvc">RVC</a>')
        s = s.replace("FOB", '<a href="/static/roo/fob">FOB</a>')
        return s
    }

    filters.unabbreviate = function (s, measure_type_id, measure_sid) {
        if (measure_sid == 20000814) {
            var a = 1;
        }
        var _ = require('lodash');
        var supplementary_units = ['109', '110', '111']

        var measurement_units = require('./data/measurement_units/measurement_units.json')
        var altered = false;
        measurement_units.forEach(measurement_unit => {
            if (!altered) {
                s_old = s

                if (measurement_unit["full"]) {
                    var a = 1;
                    if (s == measurement_unit["old"]) {
                        s = measurement_unit["new"]
                    }
                    // if (supplementary_units.includes(measure_type_id)) {
                    //     s = s.replace(measurement_unit["old"], measurement_unit["new"]);
                    // } else {
                    //     s = s.replace(measurement_unit["old"], _.lowerFirst(measurement_unit["new"]));
                    // }
                } else {
                    if (supplementary_units.includes(measure_type_id)) {
                        s = s.replace(measurement_unit["old"], measurement_unit["new"]);
                    } else {
                        s = s.replace(measurement_unit["old"], _.lowerFirst(measurement_unit["new"]));
                    }
                }
                if (s != s_old) {
                    altered = true;
                }
            }
        });

        var regex = /([0-9]+.[0-9]+) GBP/g; // Put the £ sign first
        s = s.replace(regex, "£\$1");

        var regex = / %/g; // Space then percentage 
        s = s.replace(regex, "%");

        var regex = / \/ /g; // Space around the forward slash
        s = s.replace(regex, "&nbsp;/&nbsp;");

        var regex = / kg/g; // Space then percentage
        s = s.replace(regex, "&nbsp;kg");

        var regex = /TEMP/g; // needed
        s = s.replace(regex, "");


        return (s)
    }


    /* ------------------------------------------------------------------
      keep the following line to return your filters to the app
    ------------------------------------------------------------------ */
    return filters
}

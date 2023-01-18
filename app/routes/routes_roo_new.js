const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Heading = require('../classes/heading.js');
const Commodity = require('../classes/commodity.js');
const ImportedContext = require('../classes/imported_context.js');
const Error_handler = require('../classes/error_handler.js');
const date = require('date-and-time');
const GeographicalArea = require('../classes/geographical_area');
const Link = require('../classes/link');
const Context = require('../classes/context');
const RooScheme = require('../classes/roo_scheme');

const { xor } = require('lodash');

require('../classes/global.js');
require('../classes/news.js');
require('../classes/validator.js');

// Add your routes here - above the module.exports line

const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

// Data handler
router.get(['/roo/data_handler/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    var url;
    context.get_scope();
    context.get_country(req);
    context.get_commodity(req);
    context.get_phase(req);

    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_product_specific_rules_json(req, "check_wo_only");


    if (context.phase == "trade_direction") {
        // If there are possibly multiple schemes, such as Kenya, Ghana, Viet Nam or Moldova,
        // then we redirect to the page to select the appropriate scheme
        // otherwise we go to to 'general originating requirements' page
        if ((context.multiple_schemes) && (context.scheme_code == "")) {
            var url = "/roo/scheme_select/" + context.goods_nomenclature_item_id + "/" + context.country + "/";
        } else {
            var url = "/roo/origination/" + context.goods_nomenclature_item_id + "/" + context.country
        }
    }
    else if (context.phase == "wholly_obtained") {
        context.get_wholly_obtained(req);
        // If the user says at this early stage that the goods are wholly obtained, then
        // take them to the proofs + verification page
        // else take them to the cumulation page instead.
        if (context.wholly_obtained) {
            url = "/roo/met/" + context.goods_nomenclature_item_id + "/" + context.country;
        } else {
            if (context.wholly_obtained_only_rule_applies) {
                url = "/roo/not_met/" + context.goods_nomenclature_item_id + "/" + context.country;
            } else {
                url = "/roo/not_wholly_obtained/" + context.goods_nomenclature_item_id + "/" + context.country;
            }
        }

    } else if (context.phase == "scheme_select") {
        // From selecting a scheme, take the user to the trade direction screen (always)
        context.scheme_code = req.session.data["scheme_code"];
        url = "/roo/trade_direction/" + context.goods_nomenclature_item_id + "/" + context.country;

    } else if (context.phase == "insufficient_processing") {
        context.get_insufficient_processing(req);
        if (context.insufficient_processing) {
            url = "/roo/product_specific_rules/" + context.goods_nomenclature_item_id + "/" + context.country;
        } else {
            url = "/roo/not_met/" + context.goods_nomenclature_item_id + "/" + context.country;
        }

    } else if (context.phase == "select_subdivision") {
        url = "/roo/product_specific_rules/" + context.goods_nomenclature_item_id + "/" + context.country;

    } else if (context.phase == "product_specific_rules") {
        context.get_rules_met(req);
        if (context.met_product_specific_rules) {
            url = "/roo/met/" + context.goods_nomenclature_item_id + "/" + context.country;
        } else {
            url = "/roo/not_met/" + context.goods_nomenclature_item_id + "/" + context.country;
        }

    } else if (context.phase == "tolerances") {
        context.get_tolerances(req);
        if (context.met_tolerances) {
            url = "/roo/proofs/" + context.goods_nomenclature_item_id + "/" + context.country;
        } else {
            url = "/roo/sets/" + context.goods_nomenclature_item_id + "/" + context.country;
        }

    } else if (context.phase == "sets") {
        context.get_met_set(req);
        if (context.met_set) {
            url = "/roo/proofs/" + context.goods_nomenclature_item_id + "/" + context.country;
        } else {
            url = "/roo/not_met/" + context.goods_nomenclature_item_id + "/" + context.country;
        }
    }

    res.redirect(url);
});

// 01 Trade Direction
router.get(['/roo/trade_direction/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.set_phase("trade_direction", "trade_direction");
    // context.scheme_code = req.session.data["scheme_code"];
    // req.session.data["scheme_code"] = "";
    // context.scheme_code = "";

    context.get_scope();
    context.get_country(req);
    context.get_commodity(req);
    context.get_roo_origin(req);
    context.get_scheme_code(req);

    if (typeof context.scheme_code === 'undefined') {
        context.scheme_code = "";
    }
    if ((context.multiple_schemes) && (context.scheme_code == "")) {
        var url = "/roo/scheme_select/" + context.goods_nomenclature_item_id + "/" + context.country + "/";
        res.redirect(url);
    } else {
        context.get_product_specific_rules_json(req, "check_wo_only");
        res.render('roo_new/01_trade_direction', {
            'context': context
        });
    }
});

// 01b Select one of multiple schemes
router.get(['/roo/scheme_select/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    req.session.data["scheme_code"] = "";
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);

    res.render('roo_new/01b_scheme_select', {
        'context': context
    });
});



// 02 Origination
router.get(['/roo/origination/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.reset_subdivision(req);
        context.set_phase("origination", "origination");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        await context.get_related_duties();
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_product_specific_rules_json(req, "check_wo_only");
        if ((context.multiple_schemes) && (context.scheme_code == '')) {
            var url = "/roo/scheme_select/" + context.goods_nomenclature_item_id + "/" + context.country + "/";
            res.redirect(url);
        } else {
            if (context.trade_direction == "import") {
                context.get_article("originating_import");
            } else {
                context.get_article("originating_export");
            }

            res.render('roo_new/02_originate', {
                'context': context
            });
        }
    }));

// 03 Wholly obtained info
router.get(['/roo/wholly_obtained_info/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "wholly_obtained");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_article("wholly-obtained");
    context.get_article("wholly-obtained-vessels");

    res.render('roo_new/03_wholly_obtained_info', {
        'context': context
    });
});

// 04 Neutral
router.get(['/roo/neutral/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "neutral");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_article("neutral-elements");
    context.get_article("packaging");
    context.get_article("accessories");

    res.render('roo_new/04_neutral', {
        'context': context
    });
});

// 05 Wholly obtained form
router.get(['/roo/wholly_obtained/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "wholly_obtained");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    // context.get_article("wholly-obtained");

    res.render('roo_new/05_wholly_obtained_form', {
        'context': context
    });
});

// 06 Not wholly obtained
router.get(['/roo/not_wholly_obtained/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    // context.get_article("wholly-obtained");

    res.render('roo_new/06_not_wholly_obtained', {
        'context': context
    });
});

// 07 Cumulation
router.get(['/roo/cumulation/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "cumulation");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    if (context.trade_direction == "import") {
        context.get_article("cumulation-import");
    } else {
        context.get_article("cumulation-export");
    }

    res.render('roo_new/07_cumulation', {
        'context': context
    });
});

// 07b Cumulation map
router.get(['/roo/cumulation_map/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "cumulation");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    if (context.trade_direction == "import") {
        context.get_article("cumulation-import");
    } else {
        context.get_article("cumulation-export");
    }
    res.render('roo_new/07b_cumulation_map', {
        'context': context
    });
});

// 08 Insufficient processing
router.get(['/roo/insufficient_processing/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.reset_subdivision(req);
    context.set_phase("origination", "insufficient_processing");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_article("insufficient-processing")

    res.render('roo_new/08_insufficient_processing', {
        'context': context
    });
});

// 09a Product-specific rules
router.get(
    [
        '/roo/product_specific_rules/:goods_nomenclature_item_id/:country/'
    ],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("origination", "product_specific_rules");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("sufficiently-worked")
        context.get_definitions();
        context.get_roo_intro_notes(req);
        context.get_product_specific_rules_json(req);

        if (context.show_subdivision_selector) {
            var url = "/roo/product_specific_rules_subdivisions/" + context.goods_nomenclature_item_id + "/" + context.country + "/"
            res.redirect(url);
        } else {
            res.render('roo_new/09a_product_specific_rules', {
                'context': context
            });
        }

    }));


// 09b Product-specific rules - select a subdivision
router.get(
    [
        '/roo/product_specific_rules_subdivisions/:goods_nomenclature_item_id/:country/'
    ],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("origination", "product_specific_rules");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("sufficiently-worked")
        context.get_definitions();
        context.get_roo_intro_notes(req);
        context.get_subdivisions();

        res.render('roo_new/09b_product_specific_rules_subdivisions', {
            'context': context
        });

    }));

// 10 Tolerances
router.get(['/roo/tolerances/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_article("tolerances")

    res.render('roo_new/10_tolerances', {
        'context': context
    });
});

// 11 Sets
router.get(['/roo/sets/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_article("sets")

    res.render('roo_new/11_sets', {
        'context': context
    });
});

// Origin processes
router.get([
    '/roo/origin_processes/:goods_nomenclature_item_id/:country/',
    '/roo/origin_processes/:goods_nomenclature_item_id/:country/:index'
],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_origin_index(req);
        context.set_phase("verification", "processes");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        await context.get_proofs();
        await context.get_roo_links();
        context.get_article("origin_processes")

        res.render('roo_new/25_origin_processes', {
            'context': context
        });
    }));

// Verification
router.get(['/roo/verification/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("verification", "verification");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("verification")

        res.render('roo_new/30_verification', {
            'context': context
        });
    }));


// Duty drawback
router.get(['/roo/duty_drawback/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("duty_drawback", "duty_drawback");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("duty-drawback")

        res.render('roo_new/35_duty_drawback', {
            'context': context
        });
    }));


// Non-alteration
router.get(['/roo/non_alteration/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("non_alteration", "non_alteration");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("direct-transport")
        context.get_article("non-alteration")

        res.render('roo_new/36_non_alteration', {
            'context': context
        });
    }));


// Direct transport
router.get(['/roo/direct_transport/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("direct_transport", "direct_transport");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_article("direct-transport")
        context.get_article("non-alteration")

        res.render('roo_new/37_direct_transport', {
            'context': context
        });
    }));

// Met
router.get(['/roo/met/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("verification", "proofs");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.check_for_duty_drawback();
        context.check_for_non_alteration();
        context.check_for_direct_transport();
        context.get_product_specific_rules_json(req, "check_wo_only");
        await context.get_proofs();
        await context.get_roo_links();

        res.render('roo_new/20_met', {
            'context': context
        });
    }));

// Not met
router.get(['/roo/not_met/:goods_nomenclature_item_id/:country/'], function (req, res) {
    var context = new Context(req, "commodity");
    context.set_phase("", "");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_product_specific_rules_json(req, "check_wo_only");
    context.get_article("sets")

    res.render('roo_new/20_not_met', {
        'context': context
    });
});


// Proofs (also Met)
router.get(['/roo/proofs/:goods_nomenclature_item_id/:country/'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.set_phase("verification", "proofs");
        context.get_country(req);
        context.get_commodity(req);
        context.get_trade_direction(req);
        context.get_scope();
        context.get_roo_origin(req);
        context.get_scheme_code(req);
        context.get_product_specific_rules_json(req, "check_wo_only");
        await context.get_proofs();
        await context.get_roo_links();

        res.render('roo_new/15_proofs', {
            'context': context
        });
    }));



// Compare PSRs
router.get(['/roo/compare/:goods_nomenclature_item_id/'], async function (req, res) {
    var context = new Context(req, "commodity");
    var countries = global.get_countries(req.session.data["country"]);
    var date = global.get_date(req);
    context.get_country(req, params_only = true);
    context.get_feature_flags();
    context.goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    context.subheading = context.goods_nomenclature_item_id.substr(0, 6)
    req.session.data["scheme_code"] = "";
    context.scheme_code = "";

    var c;
    req.session.data["goods_nomenclature_item_id"] = req.params["goods_nomenclature_item_id"];
    req.session.data["error"] = "";
    var url_original;
    if (context.country == null) {
        var url = 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"];
    } else {
        var url = 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"] + "?filter[geographical_area_id]=" + context.country;
    }
    if (context.simulation_date != "") {
        if (url.includes("?")) {
            url += "&";
        } else {
            url += "?";
        }
        url += "as_of=" + context.simulation_date;
    }
    // Set the URLs to access
    var data = require('../data/roo/uk/roo_compare.json')
    var urls = [url]
    data.forEach(country => {
        if (country != "") {
            urls.push("https://www.trade-tariff.service.gov.uk/api/v2/rules_of_origin_schemes/" + context.subheading + "/" + country)
        }
    });

    /*
    | Perform the HTTP get request via Axios
    | It returns a Promise immediately,
    | not the response
    */
    const requests = urls.map((url) => axios.get(url));
    /*
    | For waiting the Promise is fulfilled
    | with the Response, use the then() method.
    | If the HTTP request received errors
    | use catch() method
    */
    roo_schemes = []
    axios.all(requests).then((responses) => {
        responses.forEach((resp) => {
            var a = 1
            if (resp.config.url.includes("commodities")) {
                c = new Commodity();
                c.country = context.country;
                c.pass_request(req);
                c.get_data(resp.data);
                c.get_measure_data(req, "basic");
            } else {
                let msg = {
                    server: resp.headers.server,
                    status: resp.status,
                    fields: Object.keys(resp.data).toString(),
                };
                var data = resp.data.data
                var included = resp.data.included
                data.forEach(scheme => {
                    var roo_scheme = new RooScheme(scheme, included)
                    roo_schemes.push(roo_scheme)
                });
                console.info(resp.config.url);
                console.table(msg);
            }
        });

        res.render('roo_new/50_compare', {
            'commodity': c,
            'context': context,
            'roo_schemes': roo_schemes
        });
    });
});



// Test the PSRs - not this one
router.get(['/roo/test_psr'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        context.get_all_psrs();

        res.render('roo_new/99_roo_test', {
            'context': context
        });
    }));

// Test the PSRs
router.get(['/roo/test_psr/:file', '/uk/roo/test_psr/:file', '/xi/roo/test_psr/:file'],
    asyncMiddleware(async (req, res, next) => {
        var context = new Context(req, "commodity");
        if (req.originalUrl.includes("xi")) {
            context.scope_id = "xi"
        } else {
            context.scope_id = "uk"
        }

        context.get_all_psrs();
        context.get_all_psrs_for_scheme(req);

        res.render('roo_new/99_roo_test', {
            'context': context
        });
    }));

// Document
router.get([
    '/roo/document/:goods_nomenclature_item_id/:country/:document/:title/'
], function (req, res) {
    var context = new Context(req, "commodity");
    context.get_country(req);
    context.get_commodity(req);
    context.get_trade_direction(req);
    context.get_scope();
    context.get_roo_origin(req);
    context.get_scheme_code(req);
    context.get_document(req);

    res.render('roo_new/99_document', {
        'context': context
    });
});


function govify(s) {
    s = s.replace(/<h1/g, "<h1 class='govuk-heading-l'");
    s = s.replace(/<h2/g, "<h2 class='govuk-heading-m'");
    s = s.replace(/<h3/g, "<h3 class='govuk-heading-s'");
    s = s.replace(/<ul/g, "<ul class='govuk-list govuk-list--bullet'");
    s = s.replace(/<ol/g, "<ol class='govuk-list govuk-list--number'");

    s = s.replace(/<h3 class='govuk-heading-s'>([^<]*)<\/h3>/gm, "<h3 class='govuk-heading-s' id='$1'>$1</h3>");

    return (s);
}
/* Rules of origin ends here */


module.exports = router

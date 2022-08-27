const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Heading = require('../classes/heading.js');
const Commodity = require('../classes/commodity.js');
const Roo = require('../classes/roo.js');
const ImportedContext = require('../classes/imported_context.js');
const Error_handler = require('../classes/error_handler.js');
const date = require('date-and-time');
const GeographicalArea = require('../classes/geographical_area');
const Link = require('../classes/link');
const Context = require('../classes/context');
const { xor } = require('lodash');

require('../classes/global.js');
require('../classes/news.js');
require('../classes/validator.js');

// Add your routes here - above the module.exports line

// Calculator - Data handler
router.get(['/duty-calculator/:scope_id/data_handler/:goods_nomenclature_item_id', '/duty-calculator/data_handler/'], function (req, res) {
    var err, referer, c;
    var context = new Context(req);
    referer = req.headers.referer;

    if (referer.indexOf("date") !== -1) {
        global.validate_date(req, res);

    } else if (referer.indexOf("destination") !== -1) {
        global.validate_destination(req, res);

    } else if (referer.indexOf("certificate_of_origin") !== -1) {
        global.validate_certificate_of_origin(req, res);

    } else if ((referer.indexOf("origin") !== -1) && (referer.indexOf("certificate") === -1)) {
        global.validate_origin(req, res);

    } else if (referer.indexOf("uk_trader") !== -1) {
        global.validate_uk_trader(req, res);

    } else if (referer.indexOf("processing") !== -1) {
        global.validate_processing(req, res);

    } else if (referer.indexOf("monetary_value") !== -1) {
        global.validate_monetary_value(req, res);

    } else if (referer.indexOf("unit_value") !== -1) {
        var a = 1;
        global.validate_unit_value(req, res);

    } else if (referer.indexOf("final_use") !== -1) {
        var a = 1;
        global.validate_final_use(req, res);

    } else if (referer.indexOf("meursing") !== -1) {
        // Validate the Meursing start page

        var meursing_known = req.session.data["meursing-known"];
        if (meursing_known == "no") {
            res.redirect("/meursing/starch-glucose");
        } else {
            var url = "/duty-calculator/confirm/" + req.params["goods_nomenclature_item_id"];
            res.redirect(url);
        }
    }
});

// Calculator - Date
router.get('/duty-calculator/:scope_id/:goods_nomenclature_item_id/import-date', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);

    global.kill_session_vars(req, [
        'uk_trader_string', 'final_use_string',
        'processing_string', 'certificate_string', 'unit_string'
    ]);
    req.session.data["at_risk"] = false;

    var err = req.session.data["error"];
    var import_date_day = req.session.data["import_date-day"];
    var import_date_month = req.session.data["import_date-month"];
    var import_date_year = req.session.data["import_date-year"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/01_date', {
                'commodity': c,
                'context': context,
                'error': err,
                'import_date_day': import_date_day,
                'import_date_month': import_date_month,
                'import_date_year': import_date_year
            });
        });
});

// Calculator - Destination
router.get('/duty-calculator/:scope_id/:goods_nomenclature_item_id/import-destination', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Destination");
    var err = req.session.data["error"];
    var destination = req.session.data["destination"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/02_destination', {
                'context': context,
                'commodity': c,
                'error': err,
                'destination': destination
            });
        });
});

// Calculator - Origin
router.get('/duty-calculator/:scope_id/:goods_nomenclature_item_id/country-of-origin', function (req, res) {
    var context = new Context(req);
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03_origin', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - UK trader scheme (XI only)
router.get('/duty-calculator/uk_trader/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03b_uktrader', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - Final use (XI only)
router.get('/duty-calculator/final_use/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03c_final_use', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - turnover (XI only)
router.get('/duty-calculator/turnover/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03d_turnover', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - processing (XI only)
router.get('/duty-calculator/processing/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03e_processing', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - certificate of origin (XI only)
router.get('/duty-calculator/certificate_of_origin/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Origin");
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/03f_certificate_of_origin', {
                'commodity': c,
                'context': context,
                'error': err,
                'origin': origin
            });
        });
});

// Calculator - Monetary value
router.get('/duty-calculator/monetary_value/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Monetary value");
    var err = req.session.data["error"];
    var monetary_value = req.session.data["monetary_value"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('calculate/04_monetary_value', {
                'commodity': c,
                'context': context,
                'error': err,
                'monetary_value': monetary_value
            });
        });
});

// Calculator - Unit value
router.get('/duty-calculator/unit_value/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Unit value");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/05_unit_value', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - additional code
router.get(['/duty-calculator/additional-code/:goods_nomenclature_item_id', '/duty-calculator/additional-code'], function (req, res) {
    var context = new Context(req);
    var url = global.get_commodity_api(req);

    axios.get(url)
        .then((response) => {
            var err = null;
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            var a = 1;
            res.render('calculate/10_additional_code', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});




// Calculator - certificate
router.get(['/duty-calculator/certificate/:goods_nomenclature_item_id', '/duty-calculator/certificate'], function (req, res) {
    var context = new Context(req);
    var url = global.get_commodity_api(req);
    // if (req.session.data["origin"] != "") {
    //     url += "?filter[geographical_area_id]=" + req.session.data["origin"];
    // }
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            c.get_certificates();
            var a = 1;
            res.render('calculate/11_certificate', {
                'commodity': c,
                'context': context,
                'error': null
            });
        });
    var a = 1;
});


// Calculator - Company
router.get('/duty-calculator/company/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Company");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/07_company', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - VAT rate choice
router.get('/duty-calculator/vat/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Company");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/08_vat', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - excise choice
router.get('/duty-calculator/excise/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Company");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/08_excise', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - excise rate choice
router.get('/duty-calculator/excise_abv/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Company");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/09_excise_abv', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - excise rate choice
router.get('/duty-calculator/excise_production/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    //console.log("Company");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "company";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/09_excise_production', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Confirm
router.get('/duty-calculator/confirm/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);

    //console.log("Confirm");
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);

    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "confirm";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/50_confirm', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results
router.get('/duty-calculator/results/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/99_results', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results explicitly for GB to NI
router.get('/duty-calculator/results_gb_ni/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.unit_values = req.session.data["unit_values"];
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/99_results_gb_ni', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results (flat - dummy HTML)
router.get('/duty-calculator/results_flat/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/99_results_flat', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results (all - dummy HTML)
router.get('/duty-calculator/results/:goods_nomenclature_item_id/:file', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    file = req.params["file"];
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/99_' + file, {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results index
router.get('/duty-calculator/results', function (req, res) {
    var context = new Context(req);
    res.render('calculate/98_results_pages');
});

// Calculator - Confirmatory message panel
router.get('/duty-calculator/message/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/90_message', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});



// Calculator - Confirmatory message panel
router.get('/duty-calculator/message2/:scenario', function (req, res) {
    var context = new Context(req);
    var scenario = req.params["scenario"];
    var content = require('./classes/message_content.json');
    var retrieved_content = content["data"][scenario];

    req.session.data["message"] = retrieved_content;
    res.render('calculate/90_message', {
        'context': context,
        'message': retrieved_content
    });
});

// Calculator - Interstitial trade defence
router.get('/duty-calculator/trade_defence/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/interstitial_trade_defence', {
                'context': context,
                'commodity': c,
                'error': err
            });
        });
});


// Calculator - Results (flat - dummy HTML)
router.get('/duty-calculator/ni_to_gb/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/final_ni_to_gb', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});


// Calculator - Meursing
router.get('/duty-calculator/meursing/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/90_meursing', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});


// Calculator - Results (flat - dummy HTML)
router.get('/duty-calculator/differential/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/final_differential', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});


// Calculator - Results (flat - dummy HTML)
router.get('/duty-calculator/commodity_not_permitted/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    // scope_id = global.get_scope(req.params["scope_id"]);
    // scope_id = "";
    // root_url = global.get_root_url(req, scope_id);
    var err = req.session.data["error"];
    var url = global.get_commodity_api(req);
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.phase = "results";
            c.get_data(response.data);
            c.get_measure_data(req, req.session.data["origin"]);
            res.render('calculate/commodity_not_permitted', {
                'commodity': c,
                'context': context,
                'error': err
            });
        });
});

// Calculator - Results (flat - dummy HTML)
router.get('/test_endpoint/:goods_nomenclatures', function (req, res) {
    var url = "https://www.trade-tariff.service.gov.uk/api/v2/goods_nomenclatures/section/1";
    axios.get(url)
        .then((response) => {
            var ret = response.data;
            console.log(ret)
        });
});


// STW integration
router.get('/duty-calculator/landing/:goods_nomenclature_item_id/:destination/:origin/:date', function (req, res) {
    req.cookies["source"] = "stw";
    req.session.data["source"] = "stw";
    req.session.data["back_url"] = req.referer;
    var context = new Context(req);
    var imported_context = new ImportedContext();
    imported_context.goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    imported_context.destination = req.params["destination"].toUpperCase();
    imported_context.origin = req.params["origin"].toUpperCase();
    imported_context.date = req.params["date"];
    imported_context.get_origin_description();
    imported_context.get_destination_description();

    req.session.data["goods_nomenclature_item_id"] = req.params["goods_nomenclature_item_id"];

    global.kill_session_vars(req, [
        'uk_trader_string', 'final_use_string',
        'processing_string', 'certificate_string', 'unit_string'
    ]);

    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            var redirect_url = "/duty-calculator/monetary_value/" + c.goods_nomenclature_item_id;
            res.redirect(redirect_url);
            // res.render('calculate/00_landing', {
            //     'context': context,
            //     'commodity': c,
            //     'imported_context': imported_context
            // });
        });
});



module.exports = router

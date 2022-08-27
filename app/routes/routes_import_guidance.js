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

router.get(['/import-guidance/date/:goods_nomenclature_item_id',], function (req, res) {
    var context = new Context(req);
    var date = global.get_date(req);
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"];
    axios.get(url)
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            // c.get_measure_data(req, "basic");
            res.render('import-guidance/date', {
                'context': context,
                'date': date,
                'commodity': c
            });
        });
});



// import-guidance - Origin
router.get('/import-guidance/origin/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    var countries = global.get_countries(req.session.data["country"]);
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.pass_request(req);
            c.get_data(response.data);
            res.render('import-guidance/origin', {
                'context': context,
                'commodity': c,
                'countries': countries,
                'error': err,
                'origin': origin
            });
        });
});

// import-guidance - Results
router.get('/import-guidance/results/:goods_nomenclature_item_id', function (req, res) {
    var context = new Context(req);
    var c, border_system;
    var err = req.session.data["error"];
    var origin = req.session.data["origin"];
    if (typeof req.session.data["border_system"] === "undefined") {
        req.session.data["border_system"] = "cds";
    }
    var border_system = req.session.data["border_system"].toUpperCase();;
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"])
        .then((response) => {
            c = new Commodity();
            c.border_system = border_system;
            c.pass_request(req);
            c.get_data(response.data);
            // req.session.data["origin"] = "AU";
            c.get_measure_data(req, req.session.data["country"], false, "conditions");
            res.render('import-guidance/results', {
                'context': context,
                'commodity': c,
                'origin': origin
            });
        });
});

// import-guidance - Data handler
router.get(['/import-guidance/data_handler/:goods_nomenclature_item_id', '/import-guidance/data_handler/'], function (req, res) {
    var context = new Context(req);
    var err, referer, c;
    var scope_id = global.get_scope(req.params["scope_id"]);
    var goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    var country = req.session.data["country"];
    var root_url = global.get_root_url(req, scope_id);
    var referer = req.headers.referer;

    if (referer.indexOf("date") !== -1) {
        global.validate_date_import_guidance(req, res);

    } else if (referer.indexOf("origin") !== -1) {
        global.validate_origin_import_guidance(req, res);

    }
});

module.exports = router

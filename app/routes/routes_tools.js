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

// Tools landing page
router.get(['/tools/', '/:scope_id/tools'], function (req, res) {
    var context = new Context(req);
    res.render('tools/tools', {
        'context': context
    });
});

// Quotas search and search results
router.get(['/tools/quota_search/',], function (req, res) {
    var context = new Context(req);
    var order_number = req.query["order_number"];
    var geographical_area_id = req.query["country"];
    var date_day = req.query["date-day"];
    var date_month = req.query["date-month"];
    var date_year = req.query["date-year"];

    var url = "https://www.trade-tariff.service.gov.uk/api/v2/quotas/search?order_number={{ordernumber}}&geographical_area_id={{geographical_area_id}}&as_of={{as_of}}";
    url = url.replace("{{geographical_area_id}}", geographical_area_id);
    url = url.replace("{{ordernumber}}", order_number);
    url = url.replace("{{as_of}}", "2021-05-01");
    url = "https://www.trade-tariff.service.gov.uk/api/v2/quotas/search?geographical_area_id=MA&include=quota_balance_events,measures,measures.geographical_area_id";
    console.log(url);

    axios.get(url)
        .then((response) => {
            // console.log(response.data);
            res.render('tools/quotas', {
                'context': context,
                'results': response.data
            });
        });
});

// SPVs / Unit prices
router.get(['/tools/unit_prices', '/tools/unit_prices/:date'], function (req, res) {
    var context = new Context(req);
    var my_date = req.params["date"]
    var url
    if (typeof my_date !== 'undefined') {
        url = process.env["TRADE_TARIFF_API"] + "spvs/" + my_date;
    } else {
        url = process.env["TRADE_TARIFF_API"] + "spvs"
    }

    axios.get(url)
        .then((response) => {
            res.render('tools/unit_prices', {
                'context': context,
                'spvs': response.data["spvs"],
                'dates': response.data["dates"],
                'period': response.data["period"]
            });
        });
});

// SPVs / Unit prices by commodity
router.get(['/tools/unit_prices_by_code/:code', '/tools/unit_prices_by_code'], function (req, res) {
    var context = new Context(req);
    var code = req.params["code"]
    var url
    if (typeof code !== 'undefined') {
        url = process.env["TRADE_TARIFF_API"] + "spvs_by_code/" + code;
    } else {
        url = "/tools/unit_prices"
        res.redirect(url)
    }

    axios.get(url)
        .then((response) => {
            res.render('tools/unit_prices_by_code', {
                'context': context,
                'spvs': response.data["spvs"],
                'code_data': response.data["code_data"]
            });
        });
});

// SPV actions
router.get(['/tools/spv_actions'], function (req, res) {
    var a = 1
    var my_date = req.session.data["my_date"]
    var url = "/tools/unit_prices/" + my_date + "#rates"
    res.redirect(url)
});

// Licenced quotas
router.get(['/tools/licenced_quotas', '/:scope_id/tools/licenced_quotas'], function (req, res) {
    var context = new Context(req);
    var licenced_quotas = require('../data/licenced_quotas.json')
    res.render('tools/licenced_quotas', {
        'context': context,
        'licenced_quotas': licenced_quotas
    });
});

// FCFS quota browse
router.get(['/tools/quota_detail/:quota_order_number_id'], function (req, res) {
    var context = new Context(req);
    var licenced_quotas = require('../data/licenced_quotas.json')
    res.render('tools/quota_detail', {
        'context': context,
        'licenced_quotas': licenced_quotas
    });
});

// Certificates
router.get(['/tools/certificates/', '/:scope_id/tools/certificates'], function (req, res) {
    var context = new Context(req);
    res.render('tools/certificates', {
        'context': context
    });
});

// Certificates
router.get(['/tools/certificates_results/', '/:scope_id/tools/certificates_results'], function (req, res) {
    var context = new Context(req);
    res.render('tools/certificates_results', {
        'context': context
    });
});

// Additional codes
router.get(['/tools/additional_codes/', '/:scope_id/tools/additional_codes'], function (req, res) {
    var context = new Context(req);
    res.render('tools/additional_codes', {
        'context': context
    });
});

// Footnotes
router.get(['/tools/footnotes/', '/:scope_id/tools/footnotes'], function (req, res) {
    var context = new Context(req);
    res.render('tools/footnotes', {
        'context': context
    });
});

// Chemicals
router.get(['/tools/chemicals/', '/:scope_id/tools/chemicals'], function (req, res) {
    var context = new Context(req);
    res.render('tools/chemicals', {
        'context': context
    });
});

// Exchange rates
router.get(['/tools/exchange_rates/', '/:scope_id/tools/exchange_rates'], function (req, res) {
    var context = new Context(req);
    res.render('tools/exchange_rates', {
        'context': context
    });
});

// Terms and conditions
router.get(['/terms', '/:scope_id/terms'], function (req, res) {
    var context = new Context(req);
    res.render('terms', {
        'context': context
    });
});

// Privacy
router.get(['/privacy', '/:scope_id/privacy'], function (req, res) {
    var context = new Context(req);
    res.render('privacy', {
        'context': context
    });
});

// Accessibility
router.get(['/accessibility', '/:scope_id/accessibility'], function (req, res) {
    var context = new Context(req);
    res.render('accessibility', {
        'context': context
    });
});

// Preferences
router.get(['/tools/preferences', '/:scope_id/tools/preferences'], function (req, res) {
    var context = new Context(req);
    var referer = req.headers.referer ?? "/";
    context.show_notification = (req.query["update"] ?? "no");
    res.render('tools/preferences', {
        'context': context,
        'referer': referer
    });
});


// Preferences handler
router.get(['/preferences-handler/', '/:scope_id/preferences-handler'], function (req, res) {
    var referer = req.session.data["referer"];
    if (referer.includes("commodities")) {
        res.redirect(referer);
    } else {
        res.redirect('tools/preferences?update=yes');
    }
});


// Measure types list
router.get(['/tools/measure_types/',], function (req, res) {
    var context = new Context(req);
    var url = process.env["TRADE_TARIFF_API"] + "measure-types"; 
    console.log(url);

    axios.get(url)
        .then((response) => {
            res.render('tools/measure_types', {
                'context': context,
                'measure_types': response.data
            });
        });
});

 
module.exports = router

const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Heading = require('../classes/heading.js');
const Commodity = require('../classes/commodity.js');
const Roo = require('../classes/roo.js');
const ImportedContext = require('../classes/imported_context.js');
const CPCController = require('../classes/cpc/cpc-controller.js');
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

router.get(['/cpc'], function (req, res) {
    var context = new Context(req);
    res.render('cpc/00-index', {
        'context': context
    });
});

router.get(['/cpc/request-code'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.get_request_codes();
    res.render('cpc/01-request-code', {
        'context': context,
        "controller": cpc_controller
    });
});

router.get(['/cpc/request-code-notes'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.request_code = req.session.data["request_code"]
    cpc_controller.get_request_code_notes();
    res.render('cpc/02-request-code-notes', {
        'context': context,
        "controller": cpc_controller
    });
});

router.get(['/cpc/previous-code'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.request_code = req.session.data["request_code"]
    cpc_controller.get_previous_codes();
    cpc_controller.get_request_code_notes();
    res.render('cpc/03-previous-code', {
        'context': context,
        "controller": cpc_controller
    });
});

router.get(['/cpc/previous-code-notes'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.request_code = req.session.data["request_code"]
    cpc_controller.previous_code = req.session.data["previous_code"]
    cpc_controller.get_previous_code_notes();
    res.render('cpc/04-previous-code-notes', {
        'context': context,
        "controller": cpc_controller
    });
});

router.get(['/cpc/previous-code-apcs'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.request_code = req.session.data["request_code"]
    cpc_controller.previous_code = req.session.data["previous_code"]
    cpc_controller.get_apcs();
    res.render('cpc/05-previous-code-apcs', {
        'context': context,
        "controller": cpc_controller
    });
});

router.get(['/cpc/apc-notes'], function (req, res) {
    var context = new Context(req);
    var cpc_controller = new CPCController();
    cpc_controller.request_code = req.session.data["request_code"]
    cpc_controller.previous_code = req.session.data["previous_code"]
    cpc_controller.apc = req.session.data["apc"]
    cpc_controller.get_additional_code_content();
    res.render('cpc/06-apc-notes', {
        'context': context,
        "controller": cpc_controller
    });
});
// CPC ends here

module.exports = router

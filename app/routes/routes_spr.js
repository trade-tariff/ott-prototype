const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');
const Spr = require('../classes/spr');


// SPR home
router.get(['/spr/'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    res.render('spr/index', {
        'context': context
    });
});

// Enter volumes
router.get(['/spr/task-list'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    res.render('spr/task-list', {
        'context': context
    });
});

// Enter volumes
router.get(['/spr/enter-volumes'], function (req, res) {
    var context = new Context(req);
    var spr = new Spr(req);
    spr.calculate_basket()
    var error = req.query["error"];
    res.render('spr/enter-volumes', {
        'context': context
    });
});

// Add to basket
router.get(['/spr/add-to-basket/'], function (req, res) {
    var context = new Context(req);
    var spr = new Spr(req);
    spr.add_to_basket()
    res.redirect('/spr/enter-volumes#form');
});

// Eligibility
router.get(['/spr/eligibility/'], function (req, res) {
    var context = new Context(req);
    var spr = new Spr(req);
    spr.get_rates()
    res.render('spr/eligibility', {
        'context': context,
        'rates': spr.rates
    });
});

module.exports = router

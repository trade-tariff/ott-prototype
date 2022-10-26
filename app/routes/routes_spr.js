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
router.get([
    '/spr/enter-volumes',
    '/spr/enter-volumes/:index'
], function (req, res) {
    var context = new Context(req);
    var spr = new Spr(req);
    spr.index = -1
    spr.values = []
    if (req.params["index"] != null) {
        spr.index = parseInt(req.params["index"])
        spr.values = req.session.data["basket"][spr.index]
        var a = 1
    }
    spr.calculate_basket()
    var errors = req.query["errors"];
    if (errors) {
        errors = errors.split(",")
    } else {
        errors = []
    }
    res.render('spr/enter-volumes', {
        'context': context,
        'errors': errors,
        'spr': spr
    });
});

// Add to basket
router.get(['/spr/add-to-basket/'], function (req, res) {
    var context = new Context(req);
    var url
    var spr = new Spr(req);
    spr.add_to_basket()
    if (spr.errors.length == 0) {
        res.redirect('/spr/enter-volumes#form');
    } else {
        var index = parseInt(req.session.data["index"])
        if (index == -1) {
            url = '/spr/enter-volumes?errors={errors}#form'.replace("{errors}", spr.errors)
        } else {
            url = '/spr/enter-volumes/{index}?errors={errors}#form'.replace("{errors}", spr.errors).replace("{index}", index)
        }
        res.redirect(url);
    }
});

// Remove from basket
router.get(['/spr/remove/:id'], function (req, res) {
    var a = 1
    var context = new Context(req);
    var spr = new Spr(req);
    var id = req.params['id']
    spr.remove_from_basket(id)
    res.redirect('/spr/enter-volumes#form');
});

// Eligibility
router.get(['/spr/eligibility/'], function (req, res) {
    var context = new Context(req);
    var spr = new Spr(req);
    spr.get_rates()
    res.render('spr/eligibility', {
        'context': context,
        'spr': spr
    });
});

module.exports = router

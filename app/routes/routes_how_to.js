const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');


// Add your routes here - above the module.exports line

router.get('/howto/', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/index', {
        'context': context
    });
});

router.get('/howto/commodity-codes', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/commodity-codes', {
        'context': context
    });
});

router.get('/howto/quotas', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/quotas', {
        'context': context
    });
});

router.get('/howto/valuation', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/valuation', {
        'context': context
    });
});

router.get('/howto/trade-remedies', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/trade-remedies', {
        'context': context
    });
});

router.get('/howto/origin', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('howto/origin', {
        'context': context
    });
});



module.exports = router

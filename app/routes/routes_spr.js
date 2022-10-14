const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');
// const { xor } = require('lodash');


// SPR home
router.get(['/spr/'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    starch_glucose_options = global.get_starch_glucose_options();
    res.render('spr/index', {
        'context': context
    });
});

// Enter volumes
router.get(['/spr/task-list'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    starch_glucose_options = global.get_starch_glucose_options();
    res.render('spr/task-list', {
        'context': context
    });
});

// Enter volumes
router.get(['/spr/enter-volumes'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    starch_glucose_options = global.get_starch_glucose_options();
    res.render('spr/enter-volumes', {
        'context': context
    });
});


module.exports = router

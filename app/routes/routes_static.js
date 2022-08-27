const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');
const { xor } = require('lodash');


// Add your routes here - above the module.exports line



// Mockup of RoO on DC
router.get('/roo_dc', function (req, res) {
    var context = new Context(req);
    res.render('static/test/roo_dc', {
        'context': context
    });
});




module.exports = router

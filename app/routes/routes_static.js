const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');
const { xor } = require('lodash');


// Add your routes here - above the module.exports line

// Start rules of origin-related static pages

router.get('/static/roo/:file', function (req, res) {
    var context = new Context(req);
    context.file = req.params["file"]
    res.render('static/roo/' + context.file, {
        'context': context
    });
});

// router.get('/static/roo/fob', function (req, res) {
//     var context = new Context(req);
//     res.render('static/roo/fob', {
//         'context': context
//     });
// });
// router.get('/static/roo/rvc', function (req, res) {
//     var context = new Context(req);
//     res.render('static/roo/fob', {
//         'context': context
//     });
// });

// End rules of origin-related static pages


// Mockup of RoO on DC
router.get('/roo_dc', function (req, res) {
    var context = new Context(req);
    res.render('static/test/roo_dc', {
        'context': context
    });
});

// Mockup of VAT on DC
router.get('/duty_calculator/vat_expenses', function (req, res) {
    var context = new Context(req);
    res.render('static/dc/vat_expenses', {
        'context': context
    });
});

// Mockup of VAT freight method
router.get('/duty_calculator/vat_freight_method', function (req, res) {
    var context = new Context(req);
    res.render('static/dc/vat_freight_method', {
        'context': context
    });
});

// Mockup of VAT number of consignments
router.get('/duty_calculator/vat_consignments', function (req, res) {
    var context = new Context(req);
    res.render('static/dc/vat_consignments', {
        'context': context
    });
});

// Mockup of VAT on DC - form handler
router.get('/duty_calculator/vat_expense_handler', function (req, res) {
    var context = new Context(req)
    context.get_phase2()
    switch (context.phase) {
        case "vat_method":
            context.vat_get_method()
            if (context.vat_method == "method2") {
                res.redirect("/duty_calculator/vat_freight_method")
            } else {
                res.redirect("/duty_calculator/vat_select")
            }
            break;

        case "freight_method":
            var consignments_needed = ["groupb", "groupc"]
            context.vat_get_freight_method()
            if (consignments_needed.includes(context.freight_method)) {
                res.redirect("/duty_calculator/vat_consignments")
            } else {
                res.redirect("https://www.google.com")
            }
            break;
    }


});




module.exports = router

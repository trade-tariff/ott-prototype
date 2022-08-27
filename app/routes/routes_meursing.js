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

// Meursing start
router.get(['/xi/meursing', '/xi/meursing/start', '/xi/meursing/start/:goods_nomenclature_item_id'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    starch_glucose_options = global.get_starch_glucose_options();
    res.render('meursing/index', {
        'context': context
    });
});

// Starch and glucose content
router.get(['/xi/meursing/starch-glucose'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    starch_glucose_options = global.get_starch_glucose_options();
    res.render('meursing/01_starch_glucose', {
        'context': context,
        "starch_glucose_options": starch_glucose_options,
        "error": error
    });
});

// Sucrose, invert sugar or isoglucose
router.get(['/xi/meursing/sucrose-sugar-isoglucose'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    var starch_option = req.session.data["starch"];
    sucrose_options = global.get_sucrose_options(starch_option);
    res.render('meursing/02_sucrose', {
        'context': context,
        "sucrose_options": sucrose_options,
        "error": error
    });
});

// Milk fat
router.get(['/xi/meursing/milk-fat'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    var starch_option = req.session.data["starch"];
    var sucrose_option = req.session.data["sucrose"];
    milk_fat_options = global.get_milk_fat_options(starch_option, sucrose_option);
    console.log(milk_fat_options);
    res.render('meursing/03_milk_fat', {
        'context': context,
        "milk_fat_options": milk_fat_options,
        "error": error
    });
});

// Milk protein
router.get(['/xi/meursing/milk-protein'], function (req, res) {
    var context = new Context(req);
    var error = req.query["error"];
    var starch_option = req.session.data["starch"];
    var sucrose_option = req.session.data["sucrose"];
    var milk_fat_option = req.session.data["milk_fat"];

    milk_protein_options = global.get_milk_protein_options(starch_option, sucrose_option, milk_fat_option);
    console.log(milk_protein_options);
    res.render('meursing/04_milk_protein', {
        'context': context,
        "milk_protein_options": milk_protein_options,
        "error": error
    });
});

// Data handler
router.get(['/xi/meursing/data'], function (req, res) {
    var context = new Context(req);
    var page = req.query["page"];
    switch (page) {
        case "starch-glucose":
            var starch_option = req.query["starch"];
            if ((starch_option == "") || (starch_option == null)) {
                res.redirect("/xi/meursing/starch-glucose?error=true");
            }
            else {
                res.redirect("/xi/meursing/sucrose-sugar-isoglucose");
            }
            break;
        case "sucrose":
            var sucrose_option = req.query["sucrose"];
            if ((sucrose_option == "") || (sucrose_option == null)) {
                res.redirect("/xi/meursing/sucrose-sugar-isoglucose?error=true");
            }
            else {
                res.redirect("/xi/meursing/milk-fat");
            }

            break;
        case "milk_fat":
            var milk_fat_option = req.query["milk_fat"];
            if ((milk_fat_option == "") || (milk_fat_option == null)) {
                res.redirect("/xi/meursing/milk-fat?error=true");
            }
            else {
                var no_protein = [
                    '40 - 54.99',
                    '55 - 69.99',
                    '70 - 84.99',
                    '85 or more'
                ]
                if (no_protein.includes(milk_fat_option)) {
                    res.redirect("/xi/meursing/check-answers");
                } else {
                    res.redirect("/xi/meursing/milk-protein");
                }
            }

            break;
        case "milk_protein":
            var milk_protein_option = req.query["milk_protein"];
            if ((milk_protein_option == "") || (milk_protein_option == null)) {
                res.redirect("/xi/meursing/milk-protein?error=true");
            }
            else {
                res.redirect("/xi/meursing/check-answers");
            }

            break;
    }

});

// Check answers
router.get(['/xi/meursing/check-answers'], function (req, res) {
    var context = new Context(req);
    res.render('meursing/05_check_answers', {
        'context': context
    });
});

// Results
router.get(['/xi/meursing/results'], function (req, res) {
    var context = new Context(req);
    var starch_option = req.session.data["starch"];
    var sucrose_option = req.session.data["sucrose"];
    var milk_fat_option = req.session.data["milk_fat"];
    var milk_protein_option = req.session.data["milk_protein"];

    results = global.get_result(starch_option, sucrose_option, milk_fat_option, milk_protein_option);
    req.session.data["meursing-code"] = results[0];
    res.render('meursing/06_results', {
        'context': context,
        "results": results
    });
});

// Restart
router.get(['/xi/restart'], function (req, res) {
    req.session.data["starch"] = null;
    req.session.data["sucrose"] = null;
    req.session.data["milk_fat"] = null;
    req.session.data["milk_protein"] = null;
    res.redirect('/xi/meursing/starch-glucose');
});

// Set Meursing code from commodity code page
router.get(['/xi/set-meursing-additional-code'], function (req, res) {
    var url = '/xi/commodities/' + req.session.data["goods_nomenclature_item_id"] + "#meursing";
    res.redirect(url);
});

module.exports = router

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

// Exchange rates
router.get([
    '/tools/exchange_rates/exchange_rates',
    '/tools/exchange_rates/exchange_rates/:year'
], function (req, res) {
    var context = new Context(req);
    var year = req.params["year"]
    if ((year == null) || (year == "")) {
        year = "2023"
    }
    var other_years = ["2023", "2022", "2021", "2020"]
    if (year == "2023") {
        var month_numbers = {
            "June": "06",
            "May": "05",
            "April": "04",
            "March": "03",
            "February": "02",
            "January": "01"
        }
    } else {
        var month_numbers = {
            "December": "12",
            "November": "11",
            "October": "10",
            "September": "09",
            "August": "08",
            "July": "07",
            "June": "06",
            "May": "05",
            "April": "04",
            "March": "03",
            "February": "02",
            "January": "01"
        }
    }
    var other_years = ["2023", "2022", "2021", "2020"]
    res.render('tools/exchange_rates/exchange_rates', {
        'context': context,
        'months': month_numbers,
        'year': year,
        'other_years': other_years,
        "right_column_title": "Data for other years",
        "theme": "monthly"
    });
});

// Exchange rates view online
router.get([
    '/tools/exchange_rates/view/:year/:month'
], function (req, res) {
    var context = new Context(req);
    var year = req.params["year"]
    var year = "2023"
    var month = req.params["month"]
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var month_number = parseInt(month)
    var month_name = months[month_number - 1]
    if (year.length > 2) {
        year = year.slice(2, 4)
    }
    var other_years = ["2023", "2022", "2021", "2020"]
    var rows = []
    var csv_filename = process.cwd() + `/public/exchange_rates/csv/exrates-monthly-${month}${year}.csv`
    // csv_filename = csv_filename.replace("app/", "")
    const fs = require("fs");
    const { parse } = require("csv-parse");
    fs.createReadStream(csv_filename)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            // console.log(row);
            rows.push(row)
        })
        .on("end", function () {
            // console.log("finished");
            res.render('tools/exchange_rates/exchange_rates_view_online', {
                'context': context,
                'rows': rows,
                'year': "20" + year,
                'other_years': other_years,
                "month_name": month_name,
                "month": month,
                "theme": "monthly"
            });
        })
        .on("error", function (error) {
            console.log(error.message);
        });
});

// Spot rates
router.get([
    '/tools/exchange_rates/spot_rates'
], function (req, res) {
    var context = new Context(req);
    var year = "n/a"
    var other_years = ["2023", "2022", "2021", "2020"]
    var spot_years = ["2023", "2022", "2021", "2020"]
    var spot_months = ["December", "March"]
    res.render('tools/exchange_rates/exchange_rate_spot_rates', {
        'context': context,
        'year': year,
        'other_years': other_years,
        'spot_years': spot_years,
        'spot_months': spot_months,
        "right_column_title": "Monthly exchange rates",
        "theme": "spot"
    });
});

// Spot rates view online
router.get([
    '/tools/exchange_rates/spot_rates/view/:year/:month'
], function (req, res) {
    var context = new Context(req);
    var year = req.params["year"]
    // var year = "2023"
    var month = req.params["month"]
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var month_number = parseInt(month)
    var month_name = months[month_number - 1]
    if (year.length > 2) {
        year = year.slice(2, 4)
    }
    var rows = []
    var csv_filename = process.cwd() + `/public/exchange_rates/spot_rates/spot_rates_20${year}-${month}-31.csv`
    // csv_filename = csv_filename.replace("app/", "")
    const fs = require("fs");
    const { parse } = require("csv-parse");
    fs.createReadStream(csv_filename)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            // console.log(row);
            rows.push(row)
        })
        .on("end", function () {
            // console.log("finished");
            res.render('tools/exchange_rates/exchange_rates_spot_rates_view_online', {
                'context': context,
                'rows': rows,
                'year': "20" + year,
                "month_name": month_name,
                "month": month,
                "theme": "spot"
            });
        })
        .on("error", function (error) {
            console.log(error.message);
        });
});


// Average rates
router.get([
    '/tools/exchange_rates/average_rates'
], function (req, res) {
    var context = new Context(req);
    var year = "n/a"
    var other_years = ["2023", "2022", "2021", "2020"]
    var average_years = ["2023", "2022", "2021", "2020"]
    var average_months = ["December", "March"]
    res.render('tools/exchange_rates/exchange_rate_average_rates', {
        'context': context,
        'year': year,
        'other_years': other_years,
        'average_years': average_years,
        'average_months': average_months,
        "right_column_title": "Monthly exchange rates",
        "theme": "average"
    });
});

// Average rates view online
router.get([
    '/tools/exchange_rates/average_rates/view/:year/:month'
], function (req, res) {
    var context = new Context(req);
    var year = req.params["year"]
    // var year = "2023"
    var month = req.params["month"]
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var month_number = parseInt(month)
    var month_name = months[month_number - 1]
    if (year.length > 2) {
        year = year.slice(2, 4)
    }
    var rows = []
    var csv_filename = process.cwd() + `/public/exchange_rates/average_rates/average_rates_20${year}-${month}-31.csv`
    // csv_filename = csv_filename.replace("app/", "")
    const fs = require("fs");
    const { parse } = require("csv-parse");
    fs.createReadStream(csv_filename)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            // console.log(row);
            rows.push(row)
        })
        .on("end", function () {
            // console.log("finished");
            res.render('tools/exchange_rates/exchange_rates_average_rates_view_online', {
                'context': context,
                'rows': rows,
                'year': "20" + year,
                "month_name": month_name,
                "month": month,
                "theme": "average"
            });
        })
        .on("error", function (error) {
            console.log(error.message);
        });
});

module.exports = router

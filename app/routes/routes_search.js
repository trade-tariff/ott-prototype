const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('../API_helper');
const { response } = require('express');
const Context = require('../classes/context');
const Search2023 = require('../classes/search_2023/search_2023');

router.get(['/search2023'], function (req, res) {
    req.cookies["source"] = "ott"
    req.session.data["source"] = "ott"
    var context = new Context(req)
    context.search_term = req.query["q"]

    var url = "https://www.trade-tariff.service.gov.uk/uk/api/beta/search?q=" + context.search_term
    var url_staging = "https://staging.trade-tariff.service.gov.uk/uk/api/beta/search?q=" + context.search_term
    var url_dev = "https://dev.trade-tariff.service.gov.uk/uk/api/beta/search?q=" + context.search_term

    axios.get(url_staging, {
        auth: {
            username: 'tariff',
            password: 'cherrytoms2' // Bad password
        }
    })

    // axios.get(url_dev, {
    //     auth: {
    //         username: 'tariff',
    //         password: 'cherrytoms' // Bad password
    //     }
    // })

    // axios.get(url)
        .then((response) => {
            var search = new Search2023(req, response.data)
            res.render('search_2023/search_2023', {
                'context': context,
                'results': search.commodities
            });
        });
});

module.exports = router

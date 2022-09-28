const express = require('express')
const axios = require('axios')
const router = express.Router()
const api_helper = require('./API_helper');
const { response } = require('express');
const Heading = require('./classes/heading.js');
const Subheading = require('./classes/subheading.js');
const Commodity = require('./classes/commodity.js');
const Roo = require('./classes/roo.js');
const RooMvp = require('./classes/roo_mvp.js');
const ImportedContext = require('./classes/imported_context.js');
const CPCController = require('./classes/cpc/cpc-controller.js');
const Error_handler = require('./classes/error_handler.js');
const date = require('date-and-time');
const GeographicalArea = require('./classes/geographical_area');
const Link = require('./classes/link');
const Context = require('./classes/context');
const Search = require('./classes/search');
const { xor } = require('lodash');
const Story = require('./classes/story');
const SearchExtended = require('./classes/search_extended');
const SearchApi = require('./classes/search_api');
const SectionChapterNotesCollection = require('./classes/section_chapter_notes_collection');
const CommodityHistory = require('./classes/commodity_history');


require('./classes/global.js');
require('./classes/news.js');
require('./classes/validator.js');
require('dotenv').config();

// Add your routes here - above the module.exports line


/* ############################################################################ */
/* ###################                TEMPORARY               ################# */
/* ############################################################################ */

// Chooser page : will never be used
router.get(['/chooser'], function (req, res) {
    req.cookies["source"] = "ott";
    req.session.data["source"] = "ott";
    var my_story = new Story("uk_long.md").html;
    var context = new Context(req);
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('chooser', {
                'context': context,
                'sections': response.data,
                'story': my_story
            });
        });
});

// Browse sections page
router.get(['/sections/', '/:scope_id/sections'], function (req, res) {
    var context = new Context(req);
    req.cookies["source"] = "ott";
    req.session.data["source"] = "ott";
    if (context.scope_id == "xi") {
        res.redirect("/xi/find-commodity")
    } else {
        res.redirect("/find-commodity")
    }
});

// Browse sections page
router.get(['/browse/', '/:scope_id/browse'], function (req, res) {
    req.cookies["source"] = "ott";
    req.session.data["source"] = "ott";
    var my_story = new Story("uk_long.md").html;
    var context = new Context(req);
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('browse', {
                'context': context,
                'sections': response.data,
                'story': my_story
            });
        });
});

// Search page
router.get(['/find-commodity/', '/:scope_id/find-commodity'], function (req, res) {
    req.cookies["source"] = "ott";
    req.session.data["source"] = "ott";
    var my_story = new Story("uk_long.md").html;
    var context = new Context(req);
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('find-commodity', {
                'context': context,
                'sections': response.data,
                'story': my_story
            });
        });
});

// Browse within a section
router.get(['/:scope_id/sections/:sectionId', '/sections/:sectionId'], function (req, res) {
    var context = new Context(req);
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections/' + req.params["sectionId"])
        .then((response) => {
            res.render('section', {
                'context': context,
                'section': response.data
            });
        });
});

// Browse within a chapter
router.get(['/chapters/:chapterId', '/:scope_id/chapters/:chapterId'], function (req, res) {
    var context = new Context(req, "chapters");
    var chapter_id = req.params["chapterId"];
    chapter_id = chapter_id.padStart(2, "0");
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/chapters/' + chapter_id)
        .then((response) => {
            var chapter = response.data;
            context.value_classifier = chapter.data.attributes.goods_nomenclature_item_id.substr(0, 2);
            context.value_description = chapter.data.attributes.formatted_description;
            context.set_description_class()
            res.render('chapters', {
                'context': context,
                'chapter': chapter
            });
        });
});

// Browse within a heading
router.get(['/headings/:headingId', '/:scope_id/headings/:headingId'], async function (req, res) {
    var context = new Context(req, "headings");
    var heading_id = req.params["headingId"];
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/headings/' + heading_id;
    if (context.simulation_date != "") {
        if (url.includes("?")) {
            url += "&";
        } else {
            url += "?";
        }
        url += "as_of=" + context.simulation_date;
    }

    const axiosrequest1 = axios.get(url);
    try {
        await axios.all([axiosrequest1]).then(axios.spread(function (response) {
            h = new Heading(response.data);
            if (h.data.attributes.declarable) {
                var url = "/commodities/" + heading_id + "000000";
                res.redirect(url);
            } else {
                // Get a record count of declarable codes
                h.leaf_count = 0;
                h.included.forEach(item => {
                    if (item.type == "commodity") {
                        if (item.attributes.leaf) {
                            h.leaf_count += 1;
                        }
                    }
                });

                context.value_classifier = h.data.attributes.goods_nomenclature_item_id.substr(0, 4);
                context.value_description = h.data.attributes.formatted_description;
                context.set_description_class()
                res.render('headings', {
                    'context': context,
                    'heading': h
                });
            }
        }));
    }
    catch (error) {
        var url = "/commodity_history/" + heading_id; //.padEnd(10, '0');
        if (context.simulation_date != "") {
            url += "?as_of=" + context.simulation_date
        }
        res.redirect(url);
    }


});


// Browse a subheading (lower than a heading, but not an end-line)
// Example would be 38089490, which has 3808949010 and 3808949090 as end-line child codes

router.get([
    '/subheadings/:goods_nomenclature_item_id-:productline_suffix',
    '/:scope_id/subheadings/:goods_nomenclature_item_id-:productline_suffix'
], function (req, res) {
    var goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    var productline_suffix = req.params["productline_suffix"];
    if (goods_nomenclature_item_id.length == 4) {
        res.redirect("/headings/" + goods_nomenclature_item_id);
    } else {
        var context = new Context(req, "subheading");
        var url = "https://www.trade-tariff.service.gov.uk/api/v2/subheadings/" + goods_nomenclature_item_id + "-" + productline_suffix;
        axios.get(url)
            .then((response) => {
                h = new Heading(response.data, goods_nomenclature_item_id);
                if (h.data.attributes.declarable) {
                    var url = "/commodities/" + heading_id + "000000";
                    res.redirect(url);
                } else {
                    context.value_classifier = goods_nomenclature_item_id.padEnd(10, '0');
                    context.value_description = "Test"; // h.data.attributes.formatted_description;
                    context.set_description_class()
                    res.render('subheading', {
                        'context': context,
                        'heading': h,
                        'goods_nomenclature_item_id': goods_nomenclature_item_id.padEnd(10, '0')
                    });
                }
            });
    }
});


// Browse a single commodity
router.get([
    '/commodities/:goods_nomenclature_item_id/',
    '/commodities/:goods_nomenclature_item_id/:country',
    '/:scope_id/commodities/:goods_nomenclature_item_id',
    '/:scope_id/commodities/:goods_nomenclature_item_id/:country',
], async function (req, res) {
    var context = new Context(req, "commodity");
    var countries = global.get_countries(req.session.data["country"]);
    var date = global.get_date(req);
    context.get_country(req, params_only = true);
    context.get_feature_flags();
    context.goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    req.session.data["scheme_code"] = "";
    context.scheme_code = "";

    // Get any RoO information that we can
    roo_mvp = new RooMvp(req, context);

    if (req.session.data["border_system"] == "chief") {
        border_system = "chief";
        toggle_message = {
            "declaration_th": "Declaration instructions for CHIEF",
            "toggle_text": "Show CDS instructions instead",
            "border_system": "CHIEF",
            "cds_class": "hidden",
            "chief_class": ""
        }
    } else {
        border_system = "cds";
        toggle_message = {
            "declaration_th": "Declaration instructions for CDS",
            "toggle_text": "Show CHIEF instructions instead",
            "border_system": "CDS",
            "cds_class": "",
            "chief_class": "hidden"
        }
    }

    var c;
    req.session.data["goods_nomenclature_item_id"] = req.params["goods_nomenclature_item_id"];
    req.session.data["error"] = "";
    var url_original;
    if (context.country == null) {
        var url = 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"];
    } else {
        var url = 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/' + req.params["goods_nomenclature_item_id"] + "?filter[geographical_area_id]=" + context.country;
    }
    if (context.simulation_date != "") {
        if (url.includes("?")) {
            url += "&";
        } else {
            url += "?";
        }
        url += "as_of=" + context.simulation_date;
    }

    if ((context.scope_id == "ni") || (context.scope_id == "xi")) {
        // Northern Ireland
        url_original = url;
        url = url.replace("/api", "/xi/api");
        const axiosrequest1 = axios.get(url);
        const axiosrequest2 = axios.get(url_original);
        await axios.all([axiosrequest1, axiosrequest2]).then(axios.spread(function (res1, res2) {
            // Get the EU measures
            c = new Commodity();
            c.country = context.country;
            c.pass_request(req);
            c.get_data(res1.data);
            c.get_measure_data(req, "basic");

            context.value_classifier = c.data.attributes.goods_nomenclature_item_id;
            context.value_description = c.commodity_description_trail;
            context.set_description_class()

            // Append the UK measures
            c_uk = new Commodity();
            c_uk.country = context.country;
            c_uk.pass_request(req);
            c_uk.get_data(res2.data);
            c_uk.get_measure_data(req, "basic", override_block = true);

            c_uk.measures.forEach(m => {
                if (m.block == "other_uk") {
                    c.measures.push(m);
                }
            });

            c.categorise_measures(override_block = "smart");
            c.sort_measures();

            context.permit_uk_roo = 0;
            context.permit_xi_roo = 0;
            if ((c_uk.preferential_tariff_duty != null) || (c_uk.preferential_tariff_duty != null)) {
                context.permit_uk_roo = 1;
            }
            if ((c.preferential_tariff_duty != null) || (c.preferential_tariff_duty != null)) {
                context.permit_xi_roo = 1;
            }

            res.render('commodities', {
                'context': context,
                'roo': roo_mvp,
                'date': date,
                'countries': countries,
                'toggle_message': toggle_message,
                'commodity': c,
                'commodity_uk': c_uk
            });
        }));

    } else {
        // UK
        const axiosrequest1 = axios.get(url);
        // try {
        await axios.all([axiosrequest1]).then(axios.spread(function (response) {
            c = new Commodity();
            c.country = context.country;
            c.pass_request(req);
            c.get_data(response.data);
            c.get_measure_data(req, "basic");

            context.value_classifier = c.data.attributes.goods_nomenclature_item_id;
            context.value_description = c.description;
            context.set_description_class()

            c.sort_measures();

            context.show_chief = true;
            context.show_cds = true;
            context.add_to_commodity_history(c.goods_nomenclature_item_id, c.description, req, res);

            res.render('commodities', {
                'context': context,
                'date': date,
                'countries': countries,
                'roo': roo_mvp,
                'toggle_message': toggle_message,
                'commodity': c
            });
        }));
        // }
        // catch (error) {
        //     var url = "/commodity_history/" + req.params["goods_nomenclature_item_id"];
        //     if (context.simulation_date != "") {
        //         url += "?as_of=" + context.simulation_date
        //     }
        //     res.redirect(url);
        // }
    }
});

// Reset country
router.get(['/country_reset/:goods_nomenclature_item_id/'], function (req, res) {
    req.session.data["country"] = "";
    res.redirect("/commodities/" + req.params["goods_nomenclature_item_id"]);
});

// Get a geographical area
router.get(['/geographical_area/:id/', '/:scope_id/geographical_area/:id/',], function (req, res) {
    var id = req.params["id"];
    var context = new Context(req);
    var referer = req.headers.referer;
    if (referer == null) {
        referer = "/";
    }
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/geographical_areas/';
    if ((context.scope_id == "ni") || (context.scope_id == "xi")) {
        url = url.replace("/api", "/xi/api");
    }
    axios.get(url)
        .then((response) => {
            g = global.get_geography(id, response.data);
            res.render('geographical_area', {
                'context': context,
                'referer': referer,
                'geographical_area': g
            });
        });
});



// Get a quota
router.get(['/quotas/:quota_order_number_id/', '/:scope_id/quotas/:quota_order_number_id/',], function (req, res) {
    var context = new Context(req);
    context.quota_order_number_id = req.params["quota_order_number_id"];
    var referer = req.headers.referer;
    if (referer == null) {
        referer = "/";
    }
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/quotas/search?order_number={quota_order_number_id}&include=quota_balance_events';
    url = url.replace("{quota_order_number_id", context.quota_order_number_id);
    if ((context.scope_id == "ni") || (context.scope_id == "xi")) {
        url = url.replace("/api", "/xi/api");
    }
    axios.get(url)
        .then((response) => {
            // g = global.get_geography(id, response.data);
            res.render('quota', {
                'context': context,
                'referer': referer
            });
        });
});



// Get a measure types
router.get(['/measure_type/:measure_type_id/:preference_code', '/:scope_id/measure_type/:measure_type_id/:preference_code',], function (req, res) {
    var measure_type_id = req.params["measure_type_id"];
    var preference_code = req.params["preference_code"];
    var context = new Context(req);
    var referer = req.headers.referer;
    if (referer == null) {
        referer = "/";
    }
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/measure_types/';
    if ((context.scope_id == "ni") || (context.scope_id == "xi")) {
        url = url.replace("/api", "/xi/api");
    }
    axios.get(url)
        .then((response) => {
            mt = global.get_measure_type(context.scope_id, measure_type_id, preference_code, response.data);
            res.render('measure_type', {
                'context': context,
                'referer': referer,
                'measure_type': mt
            });
        });
});


// Test all 5a content
router.get(['/test_5a',], function (req, res) {
    var context = new Context(req);
    context.test_5a();
    var referer = req.headers.referer;
    if (referer == null) {
        referer = "/";
    }
    res.render('test_5a', {
        'context': context,
        'referer': referer
    });
});

/* ############################################################################ */
/* ###################                END BROWSE              ################# */
/* ############################################################################ */


/* ############################################################################ */
/* ###################              BEGIN SEARCH              ################# */
/* ############################################################################ */

// Search page
router.get(['/search/:scope_id', '/search/', '/search//'], function (req, res) {
    var context = new Context(req);
    axios.get('https://www.trade-tariff.service.gov.uk/api/v2/sections')
        .then((response) => {
            res.render('search', {
                'context': context,
                'sections': response.data
            });
        });
});



// Search results / data handler
router.post(['/search/data_handler/', '/:scope_id/search/data_handler/:goods_nomenclature_item_id'], function (req, res) {
    var search_term = req.session.data["search"].trim().replace(" ", "");
    if (search_term.length == 10) {
        res.redirect("/commodities/" + search_term);
    } else {
        res.redirect("/search/");
    }
});
/* ############################################################################ */
/* ###################               END SEARCH               ################# */
/* ############################################################################ */


/* ############################################################################ */
/* ###################       BEGIN SUBSIDIARY NAVIGATION      ################# */
/* ############################################################################ */

// A-Z index
router.get(['/a-z-index/:letter', '/:scope_id/a-z-index/:letter'], function (req, res) {
    var context = new Context(req);
    var url = 'https://www.trade-tariff.service.gov.uk/api/v2/search_references.json?query[letter]=' + req.params["letter"];
    axios.get(url)
        .then((response) => {
            res.render('a-z-index', {
                'context': context,
                'headings': response.data,
                'letter': req.params["letter"]
            });
        });
});

// Downloads
router.get(['/downloads/', '/:scope_id/downloads'], function (req, res) {
    var context = new Context(req);
    res.render('downloads', {
        'context': context
    });
});

// News
router.get(['/news/', '/:scope_id/news'], function (req, res) {
    var context = new Context(req);
    news = global.get_news();
    res.render('news', {
        'context': context,
        'news': news
    });
});

// Stop press
router.get(['/stop-press/', '/:scope_id/stop-press'], function (req, res) {
    var context = new Context(req);
    news = global.get_news();
    res.render('stop_press', {
        'context': context,
        'news': news
    });
});

// Stop press - future
router.get(['/stop-press-future/', '/:scope_id/stop-press'], function (req, res) {
    var context = new Context(req);
    news = global.get_news();
    res.render('stop_press_future', {
        'context': context,
        'news': news
    });
});

// Preferences
router.get([
    '/preferences/',
    ':scope_id/preferences/',
    '/preferences/:confirm',
    ':scope_id/preferences/:confirm'
], function (req, res) {
    var context = new Context(req);
    var show_confirmation = req.params["confirm"];
    res.render('preferences', {
        'context': context,
        'show_confirmation': show_confirmation,
        'scope_id': scope_id,
        'root_url': root_url,
        'title': title
    });
});


/* ############################################################################ */
/* ###################        END SUBSIDIARY NAVIGATION       ################# */
/* ############################################################################ */


// Help
router.get(['/help/undefined'], function (req, res) {
    res.redirect('/help');
});

router.get(['/help'], function (req, res) {
    const now = new Date();
    var show_webchat = false; // isWorkingHour(now);
    var context = new Context(req);
    var key = "";
    var roo = new RooMvp(req, key, context.scope_id);
    roo.get_all_abbreviations();

    res.render('help/index', {
        'context': context,
        "show_webchat": show_webchat,
        'roo': roo
    });

    function isWorkingHour(now) {
        return now.getDay() <= 4 && now.getHours() >= 9 && now.getHours() < 17;
    }
});

router.get(['/help/cn2021-cn2022'], function (req, res) {
    //const now = new Date('2021/05/06 14:14:05');
    var context = new Context(req);
    res.render('help/cn2021-cn2022', {
        'context': context
    });
});


router.get(['/help/how-to-use'], function (req, res) {
    var context = new Context(req);
    res.render('help/how-to-use', {
        'context': context
    });
});

/* HELP Start new sections */

router.get(['/help/commodities'], function (req, res) {
    var context = new Context(req);
    res.render('help/commodities', {
        'context': context
    });
});

router.get(['/help/quotas'], function (req, res) {
    var context = new Context(req);
    res.render('help/quotas', {
        'context': context
    });
});

router.get(['/help/validation'], function (req, res) {
    var context = new Context(req);
    res.render('help/validation', {
        'context': context
    });
});

router.get(['/help/remedies'], function (req, res) {
    var context = new Context(req);
    res.render('help/remedies', {
        'context': context
    });
});

router.get(['/help/valuation'], function (req, res) {
    var context = new Context(req);
    res.render('help/valuation', {
        'context': context
    });
});

router.get(['/help/origin'], function (req, res) {
    var context = new Context(req);
    res.render('help/origin', {
        'context': context
    });
});

router.get(['/help/reduce'], function (req, res) {
    var context = new Context(req);
    res.render('help/reduce', {
        'context': context
    });
});

/* HELP End new sections */

router.get(['/help/help-find-commodity'], function (req, res) {
    var context = new Context(req);
    res.render('help/help-find-commodity', {
        'context': context
    });
});
router.get(['/help/feedback'], function (req, res) {
    var context = new Context(req);
    res.render('help/feedback', {
        'context': context
    });
});


// Search
router.get(['/search_handler'], function (req, res) {
    var url = "";
    var search_term = req.query["search_term"];
    res.redirect("/results/" + search_term);
});

// Search results
router.get(['/results/:search_term'], async function (req, res) {
    var context = new Context(req);
    var search_term = req.params["search_term"];

    // Make first request
    var axios_response;
    var call_type = "search";
    var url = "https://www.trade-tariff.service.gov.uk/search.json?q=" + search_term + "&input-autocomplete=" + search_term;
    [axios_response] = await Promise.all([
        axios.get(url)
    ]);

    // Then if necessary the second, which is just a heading
    var results = axios_response.data.results;
    if (results.length == 1) {
        if (results[0].type == "heading") {
            call_type = "heading";
            var key = results[0].goods_nomenclature_item_id.substring(0, 4);
            var url = "/headings/" + key;
            res.redirect(url);
            return;
        } else if (results[0].type == "chapter") {
            call_type = "chapter";
            var url = "/chapters/" + results[0].goods_nomenclature_item_id.substring(0, 2) + "/" + term;
            res.redirect(url);
            return;
        }
    }

    var search = new Search(axios_response.data, call_type);
    var search_context = {}
    search_context.call_type = call_type;
    search_context.links = search.links;
    search_context.search = search;
    search_context.heading_count = search.heading_count;
    search_context.commodity_count = search.commodity_count;
    res.render('search-results', {
        'context': context,
        'search_context': search_context,
        'term': search_term
    });


});

// Change the date
router.get(['/change-date'], function (req, res) {
    var date = global.get_date(req, save = true);
    let goods_nomenclature_item_id = req.query["goods_nomenclature_item_id"];
    var url = "/commodities/${goods_nomenclature_item_id}?day=${day}&month=${month}&year=${year}";
    url = url.replace("${goods_nomenclature_item_id}", goods_nomenclature_item_id);
    url = url.replace("${day}", date.day);
    url = url.replace("${month}", date.month);
    url = url.replace("${year}", date.year);
    res.redirect(url);
});

/* ############################################################################ */
/* ###################               FURNITURE                ################# */
/* ############################################################################ */

// Cookies page
router.get(['/:scope_id/cookies', '/cookies/'], function (req, res) {
    var context = new Context(req);
    res.render('cookies', {
        'context': context
    });
});


/* ############################################################################ */
/* ###################          NEW ACCESSIBLE PICKERS        ################# */
/* ############################################################################ */

router.get(['/:scope_id/date', '/date/'], function (req, res) {
    var context = new Context(req);
    res.render('date', {
        'context': context
    });
});
router.get(['/:scope_id/country/:goods_nomenclature_item_id', '/country/:goods_nomenclature_item_id'], function (req, res) {
    var context = new Context(req);
    context.goods_nomenclature_item_id = req.params["goods_nomenclature_item_id"];
    context.get_countries();
    res.render('set-country-filter', {
        'context': context,
    });
});

// Set the country filter for comm codes
router.get(['/country-filter'], async function (req, res) {
    var goods_nomenclature_item_id = req.session.data["goods_nomenclature_item_id"];
    var country = req.query["country"];
    var tab = req.cookies["tab"];
    var context = new Context(req);

    var url = "/commodities/" + goods_nomenclature_item_id + "/" + country;
    if ((context.scope_id == "ni") || (context.scope_id == "xi")) {
        url = url.replace("/commodities/", "xi/commodities/");
    }
    if (typeof tab === 'undefined') {
        tab = ""
    } else {
        url += "#" + tab;
    }
    res.redirect(url);
});

/* ############################################################################ */
/* ###################               START SEARCH             ################# */
/* ############################################################################ */


// Elastic search (using querystring) - this is just a dummy redirect
router.get(['/elastic/'], function (req, res) {
    var search_term = req.query["search_term"];
    var url = "/elastic/" + search_term;
    res.redirect(url);
});

// Elastic search (using querystring) - this is just a dummy redirect
router.get(['/elasticq/'], function (req, res) {
    var search_term = req.query["search_term"];
    var url = "/elasticq/" + search_term;
    res.redirect(url);
});

// Elastic search
router.get(['/elastic/:search_term'], function (req, res) {
    // OLD ignore
    var context = new Context(req);
    context.search_term = req.params["search_term"];
    context.add_to_search_history(req, res);
    context.show_questions = false
    var generic_terms = [
        "gift",
        "gifts"
    ]

    if (generic_terms.includes(context.search_term)) {
        var url = "/elastic-generic/" + context.search_term;
        res.redirect(url);
    } else {
        context.get_sort_order();
        context.search_term = req.params["search_term"];
        if (context.search_term != "") {
            // var search = new SearchExtended(context, req, res)
            var search = new SearchApi(context, req, res)
        }
    }
});

// Elastic questions
router.get(['/elasticq/:search_term'], function (req, res) {
    var context = new Context(req);
    context.search_term = req.params["search_term"];
    context.add_to_search_history(req, res);
    var generic_terms = [
        "gift",
        "gifts"
    ]

    if (generic_terms.includes(context.search_term)) {
        var url = "/elastic-generic/" + context.search_term;
        res.redirect(url);
    } else {
        context.get_sort_order();
        context.show_questions = true
        context.search_term = req.params["search_term"];
        if (context.search_term != "") {
            var search = new SearchApi(context, req, res)
        }
    }
});

// Elastic history
router.get(['/elastic_history'], function (req, res) {
    var context = new Context(req);
    context.get_history(req);
    res.render('search/elastic_history', {
        'context': context
    });
});



// Delete search history
router.get(['/search_history/:search_term/delete'], function (req, res) {
    var context = new Context(req);
    context.search_term = req.params["search_term"];
    context.delete_search_history(req, res);
    res.redirect('/elastic_history');
});


// Delete commodity code history
router.get(['/commodity_history/:id/delete'], function (req, res) {
    var context = new Context(req);
    var id = req.params["id"];
    context.delete_commodity_history(req, res, id);
    res.redirect('/elastic_history');
});

// Elastic search
router.get(['/elastic-generic/:search_term'], function (req, res) {
    var context = new Context(req);
    context.search_term = req.params["search_term"];
    res.render('elastic_generic', {
        'context': context
    });
});

// Filter
router.get(['/filter_info/:info'], function (req, res) {
    var context = new Context(req);
    context.info_file = req.params["info"];
    res.render('search/filter_info', {
        'context': context
    });
});

/* ############################################################################ */
/* ###################               END SEARCH               ################# */
/* ############################################################################ */

// Used for testing section and chapter notes
router.get(['/notes'], function (req, res) {
    var context = new Context(req);
    var section_chapter_notes_collection = new SectionChapterNotesCollection()
    res.render('section_chapter_notes', {
        'context': context,
        'section_chapter_notes_collection': section_chapter_notes_collection
    });
});


// Comm code history
router.get(['/commodity_history/:commodity_code'], function (req, res) {
    var a = process.env.USER_ID;
    var context = new Context(req);
    var commodity_code = req.params["commodity_code"];
    if (commodity_code.length == 4) {
        context.resource_type = "heading";
    } else {
        context.resource_type = "commodity";
    }
    commodity_code = req.params["commodity_code"].padEnd(10, '0');
    var commodity_history = new CommodityHistory(context, req, res, commodity_code)
});

// Comm code history
router.get(['/set-language/:language'], function (req, res) {
    var language = req.params["language"];
    res.cookie('language', language, { maxAge: 1000 * 3600 * 24 * 30, httpOnly: false });
    var url = req.headers.referer;
    res.redirect(url);
});


// reference builder
router.get(['/refs'], function (req, res) {
    var context = new Context(req);
    res.render('refs', {
        'context': context
    });
});

// reference builder
router.get(['/refs2'], function (req, res) {
    var url;
    var root = "https://tariff-admin-production.london.cloudapps.digital/search_references/";
    var root_web = "https://www.trade-tariff.service.gov.uk/";
    var goods_nomenclature_item_id = req.session.data["goods_nomenclature_item_id"].trim();
    var productline_suffix = req.session.data["productline_suffix"].trim();
    if (productline_suffix == "") {
        productline_suffix = "80";
    }
    var resource = req.session.data["resource"].trim();
    if (resource == "admin") {
        if (goods_nomenclature_item_id.length == 4) {
            url = root + "headings/" + goods_nomenclature_item_id.substr(0, 4) + "/search_references";
        } else {
            goods_nomenclature_item_id = goods_nomenclature_item_id.padEnd(10, '0');
            url = root + "commodities/" + goods_nomenclature_item_id + "-" + productline_suffix + "/search_references";
        }
    } else {
        if (goods_nomenclature_item_id.length == 4) {
            url = root_web + "headings/" + goods_nomenclature_item_id;
        } else {
            goods_nomenclature_item_id = goods_nomenclature_item_id.padEnd(10, '0');
            url = root_web + "subheadings/" + goods_nomenclature_item_id + "-" + productline_suffix;
        }
    }

    var context = new Context(req);
    res.redirect(url);
});

// Mockups
router.get(['/mockup/:include_file'], function (req, res) {
    var context = new Context(req);
    context.include_file = req.params["include_file"];
    res.render('mockup', {
        'context': context
    });
});

// News - strategic
router.get([
    '/bulletin',
    '/bulletin/year/:year',
    '/bulletin/theme/:theme',
    '/bulletin/year/:year/theme/:theme',
    '/bulletin/theme/:theme/year/:year',
    '/xi/bulletin'
], async function (req, res) {
    var context = new Context(req);
    theme = (typeof req.params["theme"] !== "undefined") ? req.params["theme"] : 'All themes'
    year = (typeof req.params["year"] !== "undefined") ? req.params["year"] : 'All years'
    context.page = (typeof req.query["page"] !== "undefined") ? parseInt(req.query["page"]) : 0

    context.theme = theme
    context.year = year

    if (theme == "All themes") {
        theme = ""
    }
    if (year == "All years") {
        year = ""
    }

    // var url = "http://127.0.0.1:5000/news/"
    var url = process.env["TRADE_TARIFF_API"] + "news/";
    var base_url = "/bulletin/"
    context.base_url_year = base_url
    context.base_url_theme = base_url

    
    if (theme != "") {
        url += "theme/" + theme + "/"
        context.base_url_year += "theme/" + theme + "/"
    }
    if (year != "") {
        url += "year/" + year
        context.base_url_theme += "year/" + year + "/"
    }

    url += "?page=" + context.page
    var page_size = 10
    var tmp = req.url.split("?")
    context.base_url = tmp[0]
    // console.log("The API URL is: " + url);

    axios.get(url)
        .then((response) => {
            context.page_count = Math.ceil(response.data["story_count"] / page_size)
            // console.log(response.data["story_count"])
            res.render('news_strategic', {
                'context': context,
                'news_stories': response.data["stories"],
                'years': response.data["years"],
                'story_themes': response.data["themes"],
                'story_count': response.data["story_count"]
            });
        });

});

// News - strategic
router.get(['/bulletin/story/:id', '/xi/bulletin/story/:id'], async function (req, res) {
    var context = new Context(req);
    id = req.params["id"]
    var url = process.env["TRADE_TARIFF_API"] + "news/story/";
    // var url = "http://127.0.0.1:5000/news/story/" + id
    axios.get(url)
        .then((response) => {
            res.render('news_strategic_story', {
                'context': context,
                'news_story': response.data["story"],
                'years': response.data["years"],
                'themes': response.data["themes"]
            });
        });

});

module.exports = router
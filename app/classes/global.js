const e = require('express')
var numeral = require('numeral')
var MarkdownIt = require('markdown-it')
var path = require('path')
const fs = require('fs')

global.get_date = function (req, save = false) {
  const { DateTime } = require('luxon')
  var date = {}

  // Get querystring variables
  var day = req.query['day']
  var month = req.query['month']
  var year = req.query['year']

  // Get querystring variables
  var day2 = req.session.data['day']
  var month2 = req.session.data['month']
  var year2 = req.session.data['year']

  if (
    typeof day !== 'undefined' &&
    typeof month !== 'undefined' &&
    typeof year !== 'undefined'
  ) {
    date.day = day
    date.month = month
    date.year = year
  } else if (
    typeof day2 !== 'undefined' &&
    typeof month2 !== 'undefined' &&
    typeof year2 !== 'undefined'
  ) {
    date.day = day2
    date.month = month2
    date.year = year2
  } else {
    var now = DateTime.now()
    date.day = now.day
    date.month = now.month
    date.year = now.year
  }

  DateTime.now()
    .setLocale('en')
    .toLocaleString(DateTime.DATE_FULL)

  // date.date = DateTime.fromObject({ day: date.day, month: date.month, year: date.year, locale: "en-gb" })
  // var newFormat = Object.assign(DateTime.DATE_FULL, { weekday: 'long' });
  // date.date_string = date.date.toLocaleString(newFormat);
  date.date_string = '1 January 2021'
  var a = 1

  if (save) {
    req.session.data['day'] = date.day
    req.session.data['month'] = date.month
    req.session.data['year'] = date.year
  }

  return date
}

global.format_and_trim_commodity_code = function (str, end_line = false) {
  var s = ''
  // end_line = true;
  if (typeof str !== 'undefined') {
    if (end_line) {
      s += '<span>' + str.substr(0, 4) + '</span>'
      s += '<span>' + str.substr(4, 4) + '</span>'
      s += '<span>' + str.substr(8, 2) + '</span>'
    } else if (str.length == 2) {
      s += '<span>' + str.substr(0, 2) + '</span>'
    } else if (str.length == 4) {
      s += '<span>' + str.substr(0, 4) + '</span>'
    } else {
      s += '<span>' + str.substr(0, 4) + '</span>'
      // 6-digit codes
      if (str.substr(6, 4) == '0000') {
        s += '<span>' + str.substr(4, 2) + '</span>'
      }
      // 8-digit codes
      else if (str.substr(8, 2) == '00') {
        s += '<span>' + str.substr(4, 4) + '</span>'
      }
      // 10-digit codes
      else {
        s += '<span>' + str.substr(4, 4) + '</span>'
        s += '<span>' + str.substr(8, 2) + '</span>'
      }
    }
    // s+= String(str.length);

    return s
  } else {
    return ''
  }
}

global.decimals = function (str, cnt) {
  var i = parseFloat(str)
  var n = i.toFixed(cnt).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  return n
}

global.format_number = function (s, dec_places = 0) {
  var fmt = '0,0'
  if (dec_places != 0) {
    fmt += '.' + '0'.repeat(dec_places)
  }
  var s2 = numeral(s).format(fmt)
  return s2
}

global.format_commodity_code = function (str, separator = ' ') {
  if (typeof str !== 'undefined') {
    s = str.substr(0, 4) + separator
    s += str.substr(4, 2) + separator
    s += str.substr(6, 2) + separator
    s += str.substr(8, 2)
    return s
  } else {
    return ''
  }
}

global.format_date = function (s, fmt) {
  if (s == null) {
    return ''
  } else {
    // s = s.toString();
    // s = s.replace('T00:00:00.000Z', "");
    var moment = require('moment')
    var formattedDate = moment(s).format(fmt)
    return formattedDate
  }
}

global.todays_date = function (s, fmt) {
  var d = new Date()
  var s = format_date(d, 'D MMMM YYYY')
  return s
}

global.kill_session_vars = function (req, vars) {
  var i
  for (i = 0; i < vars.length; i++) {
    delete req.session.data[vars[i]]
  }
  var a = 1
}

global.set_tariff = function (req) {
  var destination = req.session.data['destination']
  var ireland_option = req.session.data['ireland_option']
  if (destination == 'Northern Ireland' && ireland_option == 'yes') {
    req.session.data['tariff'] = 'xi/'
  } else {
    req.session.data['tariff'] = ''
  }
  //console.log(req.session.data["tariff"]);
}

global.get_domain = function (req) {
  //console.log("Getting domain");
  var tariff = req.session.data['tariff']
  if (typeof tariff === 'undefined') {
    tariff = ''
  }
  var at_risk = req.session.data['at_risk']
  if (typeof at_risk !== 'undefined') {
    if (at_risk == false) {
      tariff = ''
    } else {
      tariff = 'xi/'
    }
  }
  var domain =
    'https://www.trade-tariff.service.gov.uk/' + tariff + 'api/v2/commodities/'

  return domain
}

global.get_commodity_api = function (req) {
  var url = global.get_domain(req)
  url += req.params['goods_nomenclature_item_id']
  var geo = req.session.data['origin']
  if (geo != '') {
    url += '?filter[geographical_area_id]=' + geo
  }
  return url
}

global.get_root_url = function (req, scope_id) {
  var root_url = req.url
  root_url = root_url.replace('/ni', '/{{ scope_id }}')
  root_url = root_url.replace('/gb', '/{{ scope_id }}')
  return root_url
}

global.check_heading_commodity = function (goods_nomenclature_item_id) {
  var last_six = goods_nomenclature_item_id.substring(
    goods_nomenclature_item_id.length - 6,
    goods_nomenclature_item_id.length
  )
  var url
  if (last_six == '000000') {
    url = 'headings/' + goods_nomenclature_item_id.substring(0, 4)
  } else {
    url = 'commodities/' + goods_nomenclature_item_id
  }
  return url
}

global.get_starch_glucose_options = function () {
  var meursing_codes = require('../data/meursing_codes.json')
  var starch_glucose_options = []

  for (key in meursing_codes) {
    var value = meursing_codes[key].starch
    if (!starch_glucose_options.includes(value)) {
      starch_glucose_options.push(value)
    }
    var a = 1
  }
  // starch_glucose_options.sort();
  return starch_glucose_options
}

global.get_sucrose_options = function (starch_option) {
  var meursing_codes = require('../data/meursing_codes.json')
  var sucrose_options = []

  for (key in meursing_codes) {
    var starch_value = meursing_codes[key].starch
    if (starch_value == starch_option) {
      var sucrose_value = meursing_codes[key].sucrose
      if (!sucrose_options.includes(sucrose_value)) {
        sucrose_options.push(sucrose_value)
      }
    }
  }
  // sucrose_options.sort();
  return sucrose_options
}

global.get_milk_fat_options = function (starch_option, sucrose_option) {
  var meursing_codes = require('../data/meursing_codes.json')

  var milk_fat_options = []

  for (key in meursing_codes) {
    var starch_value = meursing_codes[key].starch
    var sucrose_value = meursing_codes[key].sucrose
    if (starch_value == starch_option) {
      if (sucrose_value == sucrose_option) {
        var milk_fat_value = meursing_codes[key].milk_fat
        if (!milk_fat_options.includes(milk_fat_value)) {
          milk_fat_options.push(milk_fat_value)
        }
      }
    }
  }
  // milk_fat_options.sort();
  return milk_fat_options
}

global.get_milk_protein_options = function (
  starch_option,
  sucrose_option,
  milk_fat_option
) {
  var meursing_codes = require('../data/meursing_codes.json')
  var milk_protein_options = []

  for (key in meursing_codes) {
    var starch_value = meursing_codes[key].starch
    var sucrose_value = meursing_codes[key].sucrose
    var milk_fat_value = meursing_codes[key].milk_fat
    if (starch_value == starch_option) {
      if (sucrose_value == sucrose_option) {
        if (milk_fat_value == milk_fat_option) {
          var milk_protein_value = meursing_codes[key].milk_protein
          if (!milk_protein_options.includes(milk_protein_value)) {
            milk_protein_options.push(milk_protein_value)
          }
        }
      }
    }
  }
  // milk_protein_options.sort();
  return milk_protein_options
}

global.get_result = function (
  starch_option,
  sucrose_option,
  milk_fat_option,
  milk_protein_option
) {
  var meursing_codes = require('../data/meursing_codes.json')
  var results = []

  for (key in meursing_codes) {
    var starch_value = meursing_codes[key].starch
    var sucrose_value = meursing_codes[key].sucrose
    var milk_fat_value = meursing_codes[key].milk_fat
    var milk_protein_value = meursing_codes[key].milk_protein

    if (starch_value == starch_option) {
      if (sucrose_value == sucrose_option) {
        if (milk_fat_value == milk_fat_option) {
          if (milk_protein_value == milk_protein_option) {
            var result = key.replace('key_', '')
            if (!results.includes(result)) {
              results.push(result)
            }
          }
        }
      }
    }
  }
  return results
}

/* VALIDATIONS START HERE */
// Validate starch
global.validate_starch = function (req, res) {
  return true
}

global.get_rules_of_origin = function (req, res) {
  var data = require('../data/roo/uk/roo_schemes_uk.json')
  var geo_data = require('../assets/data/geographical_areas.json')
  var schemes = data.schemes
  schemes.forEach(scheme => {
    scheme.country_descriptions = get_geographies(scheme.countries, geo_data)
  })
  return schemes

  function get_geographies (countries, geo_data) {
    var conjunction
    var jp = require('jsonpath')
    const _ = require('lodash')
    var ret = ''

    if (countries.length == 2) {
      conjunction = ' and '
    } else if (countries.length == 1) {
      conjunction = ''
    } else {
      conjunction = ', '
    }

    countries.sort()
    countries.forEach((country, index, array) => {
      var query_string = '$.data[?(@.id == "' + country + '")]'
      var result = jp.query(geo_data, query_string)
      if (result.length > 0) {
        var description = result[0].attributes.description
        ret += description
        if (index !== array.length - 1) {
          ret += conjunction
        }
      }
    })

    //ret = ret.trim();
    ret = _.trim(ret, ', ')
    return ret
  }
}

global.get_geography = function (id, res) {
  var a = 1
  var ret = {}
  var data = res['data']
  var included = res['included']
  var geographical_areas = []

  var countries = {}
  included.forEach(country => {
    countries[country.id] = country.attributes.description
    var a = 1
  })

  data.forEach(g => {
    var a = 1
    if (g.id == id) {
      var a = 1
      ret.id = id
      if (ret.id == '1011') {
        ret.description = 'All countries'
      } else {
        ret.description = g.attributes.description
      }
      ret.members = g.relationships.children_geographical_areas.data
      ret.members.forEach(m => {
        m.description = countries[m.id]
      })
      var a = 1
    }
  })
  return ret
}

global.get_measure_type = function (
  scope_id,
  measure_type_id,
  preference_code,
  res
) {
  var jp = require('jsonpath')
  var ret = {
    id: measure_type_id,
    description: '',
    measure_type_series_id: '',
    measure_component_applicable_code: '',
    order_number_capture_code: '',
    trade_movement_code: '',
    trade_direction: '',
    measure_type_series_description: '',
    preference_code: preference_code,
    preference_code_description: '',
    hint: ''
  }

  // Get measure type hint from the markdown files
  var md_path = path.join(__dirname, '..')
  md_path = path.join(__dirname, '..')
  md_path = path.join(md_path, 'content')
  md_path = path.join(md_path, 'measure_types')
  md_path = path.join(md_path, scope_id)
  md_path = path.join(md_path, measure_type_id + '.md')

  try {
    var raw_markdown = fs.readFileSync(md_path, 'utf8')
    var md = new MarkdownIt()
    ret.hint = md.render(raw_markdown)
    ret.hint = ret.hint.replace(
      '<ul>',
      "<ul class='govuk-list govuk-list--bullet'>"
    )
  } catch (err) {
    ret.hint = ''
  }


  // Get measure type data from the OTT API
  res['data'].forEach(mt => {
    if (mt.id == measure_type_id) {
      ret.description = mt.attributes.description
      ret.measure_type_series_id = mt.attributes.measure_type_series_id
      ret.measure_component_applicable_code =
        mt.attributes.measure_component_applicable_code
      ret.order_number_capture_code = mt.attributes.order_number_capture_code
      ret.trade_movement_code = mt.attributes.trade_movement_code
      switch (mt.attributes.trade_movement_code) {
        case 0:
          ret.trade_direction = 'import only'
          break
        case 1:
          ret.trade_direction = 'export only'
          break
        case 2:
          ret.trade_direction = 'import and export'
          break
        default:
          ret.trade_direction = 'import only'
      }
      ret.measure_type_series_description =
        mt.attributes.measure_type_series_description
    }
  })

  // Get preference code
  var valid_series = ['C'];
  var preference_codes = require('../content/preference_codes/preference_codes.json')
  ret.preference_code_description = preference_codes[preference_code]

  if (
    ret.preference_code_description == '' ||
    typeof ret.preference_code_description === 'undefined' ||
    !valid_series.includes(ret.measure_type_series_id)
  ) {
    ret.preference_code = ''
  }

  return ret
}

global.get_countries = function (selected) {
  var countries = require('../data/geographical_areas.json')
  countries.data.forEach(element => {
    if (element.id == selected) {
      element.selected = true
    } else {
      element.selected = false
    }
  })
  return countries
}

global.format_commodity_code2 = function (str) {
  if (typeof str !== 'undefined') {
    s = '<span>' + str.substr(0, 4) + '</span>'
    s += '<span>' + str.substr(4, 4) + '</span>'
    // s += "<span>" + str.substr(6, 2) + "</span>";
    s += '<span>' + str.substr(8, 2) + '</span>'
    return s
  } else {
    return ''
  }
}

const fs = require('fs')


class Spr {
    constructor(req) {
        this.req = req;
        this.show_eligibility_link = false
        this.check_links()
    };

    check_links() {
        if (this.req["url"].indexOf("eligibility") > -1) {
            this.show_eligibility_link = true
        }
    }

    add_to_basket() {
        this.errors = []
        try {
            this.index = parseInt(this.req.session.data["index"])
        } catch {
            this.index = -1
        }

        this.identity = this.req.session.data["identity"].trim()
        this.abv = this.req.session.data["abv"].trim()
        this.volume = this.req.session.data["volume"].trim()

        // Check for errors on the identity field
        if (this.identity == "") {
            this.errors.push("identity")
        }

        // Check for errors on the ABV field
        
        this.abv = this.abv.replace(/[^0-9.]/gm, "")
        if (this.abv == "") {
            this.errors.push("abv")
        }
        if (this.abv > 100) {
            this.errors.push("abv")
        }
        if (this.abv < 0) {
            this.errors.push("abv")
        }


        // Check for errors on the volume field
        if (this.volume == "") {
            this.errors.push("volume")
        }

        if (this.index == -1) {
            // Add to basket
            if (this.errors.length == 0) {
                this.new_item = {
                    "identity": this.identity,
                    "abv": this.abv,
                    "volume": this.volume,
                    "lpa": (this.volume * this.abv) / 100
                }

                if (this.req.session.data["basket"] == null) {
                    this.req.session.data["basket"] = []
                }
                this.req.session.data["basket"].push(this.new_item)
            }
            this.calculate_basket()
        } else {
            // Edit basket item
            if (this.errors.length == 0) {
                this.req.session.data["basket"][this.index]["identity"] = this.identity
                this.req.session.data["basket"][this.index]["abv"] = this.abv
                this.req.session.data["basket"][this.index]["volume"] = this.volume
                this.req.session.data["basket"][this.index]["lpa"] = (this.volume * this.abv) / 100
                this.calculate_basket()
            }
        }
    }

    remove_from_basket(id) {
        var basket = []
        var index = -1
        this.req.session.data["basket"].forEach(item => {
            index += 1
            if (index != id) {
                basket.push(item)
            }
        });
        this.req.session.data["basket"] = basket
        this.calculate_basket()
    }

    calculate_basket() {
        var basket = this.req.session.data["basket"]
        this.req.session.data["total_volume"] = 0
        this.req.session.data["total_lpa"] = 0
        if (basket != null) {
            basket.forEach(item => {
                this.req.session.data["total_volume"] += parseFloat(item["volume"])
                this.req.session.data["total_lpa"] += parseFloat(item["lpa"])
            });
        }
        this.req.session.data["total_hlpa"] = this.req.session.data["total_lpa"] / 100
        var a = 1
    }

    get_rates() {
        // var hlpa = 37.7
        var hlpa = this.req.session.data["total_hlpa"]
        var marginal_rate = 0
        var marginal_discount = 0
        var prior_discount = 0
        var band_discount = 0
        var band_discounts = []
        var cumulative_discount = 0
        var base_rate = 0
        var band_width = 0
        var spr_discount = 0
        var filename = "./app/data/spr/rates.json"
        this.rates = fs.readFileSync(filename, 'utf8')
        this.rates = JSON.parse(this.rates);
        this.rates.forEach(rate => {
            if (rate["include"] == 1) {

                marginal_rate = 0
                marginal_discount = 0
                prior_discount = 0
                band_discount = 0
                band_discounts = []
                cumulative_discount = 0
                base_rate = 0
                band_width = 0
                spr_discount = 0

                var lookup_file = "./app/data/spr/lookup{lookup}.json".replace("{lookup}", rate["lookup"])
                if (fs.existsSync(lookup_file)) {
                    base_rate = rate["excise_rate"]
                    console.log(base_rate)
                    var lookup = fs.readFileSync(lookup_file, 'utf8')
                    var lookup_data = JSON.parse(lookup);
                    var band_index = -1
                    var found = false
                    lookup_data.forEach(band => {
                        if (found == false) {

                            band_index += 1
                            band_width = band["max"] - band["min"]
                            marginal_rate = band["marginal_rate"]
                            marginal_discount = base_rate * (1 - marginal_rate)
                            band_discount = marginal_discount * band_width
                            band_discounts.push(band_discount)
                            if (band_index > 0) {
                                cumulative_discount += band_discounts[band_index - 1]
                                prior_discount = band_discounts[band_index - 1]
                            }
                            if ((hlpa >= band["min"]) && (hlpa <= band["max"])) {
                                found = true
                                var over_production_in_band = hlpa - band["min"]
                                var marginal_discount_on_over_production_in_band = marginal_discount * over_production_in_band
                                spr_discount = (cumulative_discount + marginal_discount_on_over_production_in_band) / hlpa
                                var a = 1
                            }
                        }
                    });
                    rate["spr_discount"] = spr_discount
                    rate["spr_rate"] = base_rate - spr_discount
                    console.log(spr_discount)
                    var a = 1
                }
            }
        });

        var a = 1
    }

}
module.exports = Spr

const axios = require('axios');
require('dotenv').config();


class CommodityHistory {
    constructor(context, req, res, commodity) {
        this.context = context;
        this.req = req;
        this.res = res;
        this.commodity = commodity;
        if (this.context.resource_type == "heading") {
            this.commodity_link = commodity.substr(0, 4);
        } else {
            this.commodity_link = commodity;
        }
        this.get_history();
    }

    get_history() {
        this.root = process.env.HISTORY_API_ROOT;

        var url = this.root + "commodities?c=" + this.commodity;
        console.log(url);

        axios.get(url)
            .then((response) => {
                var commodity_history = response.data["data"];
                if (commodity_history.length == 0) {
                    this.context.no_results = true;
                } else {
                    this.context.no_results = false;
                }

                this.res.render('commodity_history', {
                    'commodity': this.commodity,
                    'commodity_link': this.commodity_link,
                    'context': this.context,
                    'commodity_history': commodity_history
                });
            });

    }
}
module.exports = CommodityHistory

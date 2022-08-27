require("./global");

class VatRate {
    constructor(calc) {
        this.calc = calc;

    }

    calculate() {

    }


    decimals = function (str, cnt) {
        var i = parseFloat(str)
        var n = i.toFixed(cnt).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        return n;
    }
}

module.exports = VatRate
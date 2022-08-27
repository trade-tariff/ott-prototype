class DutyExpression {
    constructor(measure_id, base, formatted_base) {
        this.measure_id = measure_id;
        this.base = base;
        this.formatted_base = formatted_base;
        this.ukify_meursings();
    }

    ukify_meursings() {
        this.formatted_base = this.formatted_base.replace("ADSZ", ' <abbr title="Sugar duty [ADSZ]">SD</abbr>');
        this.formatted_base = this.formatted_base.replace("ADFM", ' <abbr title="Flour duty [ADFM]">FD</abbr>');
        this.formatted_base = this.formatted_base.replace("EA", ' <abbr title="Agricultural component [EA]">AC</abbr>');
    }
}
module.exports = DutyExpression
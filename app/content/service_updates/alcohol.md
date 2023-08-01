The way you calculate Alcohol Duty changes on 1 August 2023.

2 new reliefs will be introduced for:

- small producers
- products sold on draught

## Information on gov.uk about the new alcohol duties

There is a wealth of information on gov.uk describing the new alcohol duties.

- [Work out how much Alcohol Duty you need to pay](https://www.gov.uk/guidance/work-out-how-much-alcohol-duty-you-need-to-pay)
- [Check if you can pay less Alcohol Duty on draught products](https://www.gov.uk/guidance/check-if-you-can-pay-less-alcohol-duty-on-draught-products)
- [Check if you’re eligible for Small Producer Relief on Alcohol Duty](https://www.gov.uk/guidance/check-if-youre-eligible-for-small-producer-relief-on-alcohol-duty)
- [How to work out your Alcohol Duty rates if you’re eligible for Small Producer Relief](https://www.gov.uk/guidance/how-to-work-out-your-alcohol-duty-rates-if-youre-eligible-for-small-producer-relief)
- [How your business set up can affect your eligibility for Small Producer Relief](https://www.gov.uk/guidance/how-your-business-set-up-can-affect-your-eligibility-for-small-producer-relief)
- [HMRC email updates, videos and webinars for Alcohol Duty](https://www.gov.uk/guidance/hmrc-email-updates-videos-and-webinars-for-alcohol-duty)

## Changes to the Online Trade Tariff

From 1 August 2023, the updated excise duties are displayed against the relevant commodity codes.

Instead of using excise codes in the X400 range, the new excise codes are in the X300 range, and cater for both the new Draught Relief and the Small Producer Relief.

The biggest changes that you will see concern the Small Producer Relief (SPR). Take for example excise range **369** (Other fermented products at least 3.5 but less than 8.5% & Sparkling cider exceeding 5.5 but less than 8.5% & eligible for SPR), which is identified with the additional code **X369**.

This excise code is valid for products with an <abbr title="Alcohol by Volume">ABV</abbr> content between 3.5 and 8.49%.

The online tariff shows that the excise code may not be used for products where the SBV is higher or lower than that range.

Within the acceptable range however, the duty is expressed as follows:

**24.77 GBP / % vol/hl - 1.00 GBP for each litre of pure alcohol, multiplied by the SPR discount.**

Small Producer Relief is a reduction on the basic (full) rate of excise duty of £1.00 for every litre of pure alcohol multiplied by the Small Producer Relief discount.

### Finding the <abbr title="Small Producer Relief">SPR</abbr> discount

The discount is determined 'off-system' using the [SPR calculator tool](https://www.gov.uk/guidance/check-if-youre-eligible-for-small-producer-relief-on-alcohol-duty) on gov.uk.

At the end of the calculation process, you will be asked to **Save a copy of your Small Producer Relief**.

This saved copy shows you the:

- Full rate
- <abbr title="Small Producer Relief">SPR</abbr> discount
- <abbr title="Small Producer Relief">SPR</abbr> rate

### Calculating the impact of the <abbr title="Small Producer Relief">SPR</abbr> discount

In the calculation described above, the value in the <abbr title="Small Producer Relief">SPR</abbr> discount column is used to determine the discounted rate.

Let's say you are trading beer with an <abbr title="Alcohol by Volume">ABV</abbr> between 2.5% and 8.49%.

- the full excise duty rate is **£21.01 per litre of pure alcohol**
- the <abbr title="Small Producer Relief">SPR</abbr> discount for a business that will produce 1000 litres of alcohol per year is **£4.89 per litre of pure alcohol**

For this example import:

- Import quantity is 2,000 litres
- Alcohol by Volume (ABV) is 5%
- Therefore, litres of pure alcohol is 100 LPA


The full excise duty (with no <abbr title="Small Producer Relief">SPR</abbr> discount) is

- £21.01 * 100 = £2101.00

The reduced excise duty (with <abbr title="Small Producer Relief">SPR</abbr> discount applied) is:

- (£21.01 * 100) - (£4.89 * 100), *which equals*
- £16.12 * 100, *which equals*
- £1612.00

## Changes to the Online Trade Tariff API

### Introduction of the new SPQ measurement unit

While the display of the duties on the public-facing Online tariff is similar to way in which excise duties are already displayed, the way in which the data is received from CDS and exposed in the Online Trade Tariff API for <abbr title="Small Producer Relief">SPR</abbr> introduces a **new measurement unit**, as follows.

For the duty expression described above, there are two measure components, which are the building blocks of the actual duty.

- The first of these components is the £9.27 per ASVX (alcohol by volume by hectolitre)
- The second component reflects the <abbr title="Small Producer Relief">SPR</abbr> discount, which is referred to via the **SPQ** unit.

The **SPQ** unit can be described as "1 * GBP multiplied by the <abbr title="Small Producer Relief">SPR</abbr> discount".

This is then **subtracted** from the base rate of £9.27 per ASVX via the use of the duty expression ID 02.

The net result is (the full duty - <abbr title="Small Producer Relief">SPR</abbr> discount) multiplied by the litres of pure alcohol (LPA).


{

      "id": "-1010135121-01",

      "type": "measure_condition_component",

      "attributes": {

        "duty_expression_id": "01",

        "duty_amount": 9.27,

        "monetary_unit_code": "GBP",

        "monetary_unit_abbreviation": null,

        "measurement_unit_code": "ASV",

        "measurement_unit_qualifier_code": "X",

        "duty_expression_description": "% or amount",

        "duty_expression_abbreviation": "%",

        "measure_condition_sid": -1010135121

      }

    },

    {

      "id": "-1010135121-02",

      "type": "measure_condition_component",

      "attributes": {

        "duty_expression_id": "02",

        "duty_amount": 1,

        "monetary_unit_code": "GBP",

        "monetary_unit_abbreviation": null,

        "measurement_unit_code": "SPQ",

        "measurement_unit_qualifier_code": null,

        "duty_expression_description": "minus % or amount",

        "duty_expression_abbreviation": "-",

        "measure_condition_sid": -1010135121

      }

    }

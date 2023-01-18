# "Online Trade Tariff" - gov.uk Prototyping kit prototype

## About the service

Use this service to find a commodity code for goods you’re importing to or exporting from the UK.

You can also use the service to:

- check if there’s duty or VAT to pay
- find out about suspensions or reductions
- You’ll need a commodity code when you fill in a customs declaration form, so you pay the correct amount of tax and duties.

The live service is accessed via https://www.gov.uk/trade-tariff

## About this repository

This repository is used for quick prototypes for new functionality for the Online Tariff

- code is written using the gov.uk prototyping kit
- not linked to the core application
- but calls the OTT's real APIs

## Index

- ["Online Trade Tariff" - gov.uk Prototyping kit prototype](#online-trade-tariff---govuk-prototyping-kit-prototype)
  - [About the service](#about-the-service)
  - [About this repository](#about-this-repository)
  - [Index](#index)
  - [Running the application](#running-the-application)
    - [Environment variables](#environment-variables)
  - [Licence](#licence)

## Running the application

### Environment variables

The application requires environment variables to be set up. The `.env.sample` file needs to updated with appropriate values:

```
filter_display_percentage_threshold = 5
filter_value_count_threshold = 0
show_commodities_threshold = 20
show_headings_threshold = 3
FLAG_SHOW_NEW_QUOTA_DIALOG=0
FLAG_SHOW_QUOTA_POPUP=1
FLAG_SHOW_EDIT_REFERENCES_LINK=1
```

Then rename the file `.env.sample` to `.env`.

## Licence

This application is made available under the [MIT licence](/LICENCE.txt).

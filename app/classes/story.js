var MarkdownIt = require('markdown-it');
const mdCustomBlock = require('markdown-it-custom-block')
const mdCustomBlock2 = require('markdown-it-custom-block')

class Story {
  constructor(file) {
    const path = require('path');
    var fs = require('fs');
    const directoryPath = path.join(__dirname, 'news');
    const { DateTime } = require("luxon");
    var dt = DateTime.local(2017, 5, 15, 8, 30);

    this.file = file;
    this.date = file.replace(".md", "");
    this.date_formatted = DateTime.fromISO(this.date).toFormat("d MMM yyyy");
    var filename = path.join(directoryPath, this.file);

    fs = require('fs')

    var data = fs.readFileSync(filename, 'utf8');
    var md = new MarkdownIt();

    md.use(require('markdown-it-container'), 'spoiler', {
 
      // validate: function(params) {
      //   return params.trim().match(/^spoiler\s+(.*)$/);
      // },
     
      render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
     
        if (tokens[idx].nesting === 1) {
          // opening tag
          return '<details><summary>' + md.utils.escapeHtml(m[1]) + '</summary>\n';
     
        } else {
          // closing tag
          return '</details>\n';
        }
      }
    });
     
    // console.log(md.render('::: spoiler click me\n*content*\n:::\n'));
    this.html = md.render(data);


    md.use(mdCustomBlock, {
      inset(text, t2) {
        var ret = `<div class="govuk-inset-text">${text}${t2}</div>`;
        return (ret);
      },
      inset_blue(text) {
        var ret = `<div class="govuk-inset-text nhs-grey-5">${text}</div>`;
        return (ret);
      },
      warning(text) {
        var ret = `<div class="govuk-warning-text">
            <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
            <strong class="govuk-warning-text__text">
                <span class="govuk-warning-text__assistive">Warning</span>
                ${text}
            </strong>
        </div>`;
        return (ret);
      }
    })

    this.html = md.render(data);
    this.govify();
  };

  govify() {
    this.html = this.html.replace("<h1", "<h1 class='govuk-heading-s govuk-!-margin-bottom-1'")
    this.html = this.html.replace("<ul", "<ul class='govuk-list govuk-list--bullet'")
  }
}
module.exports = Story

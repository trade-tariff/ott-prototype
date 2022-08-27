const Story = require('./story');
var MarkdownIt = require('markdown-it');

global.get_news = function (str, cnt) {
    const path = require('path');
    const fs = require('fs');
    const directoryPath = path.join(__dirname, 'news');
    var stories = [];

    stories.push(new Story("2022-08-01.md"));
    // stories.push(new Story("2021-01-04.md"));
    stories.push(new Story("2021-12-07.md"));
    // stories.push(new Story("2021-12-03.md"));
    stories.push(new Story("2021-11-15.md"));
    // stories.push(new Story("2021-01-03.md"));
    // stories.push(new Story("2021-01-02.md"));

    return(stories);
}


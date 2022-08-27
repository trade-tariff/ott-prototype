const { result } = require('lodash');
const SectionChapterNote = require('./section_chapter_note');
var MarkdownIt = require('markdown-it');

class SectionChapterNotesCollection {
    constructor(context, req, res) {
        this.context = context;
        this.section_chapter_notes = [];
        this.get_files();
    }

    get_files() {
        const path = require('path');
        const fs = require('fs');
        var i;
        this.section_chapter_notes = [];
        this.directoryPath = path.join(__dirname, '..', 'content', 'hs22', 'section_chapter_notes');

        var filenames = fs.readdirSync(this.directoryPath);
        for (i = 0; i < filenames.length; i++) {
            var file = filenames[i];
            if (file.includes(".md")) {
                var md = new MarkdownIt();
                var filename = path.join(this.directoryPath, file)
                var raw = fs.readFileSync(filename, 'utf8');
                var content = md.render(raw);
                var s = new SectionChapterNote(file, content);
                this.section_chapter_notes.push(s);
            }
        }
    }
}
module.exports = SectionChapterNotesCollection

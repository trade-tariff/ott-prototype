class FileHandler {
    constructor(path = null) {
        this.path = path;
        this.file_size = 0;

        this.get_file_size()
    }

    get_file_size() {
        var fs = require("fs"); // Load the filesystem module
        var stats = fs.statSync(this.path)
        var fileSizeInBytes = stats.size;
        var fileSizeInKilobytes = fileSizeInBytes / 1024;
        this.file_size = fileSizeInKilobytes;
    }
}
module.exports = FileHandler

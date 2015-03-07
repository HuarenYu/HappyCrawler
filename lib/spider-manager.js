var fs = require('fs'),
    logger = require('../lib/log-util'),
    path = require('path');


var spidersPath = path.join(__dirname, '../spiders');

function spiderManager() {}

spiderManager.prototype.runSpiders = function() {

    fs.readdir(spidersPath, function(err, files) {
        if (err) {
            logger.error('load spider error', err);
            throw err;
        }

        files.forEach(function(file, index) {
            var spider = require(path.join(spidersPath, file))();
            spider.start();
        });

    });

};

module.exports = spiderManager;
var Crawler = require('simplecrawler'),
    logger = require('./log-util');

function spider(domain) {
    this.domain = domain;
    this.crawler = new Crawler(domain);
    this.crawler.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36';
}

spider.prototype._init = function() {
    var self = this;
    self.setErrorHandler();
};

spider.prototype.setErrorHandler = function() {
    var self = this;

    self.crawler.on('queueerror', function(errorData, URLData) {
        logger.error('queueerror:' + errorData + 'url:' + URLData);
    });

    self.crawler.on('fetchdataerror', function(queueItem, response) {
        logger.error('fetchdataerror' + queueItem + response);
    });

    self.crawler.on('fetch404', function(queueItem, response) {
        logger.error('fetch404' + queueItem + response);
    });

    self.crawler.on('fetcherror', function(queueItem, response) {
        logger.error('fetcherror' + queueItem + response);
    });

};

spider.prototype.on = function(event, handler) {
    var self = this;
    self.crawler.on(event, handler);
};

spider.prototype.setFilter = function(filter) {
    var self = this;
    self.crawler.discoverResources = filter;
};

spider.prototype.start = function() {
    var self = this;
    self.crawler.start();
};

module.exports = spider;
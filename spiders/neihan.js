var cheerio = require('cheerio'),
    logger = require('../lib/log-util'),
    Spider = require('../lib/spider'),
    model = require('../lib/model'),
    crypto = require('crypto');

var domain = 'www.neihanshequ.com';
var Item = model.Item;

module.exports = function() {

    var spider = new Spider(domain);

    spider.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        logger.info('fetch ' + queueItem.url + ' complete.');
        var html = responseBuffer.toString();
        var $ = cheerio.load(html);

        $('div.pin').each(function(index, el) {
            var $this = $(this);
            var content = $this.find('.pin-context p').text().replace(/\n|\r/g, '').trim();
            var image = [];
            var type = 'text';
            var shasum = crypto.createHash('sha1');
            var sha1 = shasum.update(content).digest('hex');

            Item.findOne({
                sha1: sha1
            }, '', function(err, item) {
                if (err) {
                    logger.error(err);
                    throw err;
                }
                if (!item) {
                    model.genID('item', function(err, ID) {
                        if (err) {
                            logger.error(err);
                            throw err;
                        }
                        
                        var newItem = new Item({
                            id: ID.id,
                            title: '',
                            content: content,
                            author: '',
                            image: image,
                            category: 'xiaohua',
                            fromSite: domain,
                            fromSiteName: '内涵社区',
                            createTime: new Date(),
                            type: type,
                            sha1: sha1
                        });
                        
                        newItem.save(function(err, item) {
                            if (err) {
                                logger.error(err);
                                throw err;
                            }
                            logger.info('item saved.');
                        });
                        
                    });

                }
            });

        });

    });

    spider.on('complete', function() {
        logger.info(domain + ' crawl complete.');
    });

    spider.setFilter(function(resourceData, queueItem) {
        var urls = [];
        var html = resourceData.toString();
        var $ = cheerio.load(html);

        $('div.pin_paginator a').each(function(index, el) {
            var $this = $(this);
            var url = $this.attr('href');
            var pageText = url.substr(url.indexOf('=') + 1);
            var page = parseInt(pageText, 10);
            if (!isNaN(page) && page <= 400) {
                urls.push(url);
            }
        });
        return urls;
    });

    return spider;
};

//module.exports().start();
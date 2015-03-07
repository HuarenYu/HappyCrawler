var cheerio = require('cheerio'),
    logger = require('../lib/log-util'),
    Spider = require('../lib/spider'),
    model = require('../lib/model'),
    crypto = require('crypto');

var domain = 'www.qiushibaike.com';
var Item = model.Item;

module.exports = function() {

    var spider = new Spider(domain);

    spider.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        logger.info('fetch ' + queueItem.url + ' complete.');
        var html = responseBuffer.toString();
        var $ = cheerio.load(html);

        $('div.article').each(function(index, el) {
            var $this = $(this);
            var content = $this.find('.content').text();
            content = content.replace(/\n|\r/g, '').trim();
            var image = [];
            var type = 'text';
            var title = $this.attr('id');
            var shasum = crypto.createHash('sha1');
            var sha1 = shasum.update(title).digest('hex');

            Item.findOne({
                sha1: sha1
            }, '', function(err, item) {
                if (err) {
                    logger.error(err);
                    throw err;
                }
                if (!item) {
                    $this.find('.thumb img').each(function(index, el) {
                        var src = $(this).attr('src');
                        src && image.push(src);
                    });
                    if (image.length > 0) {
                        type = 'image';
                    }
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
                            fromSiteName: '糗事百科',
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

        $('div.pagebar>a').each(function(index, el) {
            var $this = $(this);
            var url = $this.attr('href');
            var pageText = $this.text();
            var page = parseInt(pageText, 10);
            if (!isNaN(page) && /^.*\/8hr\/page\/\d+.*/.test(url)) {
                urls.push(url);
            }
        });

        return urls;
    });

    return spider;
};

//module.exports().start();
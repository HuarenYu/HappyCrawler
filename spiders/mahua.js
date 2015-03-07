var cheerio = require('cheerio'),
    iconv = require('iconv-lite'),
    logger = require('../lib/log-util'),
    Spider = require('../lib/spider'),
    model = require('../lib/model'),
    crypto = require('crypto');

var domain = 'www.mahua.com';
var Item = model.Item;

module.exports = function() {

    var spider = new Spider(domain);

    spider.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        logger.info('fetch ' + queueItem.url + ' complete.');
        var html = iconv.decode(responseBuffer, 'GB2312');
        var $ = cheerio.load(html);

        $('.mahua').each(function(index) {
            var $this = $(this);
            var title = $this.find('h3>a').text();
            if (!title) {
                return;
            }
            var content = $this.find('.content').text().replace(/\n|\r/g, '').trim();
            var image = [];
            var type = 'text';
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
                    $this.find('.content img').each(function(index, el) {
                        var src = $(this).attr('src');
                        src && image.push(src);
                    });
                    
                    if (image.length > 0) {
                        var src = image[0];
                        type = /.*\.gif$/.test(src) ? 'gif' : 'image';
                    }

                    model.genID('item', function(err, ID) {

                        var newItem = new Item({
                            id: ID.id,
                            title: title,
                            content: content || title,
                            author: '',
                            image: image,
                            category: 'xiaohua',
                            fromSite: domain,
                            fromSiteName: '快乐麻花',
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

        $("#page>a").each(function(index, item) {
            var $this = $(this);
            var href = $this.attr('href');
            var page = parseInt($this.text());
            if (!isNaN(page) && page <= 20) {
                urls.push(href);
            }
        });
        return urls;
    });

    return spider;
};

//module.exports().start();
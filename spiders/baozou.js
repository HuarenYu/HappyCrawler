var cheerio = require('cheerio'),
    logger = require('../lib/log-util'),
    Spider = require('../lib/spider'),
    model = require('../lib/model'),
    crypto = require('crypto');

var domain = 'www.baozou.com';
var Item = model.Item;

module.exports = function() {

    var spider = new Spider(domain);
    spider.crawler.initialPath = '/all/fresh';

    spider.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        logger.info('fetch ' + queueItem.url + ' complete.');
        var html = responseBuffer.toString();
        var $ = cheerio.load(html);

        $('.entry-item').each(function(index) {
            var $this = $(this);
            var title = $this.attr('id');
            if (!title) {
                return;
            }
            var content = '';
            var image = [];
            var type = 'image';
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
                    $this.find('.img-wrap a img').each(function(index, el) {
                        var src = $(this).attr('src');
                        var alt = $(this).attr('alt') || '';
                        src && image.push(src);
                        content = alt.replace(/\n|\r/g, '').trim();
                    });                    
                    if (image.length < 0) {
                        return;
                    }
                    model.genID('item', function(err, ID) {
                        var newItem = new Item({
                            id: ID.id,
                            title: title,
                            content: content,
                            author: '',
                            image: image,
                            category: 'baozoumanhua',
                            fromSite: domain,
                            fromSiteName: '暴走漫画',
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

        $("div.pagebar a").each(function(index, item) {
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
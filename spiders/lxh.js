var cheerio = require('cheerio'),
    logger = require('../lib/log-util'),
    Spider = require('../lib/spider'),
    model = require('../lib/model'),
    crypto = require('crypto');

var domain = 'www.lengxiaohua.com';
var Item = model['Item'];

module.exports = function() {

    var spider = new Spider(domain);

    spider.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        logger.info('fetch ' + queueItem.url + ' complete.');
        var html = responseBuffer.toString();
        var $ = cheerio.load(html);

        $('.joke_li').each(function(index, el) {
            var $this = $(this);
            var title = $this.attr('id');
            var content = $this.find('pre').text() || '';
            content = content.replace(/\n|\r/g, '').trim();
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
                    $this.find('.joke_img_box img').each(function(index, el) {
                        var src = $(this).data('original');
                        src && image.push('http://lengxiaohua.com' + src);
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
                            title: title,
                            content: content,
                            author: '',
                            image: image,
                            category: 'xiaohua',
                            fromSite: domain,
                            fromSiteName: '冷笑话',
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
        if (queueItem.url === 'http://lengxiaohua.com/') {
            for (var i = 2; i <= 20; i++) {
                urls.push(queueItem.url + '/?page_num=' + i);
            }
        }
        return urls;
    });

    return spider;
};

//module.exports().start();
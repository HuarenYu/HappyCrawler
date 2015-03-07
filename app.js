var express = require('express'),
    logger = require('./lib/log-util'),
    spiders = require('./lib/spider-manager'),
    model = require('./lib/model');

var spiderManager = new spiders();
var Item = model.Item;
var port = 8080;

var app = express();
app.use(express.static('static'));

app.get('/spider/run', function(req, res) {
    spiderManager.runSpiders();
    res.end('spider start.');
});

app.get('/item/list.json', function(req, res) {
    var category = req.query.category;
    var currentCursor = req.query.currentCursor;
    var type = req.query.type;
    var size = req.query.size;
    Item
        .where('category').equals(category)
        .where('type').equals(type)
        .where('id').lt(currentCursor)
        .limit(size)
        .sort('-id')
        .select()
        .exec(function(err, items) {
            if (err) {
                res.json({
                    status: 'error',
                    message: '服务器遇到了问题，紧急修复中。'
                })
                logger.error(err);
                throw err;
            }
            res.json({
                status: 'success',
                message: 'fetch success',
                items: items
            });
        });
});

app.get('/item/fetchUpdate.json', function(req, res) {
    var category = req.query.category;
    var maxCursor = req.query.maxCursor;
    var type = req.query.type;
    var size = req.query.size;

    Item
        .where('category').equals(category)
        .where('type').equals(type)
        .where('id').gt(maxCursor)
        .limit(size)
        .select()
        .sort('id')
        .exec(function(err, items) {
            if (err) {
                res.json({
                    status: 'error',
                    message: '服务器遇到了问题，紧急修复中。'
                })
                logger.error(err);
                throw err;
            }
            res.json({
                status: 'success',
                message: items.length,
                items: items
            });
        });

});

app.get('/item/checkUpdate.json', function(req, res) {
    var category = req.query.category;
    var maxCursor = parseInt(req.query.maxCursor, 10);
    var type = req.query.type;
    var size = req.query.size;
    console.log(req.query);
    Item.where('category').equals(category)
        .where('type').equals(type)
        .where('id').gt(maxCursor)
        .count()
        .exec(function(err, count) {
            if (err) {
                res.json({
                    status: 'error',
                    message: '服务器遇到了问题，紧急修复中。'
                })
                logger.error(err);
                throw err;
            }
            //用户第一次打开APP
            if (maxCursor === 0) {
                Item
                    .where('category').equals(category)
                    .where('type').equals(type)
                    .where('id').gt(maxCursor)
                    .limit(size)
                    .select()
                    .sort('-id')
                    .exec(function(err, items) {
                        if (err) {
                            res.json({
                                status: 'error',
                                message: '服务器遇到了问题，紧急修复中。'
                            })
                            logger.error(err);
                            throw err;
                        }
                        res.json({
                            status: 'success',
                            message: '',
                            count: 0,
                            items: items.reverse()
                        });
                    });
            } else {
                Item
                    .where('category').equals(category)
                    .where('type').equals(type)
                    .where('id').lte(maxCursor)
                    .limit(size)
                    .select()
                    .sort('-id')
                    .exec(function(err, items) {
                        if (err) {
                            res.json({
                                status: 'error',
                                message: '服务器遇到了问题，紧急修复中。'
                            })
                            logger.error(err);
                            throw err;
                        }
                        res.json({
                            status: 'success',
                            message: '',
                            count: count,
                            items: items.reverse()
                        });
                    });
            }

        });

});

var server = app.listen(port, function() {
    logger.info('express web server listening on ' + port + '...');
});
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/happy');

var models = {};

models.Item = mongoose.model('Item', {
    id: Number,
    title: String,
    content: String,
    author: String,
    image: Array,
    category: String,
    fromSite: String,
    fromSiteName: String,
    createTime: Date,
    type: String,
    sha1: String
});

models.ID = mongoose.model('ID', {
    collectionName: String,
    id: Number
});

models.genID = function(collectionName, callback) {
    models.ID.findOneAndUpdate({collectionName: collectionName}, {$inc: {id: 1}}, callback);
}

module.exports = models;
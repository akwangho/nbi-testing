var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static(__dirname));

app.use(bodyParser());


// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.post('/nbi', function(req, res) {
    var requestUrl = req.body.requestUrl;
    var requestContent = req.body.requestContent;

    doPost(requestUrl, JSON.stringify(requestContent), function (res2) {
        res.end(res2);
    });
});


var doPost = function(url, content, callback) {
    var options = {
        uri: url,
        method: 'POST',
        body: content,
        rejectUnauthorized: false
    };

    request(options, function (error, response, body) {
        var res = error? JSON.stringify(error): body;
        callback(res);
    });
};

app.listen(process.env.PORT || 3000);

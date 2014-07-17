var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var logger = require('morgan');
var fs = require('fs');

var logFile = fs.createWriteStream('./logOfMyServer.log', {flags: 'a'});

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(logger({stream: logFile}));
app.post('/proxy', function(req, res) {
    var requestUrl = req.body.requestUrl;
    var requestContent = req.body.requestContent;

    logFile.write("Request Url: [" + requestUrl + "]. From: [" + req.ip + "].\n");
    logFile.write("Request Content: [" + JSON.stringify(requestContent) + "].\n");

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


app.listen(process.env.PORT || 80); // need to run as root
app.listen(process.env.PORT || 3000);
console.log("Server running at port 3000 and 80");
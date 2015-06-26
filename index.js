'use strict';
var express = require('express');
var http = require('http');
var Form = require('form-data');
var app = express();
var OAuth2 = {
  clientID: 'tY168glCRAKR0qX1CrHMcR6H2Z0JeY',
  // IGNORING BAD PRACTICE OF STORING SECRETS IN CODE
  clientSecret: 'DIXEO5UaIMKsEKSBLv2tifkpWmoX5D',
  site: 'local.wordpress.dev',
  authorizationPath: '/oauth/authorize',
  tokenPath: '/oauth/token'
};
var redirectURI = 'http://localhost:3000/authorize';
app.get('/login', login);
app.get('/authorize', authorize);
var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
/**
* @name login
* @desc redirect to WordPress authorize
* @param {Object} req Express HTTP request
* @param {Object} res Express HTTP response
*/
function login(req, res) {
  res.redirect('http://' +
    OAuth2.site +
		OAuth2.authorizationPath +
		'?response_type=code' +
		'&client_id=' + OAuth2.clientID +
		'&redirect_uri=' + redirectURI);
}
/**
* @name authorize
* @desc callback for WordPress authorize; redirects to app with token
* @param {Object} req Express HTTP request
* @param {Object} res Express HTTP response
*/
function authorize(req, res) {
  var code = req.query.code;
  if (!code) {
    return res.status(401).send('');
  }
  var form = new Form();
  form.append('grant_type', 'authorization_code');
  form.append('code', code);
  form.append('redirect_uri', redirectURI);
  var headers = form.getHeaders();
  headers.Authorization = 'Basic ' +
    new Buffer(OAuth2.clientID + ':' + OAuth2.clientSecret)
    .toString('base64');
  var options = {
    hostname: OAuth2.site,
    port: 80,
    path: OAuth2.tokenPath,
    method: 'POST',
    headers: headers
  };
  var req2 = http.request(options, callback);
  req2.on('error', error);
  form.pipe(req2);
  req2.end();
  function callback(res2) {
    var data = '';
    res2.on('data', callbackData);
    res2.on('end', callbackEnd);
    function callbackData(chunk) {
      data = data + chunk;
    }
    function callbackEnd() {
      /* jshint ignore:start */
      // IGNORE WARNINGS ABOUT UNDERSCORE
      var credential = JSON.parse(data);
      if (!credential['access_token']) {
        return res.status(401).send('');
      }
      res.redirect('/?token=' + credential['access_token']);
      /* jshint ignore:end */
    }
  }
  function error(e) {
    res.status(500).send(e);
  }
}

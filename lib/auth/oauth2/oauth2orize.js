/*

MIT License

Copyright (c) 2016 Gerges Beshay, nopbyte

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Modifications 2016 David Parra. Change the implementations to use different logic
according to this project (tokens, users, etc). However, the coments explaining
each oauth2 server endpoint are kept.


*/
/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');
var login = require('connect-ensure-login');
var utils = require('../../util/tokens');
var ids = require('../../util/id');
var bcrypt = require('bcrypt');
var server, db;
var default_exp = 1200;

function init(tokenconf, entityStorageConf) {
  server = oauth2orize.createServer();
  db = require('../../db')(tokenconf, entityStorageConf);

  // Register supported grant types.
  //
  // OAuth 2.0 specifies a framework that allows users to grant client
  // applications limited access to their protected resources.  It does this
  // through a process of the user granting access, and the client exchanging
  // the grant for an access token.

  // Grant authorization codes.  The callback takes the `client` requesting
  // authorization, the `redirectURI` (which is used as a verifier in the
  // subsequent exchange), the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a code, which is bound to these
  // values, and will be exchanged for an access token.

  server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
    if (redirectURI !== client.redirectURI) {
      return done(new Error("client URL doesn't match what was expected. Provided: " + redirectURI + " expected " + client.redirectURI), null);
    }
    console.log("generating authorization code for client with id : " + client.id + "  and for user with id  " + user.id);
    var code = utils.uid(16);
    db.authorizationCodes.save(code, client.id, redirectURI, user.id, user.auth_type, function (err) {
      if (err) {
        return done(err);
      }
      done(null, code);
    });
  }));

  // Grant implicit authorization.  The callback takes the `client` requesting
  // authorization, the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a token, which is bound to these
  // values.

  /*server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
    var token = utils.uid(256);
    db.accessTokens.save(token, user.id, client.id, "bearer", [], default_exp, function (err) {
      if (err) {
        return done(err);
      }
      done(null, token);
    });
  }));*/

  // Exchange authorization codes for access tokens.  The callback accepts the
  // `client`, which is exchanging `code` and any `redirectURI` from the
  // authorization request for verification.  If these values are validated, the
  // application issues an access token on behalf of the user who authorized the
  // code.

  server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
    var oauth2 = "code";
    console.log("client  with id: " + client.id + " is attempting to exchange code " + code + " for a token");
    db.authorizationCodes.find(code, function (err, authCode) {
      if (err) {
        return done(err);
      }
      if (client.id !== authCode.clientID) {
        return done(null, false);
      }
      if (redirectURI !== authCode.redirectURI) {
        return done(null, false);
      }
      var userId = authCode.userID;
      db.accessTokens.findOauth2Token(ids.getUsername(userId), ids.getAuthType(userId), client.id, oauth2, function (err, token) {
        console.log("token for client  with id: " + client.id + " is there. User is " + userId);
        if (err) {
          return done(err);
        }
        if (!token) {
          return done(null, false);
        } else {
          return done(null, token.token);
        }
      });

    });
  }));

  // Grant implicit authorization.  The callback takes the `client` requesting
  // authorization, the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a token, which is bound to these
  // values.

  server.grant(oauth2orize.grant.token(function (client, user, ares, done) {

    var userId = user.id;
    console.log("executing implicit grant for client  with id: " + client.id + " which is there. User is " + userId);
    var oauth2 = "token";
    //this is needed in case the user who has logged in with the browser comes back for some reason
    db.accessTokens.findOauth2Token(ids.getUsername(userId), ids.getAuthType(userId), client.id, oauth2, function (err, token) {
      if (!err && token) {
        console.log("returning preexistent token for user with id " + userId + " client " + client.id + " and oauth2 kind " + oauth2);
        return done(null, token.token);
      } else {
        return done(err);

      }
    });
  }));

  // Exchange user id and password for access tokens.  The callback accepts the
  // `client`, which is exchanging the user's name and password from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the user who authorized the code.
  /*
  server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
      console.log('                calling exchange ');
      console.log('                client '+JSON.stringify(client));
      console.log('                username '+JSON.stringify(username));
      console.log('                password '+JSON.stringify(password));
      console.log('                scope '+JSON.stringify(scope));
      console.log('');
      console.log('');
      console.log('');
  console.log('');

      //Validate the client
      db.clients.findByClientId(client.id, function(err, localClient) {
          if (err) { return done(err); }
          if(localClient === null) {
              return done(null, false);
          }
          if(localClient.clientSecret !== client.clientSecret) {
              return done(null, false);
          }
          //Validate the user
          //TODO fix this!!!!
          db.users.findByUsernameAndAuthType(username,'local', function(err, user) {
              if (err) { return done(err); }
              if(user === null) {
                  return done(null, false);
              }
              if(password !== user.password) {
                  return done(null, false);
              }
              //Everything validated, return the token
              var token = utils.uid(256);
              db.accessTokens.save(token, user.id, client.id, function(err) {
                  if (err) { return done(err); }
                  done(null, token);
              });
          });
      });
  }));
  */
  // Exchange the client id and password/secret for an access token.  The callback accepts the
  // `client`, which is exchanging the client's id and password/secret from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the client who authorized the code.

  server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {
    var oauth2 = "client_credentials";
    //Validate the client
    db.clients.findByClientId(client.id, function (err, localClient) {
      if (err) {
        return done(err);
      }
      if (localClient === null || !localClient.clientSecret) {
        return done(null, false);
      }
      if (localClient.clientSecret !== client.clientSecret) {
        return done(null, false);
      }
      var userID = client.owner;
      //The user responsible for this client is the owner!

      console.log("client-credentials token for client  with id: " + client.id + " is NOT there. User is " + userID);
      console.log("client-credentials creating new token");
      var expiration = null;
      var refreshToken = null;
      var newToken = utils.uid(64);
      db.accessTokens.saveOauth2Token(newToken, userID, client.id, "bearer", "client-token-scope", expiration, refreshToken, oauth2, function (err) {
        if (err) {
          return done(err);
        } else {
          return done(null, newToken);
        }
      });

    });
  }));


  server.exchange(oauth2orize.exchange.password(function (client, username, secret, done) {
    var oauth2 = "password";
    //Validate the client
    db.clients.findByClientId(client.id, function (err, localClient) {
      if (err) {
        return done(err);
      }
      if (localClient === null || !localClient.clientSecret) {
        return done(null, false);
      }
      if (localClient.clientSecret !== client.clientSecret) {
        return done(null, false);
      }
      //Validate the user
      db.users.findByUsernameAndAuthType(username, "local", function (err, localUser) {
        if (err) {
          return done(err);
        }
        if (localUser === null || !localUser.password) {
          return done(null, false);
        }
        bcrypt.compare(secret, localUser.password, function (err, res) {
          if (err || !res) {
            return done(null, false);
          } else {
            var userID = localUser.id;
            //The user responsible for this client is the owner!

            console.log("user-credentials token for user  with id: " + userID + " is NOT there. User is " + userID);
            console.log("user-credentials creating new token");
            var expiration = null;
            var refreshToken = null;
            var token = utils.uid(64);
            db.accessTokens.saveOauth2Token(token, userID, client.id, "bearer", "password-token-scope", expiration, refreshToken, oauth2, function (err) {
              if (err) {
                return done(err);
              } else {
                return done(null, token);
              }
            });
          }
        })
      });
    });
  }));

}

var exportServer = function (tokenconf, entityStorageConf) {
  if (server)
    return server;
  else {
    init(tokenconf, entityStorageConf);
    return server;
  }
};

module.exports = exportServer;

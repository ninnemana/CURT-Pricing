
/**
 * Module dependencies.
 */

var express = require('express'),
    auth_routes = require('./routes/auth'),
    global_routes = require('./routes/index'),
    redis = {};

var app = module.exports = express.createServer();
var RedisStore = require('connect-redis')(express);

if(process.env.REDISTOGO_URL){
    var rtg = require('url').parse(process.env.REDISTOGO_URL);
    redis = require('redis').createClient(rtg.port, rtg.hostname);
    redis.auth = rtg.auth.split(':')[1];
}else{
    redis = require('redis').createClient();
}

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: process.env.CLIENT_SECRET || 'd0ughb0y',
        store: new RedisStore({
            client: redis
        })
    }));
    app.use(require('stylus').middleware({ src: __dirname + '/public' }));
    app.use(express.static(__dirname + '/public'));
    app.use(app.router); // We have to place our router after our static directory, otherwise it won't pass
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});



// Authentication
app.get('/login', auth_routes.index);
app.post('/login', auth_routes.login);


var validate = function(req, res, next){
    if(req.params[0] !== '/favicon.ico' && (!req.session.customer || req.session.customer.customerID === 0)){
      res.redirect('/login');
    }else{
      next();
    }
};

// Check for authentication on every request
app.get('*', validate);


// Available routes once authed
app.get('/upload', global_routes.upload);
app.post('/upload', global_routes.do_upload);
app.get('/:page?/:count?', global_routes.index);


app.listen(process.env.PORT || 3001);
console.log("Express server listening on port %d in %s mode", process.env.PORT || app.address().port, process.env.NODE_ENV || app.settings.env);

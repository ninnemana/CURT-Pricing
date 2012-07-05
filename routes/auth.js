var Customer = require('../models/Customer');

exports.index = function(req, res){
	var error = (req.query['error'])?req.query['error']:'';
	if(req.session !== undefined){
		req.session.customer = {};
	}

	res.render('auth/index', { title: 'CURT Manufacturing, LLC Price Management', locals: { error: error } });
};

exports.login = function(req, res){
	var id = req.body.customerID,
		email = req.body.email;

	var cust = new Customer(id, email);
	cust.login(function(cust, msg){
		if(msg.length === 0){
			if(cust !== null && cust.customerID > 0){
				req.session.customer = cust;
				res.redirect('/');
			}else{
				res.redirect('/login?error=Login information was incorrect');
				res.end();
			}
		}else{
			res.redirect('/login?error=' + msg);
			res.end();
		}
	});
};

exports.logout = function(req, res){
	if(req.session.customer){
		req.session.customer = null;
		res.redirect('/login');
	}
};
var Customer = require('../models/Customer'),
	csv = require('csv');


exports.index = function(req, res){
	var cust = new Customer(req.session.customer.customerID, req.session.customer.email),
		result_count = req.params.count || 500;

	if(result_count < 200){ result_count = 200; }
	cust.key = req.session.customer.key;


	cust.getPricing(function(prices){
		var start = 0,
			page = req.params.page || 1,
			pages = Math.ceil(prices.length / result_count);

		start = ((result_count * page) - result_count);
		res.render('index', {
			title: 'CURT Manufacturing, LLC Price Management',
			locals: {
				prices: prices.slice(start, start + 1000),
				customer: cust,
				pages: pages,
				page: page
			}
		});
	});
};

exports.upload = function(req, res){
	res.render('upload',{
		title: 'CURT Manufacturing, LLC Price Management Mass Upload'
	});
};


exports.do_upload = function(req, res){
	csv().fromPath(req.files.file.path).transform(function(data){
		data.unshift(data.pop());
		return data;
	}).on('data',function(data,index){
		if(!isNaN(data[0])){
			console.log(JSON.stringify(data));
		}
	}).on('end',function(count){
		console.log('Number of lines: ' + count);
	}).on('error',function(error){
		console.log(error.message);
	});
	res.end();
};
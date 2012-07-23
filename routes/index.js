var Customer = require('../models/Customer'),
	http = require('http'),
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
	var error = "",
		count = 0,
		i = 0;
	try{

		var key = req.session.customer.key,
			prices = [];

		csv().fromPath(req.files.file.path).transform(function(data){
			count = data.length;
			if(data[0].length === 0){
				data.splice(0,1);
				return data;
			}else{
				return data;
			}
		}).on('data',function(data,index){
			prices.push(data);
		}).on('end',function(count){
			console.log(prices);
			for(i = 0; i < prices.length; i++){
				var cust = new Customer(),
					data = prices[i];
				if(!isNaN(data[0]) && data[0] !== undefined && data[0].length > 0){
					cust.processMassRow(data, req.session.customer);
				}
				console.log(prices.length, i);
				if(i === prices.length - 1){
					console.log('attempting redirect');
					res.redirect('/');
				}
			}
		}).on('error',function(error){
			//res.redirect('/upload?error=' + error.message);
			error += error.message;
			console.log(error);
		});
		
	}catch(e){ }
};

exports.get_csv = function(req, res){
	var cust = new Customer(req.session.customer.customerID, req.session.customer.email);
	cust.key = req.session.customer.key;
	var stream = 'CURT Part ID,Customer Part ID, Price, Sale Start, Sale End\n';
	cust.getPricing(function(prices){
		csv().from(prices)
		.transform(function(data,index){
			stream += data.partID + ',' + data.custPartID + ',' + data.price + ',';
			if(data.isSale === 0){ // Not Sale
				stream += ',\n';
			}else{ // Is Sale
				stream += data.sale_start + ',' + data.sale_end + '\n';
			}
			
		}).on('end',function(count){
			console.log(count, process.stdout);
			res.contentType('text/csv');
			res.header("Content-Disposition", "attachmentl;filename=data.csv");
			res.write(stream);
			res.end();
		}).on('error',function(error){
			console.log(error);
		});
	});
};

function Exception(message){
	this.message = message;
}
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
	var error = "",
		count = 0,
		i = 0,
		t = process.hrtime();
	try{
		var key = req.session.customer.key;
		csv().fromPath(req.files.file.path).transform(function(data){
			count = data.length;
			if(data[0].length === 0){
				data.splice(0,1);
				return data;
			}else{
				return data;
			}
		}).on('data',function(data,index){
			var cust = new Customer();
			var price, req_data;
			if(!isNaN(data[0])){
				price = {
					partID: data[0],
					custPartID: data[1],
					price: data[2],
					sale_start: data[3],
					sale_end: data[4]
				};

				req_data = {
					customerID: req.session.customer.customerID,
					key: key,
					partID: price.partID,
					customerPartID: (price.custPartID.length === 0)?0:price.custPartID,
					price: price.price,
					isSale: (price.sale_start !== null && price.sale_start.length > 0 && price.sale_end !== null && price.sale_end.length > 0)? 1: 0,
					sale_start: price.sale_start,
					sale_end: price.sale_end
				};
				cust.submitPrice(req_data,function(resp){
					if(resp.length > 0){
						new Error(resp);
					}
				});
				cust.submitIntegration(req_data,function(resp){
					if(resp.length > 0){
						new Error(resp);
					}
					i++;
					if(i === count){
						t = process.hrtime(t);
						console.log('benchmark took %d seconds', t[0]);
						res.redirect('/');
					}
				});
			}
		}).on('end',function(count){

		}).on('error',function(error){
			//res.redirect('/upload?error=' + error.message);
			error += error.message;
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
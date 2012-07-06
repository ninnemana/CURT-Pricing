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
			return data;
		}).on('data',function(data,index){
			var cust = new Customer();
			var price, req_data;
			if(!isNaN(data[0])){
				if(data[0].length === 0){
					price = {
						partID: data[1],
						custPartID: data[2],
						list: data[3],
						override: data[4],
						sale: data[5],
						sale_start: data[6],
						sale_end: data[7]
					};

					req_data = {
						customerID: req.session.customer.customerID,
						key: key,
						partID: price.partID,
						customerPartID: (price.custPartID.length === 0)?0:price.custPartID,
						price: (price.sale.length > 0 && parseInt(price.sale,0) !== 0)? price.sale: price.override,
						isSale: (price.sale.length > 0 && parseInt(price.sale,0) !== 0)? 1: 0,
						sale_start: price.sale_start,
						sale_end: price.sale_end
					};
					cust.submitPrice(req_data,function(resp){
						console.log(index, count,resp);
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
				}else{
					price = {
						partID: data[0],
						custPartID: data[1],
						list: data[2],
						override: data[3],
						sale: data[4],
						sale_start: data[5],
						sale_end: data[6]
					};
					req_data = {
						customerID: req.session.customer.customerID,
						key: key,
						partID: price.partID,
						customerPartID: (price.custPartID.length === 0)?0:price.custPartID,
						price: (price.sale.length > 0 && parseInt(price.sale,0) !== 0)? price.sale: price.override,
						isSale: (price.sale.length > 0 && parseInt(price.sale,0) !== 0)? 1: 0,
						sale_start: price.sale_start,
						sale_end: price.sale_end
					};

					cust.submitPrice(req_data,function(resp){
						console.log(index, count,resp);
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
			}
		}).on('end',function(count){

		}).on('error',function(error){
			//res.redirect('/upload?error=' + error.message);
			error += error.message;
		});
	}catch(e){
		
	}
};

function Exception(message){
	this.message = message;
}
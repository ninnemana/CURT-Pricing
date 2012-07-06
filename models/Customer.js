

var http = require('http'),
	qs = require('querystring'),
	request = require('request');



var Customer = function(id, email){
	this.customerID = id;
	this.email = email;
	this.name = '';
	this.key = '';
	this.website = '';
};

Customer.prototype = {
	login: function(callback){
		var data = qs.stringify({
			'customerID': this.customerID,
			'email': this.email
		});

		var opts = {
			host: 'api.curtmfg.com',
			port: '80',
			path: '/v2/GetCustomer',
			method: 'POST',
			headers:{
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		};

		var req = http.request(opts,function(res){
			var str = '';
			res.on('data',function(chunk){
				str += chunk;
			});

			res.on('end',function(){
				if(res.statusCode === 200){
					callback(JSON.parse(str), '');
				}else{
					callback({}, 'Failed to login');
				}
			});
		}).on('error',function(e){
			callback({}, e.message);
		});
		req.write(data);
		req.end();

	},
	getPricing: function(callback){
		var data = qs.stringify({
			'customerID': this.customerID,
			'key': this.key
		});

		var opts = {
			host: 'api.curtmfg.com',
			port: 80,
			path: '/v2/GetPricing?customerID=' + this.customerID + '&key=' + this.key
		};


		var req = http.get(opts,function(res){
			var str = '';
			res.on('data',function(chunk){
				str += chunk;
			});

			res.on('end',function(){
				var prices = JSON.parse(str);

				callback(prices);
			});
		}).on('error',function(e){

			callback([]);
		}).end();
	},
	submitPrice: function(price,callback){
		var data = qs.stringify({
			'customerID': price.customerID,
			'key': price.key,
			'partID': price.partID,
			'price': price.price,
			'isSale': price.isSale,
			'sale_start': price.sale_start,
			'sale_end': price.sale_end
		});
		var opts = {
			host: 'api.curtmfg.com',
			port: '80',
			path: '/v2/SetPrice',
			method: 'POST',
			headers:{
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		};

		var req = http.request(opts, function(res){
			var str = '';
			res.on('data',function(chunk){
				str += chunk;
			});
			res.on('end',function(){
				if(res.statusCode === 200){
					callback(str);
				}else{
					callback('Failed to submit record');
				}
			});
		}).on('error',function(e){
			error = e.message;
			callback(error);
		});
		req.write(data);
		req.end();
	},
	submitIntegration: function(price,callback){
		var data = qs.stringify({
			'customerID': price.customerID,
			'key': price.key,
			'partID': price.partID,
			'customerPartID': price.customerPartID
		});
		var opts = {
			host: 'api.curtmfg.com',
			port: '80',
			path: '/v2/SetCustomerPart',
			method: 'POST',
			headers:{
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		};

		var req = http.request(opts, function(res){
			var str = '';
			res.on('data',function(chunk){
				str += chunk;
			});
			res.on('end',function(){
				if(res.statusCode === 200){
					callback(str);
				}else{
					callback('Failed to submit record');
				}
			});
		}).on('error',function(e){
			error = e.message;
			callback(error);
		});
		req.write(data);
		req.end();
	},
	processMassRow: function(data, customer){
		var price = {
			partID: data[0],
			custPartID: data[1],
			price: (data[2] !== undefined)? data[2] : 0,
			sale_start: (data[3] !== undefined)? data[3] : '',
			sale_end: (data[4] !== undefined)? data[4] : ''
		};

		var req_data = {
			customerID: customer.customerID,
			key: customer.key,
			partID: price.partID,
			customerPartID: (price.custPartID.length === 0)?0:price.custPartID,
			price: price.price,
			isSale: (price.sale_start !== null && price.sale_start.length > 0 && price.sale_end !== null && price.sale_end.length > 0)? 1: 0,
			sale_start: price.sale_start,
			sale_end: price.sale_end
		};

		var price_data = qs.stringify({
			'customerID': req_data.customerID,
			'key': req_data.key,
			'partID': req_data.partID,
			'price': req_data.price,
			'isSale': req_data.isSale,
			'sale_start': req_data.sale_start,
			'sale_end': req_data.sale_end
		});
		
		request({
			method: 'POST',
			url: 'http://api.curtmfg.com/v2/SetPrice',
			headers: {'content-type': 'application/x-www-form-urlencoded'},
			pool: 0,
			body: price_data
			},function(err, res, body){
				if(err || res.statusCode !== 200){
					console.log(err);
					new Error(err);
				}else{
					console.log(body);
				}
			}
		);

		var iteg_data = qs.stringify({
			'customerID': req_data.customerID,
			'key': req_data.key,
			'partID': req_data.partID,
			'customerPartID': req_data.customerPartID
		});
		request({
			method: 'POST',
			url: 'http://api.curtmfg.com/v2/SetCustomerPart',
			headers: {'content-type': 'application/x-www-form-urlencoded'},
			pool: 0,
			body: iteg_data
			},function(err, res, body){
				if(err || res.statusCode !== 200){
					console.log(err);
					new Error(err);
				}else{
					console.log(body);
				}
			}
		);
	}
};

module.exports = Customer;
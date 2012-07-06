var http = require('http'),
	qs = require('querystring');

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
	}
};

module.exports = Customer;
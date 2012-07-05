var Price = function(){},
	showError = function(msg){},
	createProgress = function(percent, progress){},
	price = {};

$(function(){

	price = new Price();
	price.key = $('.key').val();
	price.cust_id = $('.customerID').val();

	$('.tipsy').tipsy({gravity: $.fn.tipsy.autoNS});

	$(document).on('click','.price',function(){
		price.partID = parseInt($(this).closest('tr').find('td:first').text(),0);
		price.price = parseFloat($(this).parent().find('span').text().replace('$',''));
		price.modifyPrice();
	});

	$(document).on('click','.addSale',function(){
		try{
			price.partID = parseInt($(this).closest('tr').find('td:first-child').text(), 0).toFixed(0);
			price.custPartID = parseInt($(this).closest('tr').find('input.custPartID').val(), 0).toFixed(0);
			price.price = parseFloat($(this).closest('tr').find('td:nth-child(3) span').text().replace('$','')).toFixed(2);
			price.addSale();
		}catch(e){
			showError('Error while processing request.', "BASE");
		}
	});

	$(document).on('click','.editSale',function(){
		try{

			price.partID = parseInt($(this).closest('tr').find('td:first-child').text(), 0).toFixed(0);
			price.custPartID = parseInt($(this).closest('tr').find('input.custPartID').val(), 0).toFixed(0);
			price.price = parseFloat($(this).closest('tr').find('td:nth-child(3) span').text().replace('$','')).toFixed(2);
			price.sale_start = $(this).closest('tr').find('td:nth-child(5)').text();
			price.sale_end = $(this).closest('tr').find('td:nth-child(6)').text();

			var nonsale = parseFloat($('#'+ price.partID).find('td:nth-child(3) span').text().replace('$','')).toFixed(0);
			price.editSale(nonsale);
		}catch(e){
			showError('Error while processing request.', "BASE");
		}
	});

	$('#priceModal').on('hide',function(){
		$(this).find('input.custPrice').val('');
		$('#priceModal').find('h3').find('span').text('');
		$(this).find('div.pricing div.progress, div.pricing table').remove();
		price.reset();

	});

	$('#saleModal').on('hide',function(){
		$.each($('#saleModal').find('input[type=number]'),function(i,input){
			$(this).val('');
		});
		$('#saleModal div.alert').remove();
	});

	$(document).on('click','#priceModal div.pricing table.table tr',function(){
		try{
			var price_point = parseFloat($(this).find('td:nth-child(2)').text().replace('$',''));
			$('#custPrice').val(price_point);
		}catch(e){
			showError(e.message, "MODAL");
		}
	});

	$(document).on('click','#priceModal div.modal-footer a.save',function(e){
		e.preventDefault();
		try{
			price.price = parseFloat($('#priceModal #custPrice').val().replace('$',''));
			if(confirm('Are you sure you want to set the price for Part #' + price.partID + ' to $' + price.price + '?')){
				price.setPrice();
				$('#priceModal div.modal-footer').prepend(createProgress(30,100));
			}
		}catch(e){
			showError(e.message, "MODAL");
		}
	});

	$(document).on('click','#saleModal div.modal-footer a.save',function(e){
		e.preventDefault();
		try{
			price.price = $('#salePrice').val();
			var start_month = $('#start_month').val(),
				start_day = $('#start_day').val(),
				start_year = $('#start_year').val(),
				end_month = $('#end_month').val(),
				end_day = $('#end_day').val(),
				end_year = $('#end_year').val();

			price.sale_start = new Date(start_month + '/' + start_day + '/' + start_year).toDateString(),
			price.sale_end = new Date(end_month + '/' + end_day + '/' + end_year).toDateString();

			price.saveSale(function(success){
				if(success){
					if($('tr#' + price.partID + '_sale').get().length > 0){
						var row = $('tr#' + price.partID + '_sale');
						$(row).find('td:nth-child(3) span').text('$' + price.price);
						$(row).find('td:nth-child(5)').text(price.sale_start);
						$(row).find('td:nth-child(6)').text(price.sale_end);
					}else{
						$('tr#' + price.partID).after(price.createRow());
					}
					price.reset();
					$('#saleModal').modal('close');
				}
			});
		}catch(e){
			showError(e.message, "MODAL");
		}
	});

	$(document).on('click','#saleModal div.modal-footer a.delete',function(e){
		e.preventDefault();
		try{
			price.deleteSale(function(error){
				if(error !== undefined && error.length > 0){
					throw error;
				}else{
					$('tr#' + price.partID + '_sale').remove();
					price.reset();
					$('#saleModal').modal('hide');
				}
			});
		}catch(e){
			showError('Error while processing request: ' + e.message);
		}
	});

	$(document).on('blur','.custPartID',function(){
		var that = this;
		$(that).addClass('warning');
		price.partID = $(that).data('partid');
		price.custPartID = $(that).val();
		console.log(price);
		price.setCustomerPartID(function(success){
			if(success){
				$(that).removeClass('warning').addClass('success');
				
				setTimeout(function(){
					$(that).removeClass('success');
				}, 3000);
			}else{
				$(that).removeClass('warning').addClass('error');
			}
		});
	});

	showError = function(msg, type){

		var html = '<div class="alert alert-error">';
			html += '<a class="close" data-dismiss="alert" href="#">x</a>';
			html += '<h4 class="alert-heading">Warning!</h4>';
			html += 'Error processing your request: ' + msg;
			html += '</div>';

		switch(type.toUpperCase()){
			case "BASE":
				$('div.page-menu div.alert').remove();
				$('div.page-menu').prepend(html);

				break;
			case "MODAL":
				$('div.modal-body div.alert').remove();
				$('div.modal-body').prepend(html);
				$('div.modal').css({
					width: 'auto',
					maxWidth: '800px',
					'margin-left': function(){
						return -($(this).width() / 2);
					}
				});

				break;
			default:
				break;
		}
	};

	createProgress = function(percent,progress){
		if(progress === undefined){
			progress = 100;
		}
		if(percent === undefined){
			percent = 100;
		}
		var html = '<div class="progress progress-striped active" style="width:' + percent + '%;float:left">';
			html += '<div class="bar" style="width: ' + progress + '%;"></div>';
			html += '</div>';

		return html;
	};

	parseDatetoJS = function(date){
		var date_parts = date.split(' ');

		if($.trim(date_parts[1]).length === 0){
			date_parts.splice(1,1);
		}
		return new Date(date_parts[2], monthNum(date_parts[0]), parseInt(date_parts[1],0));
	};

	monthNum = function(month){
		var nums = {"Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06", "Jul" : "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"};
		return nums[month];
	};
});

Price.prototype = {
	key: 0,
	cust_id: 0,
	partID: 0,
	custPartID: 0,
	price: 0,
	isSale: 0,
	sale_start: new Date().toDateString(),
	sale_end: new Date().toDateString(),
	modifyPrice: function(){
		var that = this;

		$('div.modal input.custPrice').val(that.price);
		$('#priceModal').find('h3').find('span').text(that.partID);
		$('#priceModal').modal().css({
			width: 'auto',
			'margin-left': function(){
				return -($(this).width() / 2);
			}
		});

		$.ajax({
			url: 'http://api.curtmfg.com/v2/GetPart?dataType=jsonp&partID=' + that.partID + '&callback=?',
			type: 'get',
			dataType: 'jsonp',
			success: function(part, textStatus, xhr){
				if(part.pricing){
					var html = '<table class="table"><tbody>';
					html += '<tr><td>Current</td><td>$' + parseFloat(that.price).toFixed(2) + '</td></tr>';
					$.each(part.pricing,function(i, price){
						html += '<tr><td>' + price.key + '</td><td>$' + parseFloat(price.value).toFixed(2) + '</td></tr>';
					});
					html += '</tbody></table>';
					$('div.pricing div.progress, div.pricing table').remove();
					$('div.pricing h4').after(html);
				}
			}
		});
	},
	setPrice: function(){
		var that = this;
		$.ajax({
			url: 'http://api.curtmfg.com/v2/SetPrice',
			type: 'POST',
			dataType: 'json',
			data: {
				'dataType':'json',
				'partID':that.partID,
				'customerID': that.cust_id,
				'key':that.key,
				'price':that.price
			},
			success: function(resp, textStatus, xhr){
				if(resp.cust_id !== undefined){
					$('#' + resp.partID).find('td:nth-child(3) span').text('$' + resp.price);
					$('#priceModal').modal('hide');
				}else{
					showError(resp, "MODAL");
				}
				$('div.progress').remove();
			},
			error: function(xhr, status, error){
				showError(error, "MODAL");
				$('div.progress').remove();
			}
		});

		$('div.modal input.custPrice').val(that.price);
		$('#priceModal').find('h3').find('span').text(that.partID);
		$('#priceModal').modal().css({
			width: 'auto',
			'margin-left': function(){
				return -($(this).width() / 2);
			}
		});
	},
	setCustomerPartID: function(callback){
		var that = this;
		$.ajax({
			url: 'http://api.curtmfg.com/v2/SetCustomerPart',
			type: 'POST',
			dataType: 'json',
			data: {
				'customerID': price.cust_id,
				'key': price.key,
				'partID': price.partID,
				'customerPartID': price.custPartID
			},
			success:function(resp, status, xhr){
				if(resp.custPartID !== undefined){
					callback(true);
				}else{
					showError('Error while assigning Customer Part # for Part #' + that.partID, "MODAL");
					callback(false);
				}
			},
			error: function(xhr, status, error){
				showError('Error while assigning Customer Part # for Part #' + that.partID + '\r\n\n' + error, "MODAL");
				callback(false);
			}
		});
	},
	addSale: function(){
		var that = this;

		$('#saleModal').find('h3').find('span').text(that.partID);
		$('#saleModal div.modal-header em').text('$' + that.price);
		$('#saleModal').modal().css({
			width: 'auto',
			'margin-left': function(){
				return -($(this).width() / 2);
			}
		});
	},
	editSale: function(nonsale){
		var that = this;

		$('#saleModal').find('h3').find('span').text(that.partID);
		$('#saleModal div.modal-header em').text('$' + nonsale);
		$('#saleModal input#salePrice').val(price.price);

		var start = parseDatetoJS(price.sale_start),
			end = parseDatetoJS(price.sale_end);

		$('#start_month').val(start.getMonth());
		$('#start_day').val(start.getDate());
		$('#start_year').val(start.getFullYear());

		$('#end_month').val(end.getMonth());
		$('#end_day').val(end.getDate());
		$('#end_year').val(end.getFullYear());

		$('#saleModal a.delete').show();
		$('#saleModal').modal().css({
			width: 'auto',
			'margin-left': function(){
				return -($(this).width() / 2);
			}
		});
	},
	saveSale: function(callback){
		var that = this;
		$.ajax({
			url: 'http://api.curtmfg.com/v2/SetCustomerPartAndPrice',
			type: 'POST',
			dataType: 'json',
			data: {
				'customerID': that.cust_id,
				'partID': that.partID,
				'customerPartID': that.custPartID,
				'key': that.key,
				'price': that.price,
				'isSale': 1,
				'sale_start': that.sale_start,
				'sale_end': that.sale_end
			},
			success: function(resp, status, xhr){
				if(resp[1] !== undefined && resp[1].partID !== undefined){
					$('#saleModal').modal('hide');
					callback(true);
				}else{
					showError('Error while saving sale for Part #' + that.partID + '<br />' + resp, "MODAL");
					callback(false);
				}
			},
			error: function(xhr, status, error){
				callback(false);
				showError('Error while saving sale for Part #' + that.partID + '<br />' + error, "MODAL");
			}
		});
	},
	deleteSale: function(callback){
		var that = this;
		$.ajax({
			url: 'http://api.curtmfg.com/v2/RemoveSale',
			type: 'POST',
			dataType: 'json',
			data: {
				'key': price.key,
				'customerID': price.cust_id,
				'partID': price.partID,
				'price': price.price
			},
			success: function(data, status, xhr){
				if(data === null || data.length === 0){
					callback();
				}else{
					callback(data);
				}
			},
			error: function(xhr, status, error){
				callback(error);
			}
		});
	},
	createRow: function(){
		var html = '<tr id="11000">';
			html += '<td>'+price.partID + '</td>';
			html += '<td><input type="number" data-partid="' + price.partID + '" value="' + price.custPartID + '" class="custPartID"></td>';
			html += '<td><span>$' + price.price + '</span><i class="icon-info-sign icon-large price tipsy" original-title="Change Price"></i></td>';
			html += '<td>Yes<i class="icon-edit icon-large editSale tipsy" original-title="Edit Sale"></i></td>';
			html += '<td>' + price.sale_start + '</td>';
			html += '<td>' + price.sale_end + '</td>';
			html += '</tr>';

		return html;
	},
	reset: function(){
		this.partID = 0;
		this.price = 0;
		this.isSale = 0;
		this.sale_start = new Date().toDateString();
		this.sale_end = new Date().toDateString();
	}
};
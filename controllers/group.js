var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var fs = require('fs');
var mime = require('mime');
var database = require('../config/database'); 
//var nodemailer = require('nodemailer');

//var db = mongoose.connect(database.url);

	
var groups = mongoose.Schema({
	name : String,
	userids : String,
	description : String,
	count  : Number
	
});	
	
var usergroup = mongoose.model('usergroup',groups);	
	
	
	
var bookshema = mongoose.Schema({
	name : String,
	manager : String,
	startdate : Date,
	enddate	: Date,
	term : String
	
//starttime : Timestamp,
	//endtime	: Timestamp
	
});	
	

exports.creategroup=function(req,res){
	var grpname =  req.param('name');
	var useriemailids = req.param('userids');
	var descriptiont = req.param('description');
	var counts = req.param('count');

	usergroup.find({name:grpname},function(err,record){
		console.log(record);
		if  (record.length==0){
			var agroup = new usergroup({ 	
				name : grpname,
				userids : useriemailids,
				description : descriptiont,
				count	: counts
				});
			
			agroup.save(function(err, agroup) {
			if (err) 
				res.json({ok:false});
			else
				res.json({ok:true});
			});		

		}
		else{
				res.json({ok:false});
			
		}
	});
		
	
	
	
};

	
exports.viewgroup=function(req,res){
	usergroup.find({},function(err,records){
		console.log(records);
            res.json(records);
			if (err) return handleError(err);
		})
	};
	
exports.updategroup=function(req,res){
	
	var grpname =  req.param('name');
	var useriemailids = req.param('userids');
	var descr = req.param('description');
	var counts = req.param('count');
	var updaterec= {
		name : grpname,
		userids : useriemailids,
		description : descr,
		count	: counts
	}
	//var grp_id = req.param("id");
	var grp_id = '57a18460e7f97e500db030d8';
	
	usergroup.update({_id: grp_id},updaterec,function(err,noAffected){
					console.log(noAffected);
					if (err) return handleError(err);
	
	})
	};

	
exports.deletegroup=function(req,res){
	
	var grp_id = req.param("id");
	//var grp_id = '57a1af331decb5780cb80f4f';
	
	usergroup.remove({_id: grp_id},function(err,record){
						if (err) return handleError(err);
						//record.remove();
				})
	};
	
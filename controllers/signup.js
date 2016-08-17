var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var fs = require('fs');
var mime = require('mime');
var database = require('../config/database'); 
var nodemailer = require('nodemailer');

//var db = mongoose.connect(database.url);



var usertableschema = mongoose.Schema({
	name : String,
	password : String
	});	
	
var loginuser = mongoose.model('user',usertableschema);
	
	
var bookshema = mongoose.Schema({
	name : String,
	manager : String,
	startdate : Date,
	enddate	: Date,
	term : String
	
//starttime : Timestamp,
	//endtime	: Timestamp
	
});	
	
var hallbook = mongoose.model('hallbook',bookshema);	
	
/* exports.store=function(req,res){
    var name=req.param('name');
	 var passwd=req.param('password');
    console.log('hello');

   var silence = new loginuser({ name: name ,password:passwd});
	console.log(silence.name); 
	silence.save(function(err, silence) {
		if (err) return console.error(err);
		console.dir(silence);
	};
}; */

exports.store=function(req,res){
	var name=req.param('name');
	var passwd=req.param('password');
	console.log('body: ' + JSON.stringify(req.body));
	var silence = new loginuser({ name: name ,password:passwd});
	silence.save(function(err, silence) {
		if (err) 
			return console.error(err);
		else
			res.json({ok:true});
	});
	
};


exports.login = function(req, res) {
	var username = req.param('name');
	var passwo= req.param('password');
	var session = req.session;
	loginuser.find({ name: username,password : passwo }, function (err, docs) {
	res.json(docs);
        });
			
};

	
	

exports.book = function(req, res) {
	var username =  req.param('name');
	var sarr = req.param('stime').split(":");
	var earr = req.param('etime').split(":");
	var sdate  =  new Date(req.param('startdate'));
	var edate  = new Date(req.param('enddate'));
	var mname = req.param('username');
	var term = req.param('term');
	sdate.setHours(sarr[0]);
	sdate.setMinutes(sarr[1]);
	edate.setHours(earr[0]);
	edate.setMinutes(earr[1]);
	exports.CheckAvailability(username,sdate,edate, function(result){
		
	var haa = new hallbook({ 	name : username,
		manager : mname,
		startdate : sdate,
		enddate	: edate,
		term	:	term
		});
	
//		console.log("showing result");
		console.log(result);
		if(result){
			haa.save(function(err, haa) {
				if (err) 
					return console.error(err);
				else
					res.json({ok:true});
			});
		}
		else{
			res.json({ok:false});
		}

	});

};

exports.latedelete=function(){
	console.log("coming");
};



exports.testing= function(req,res) {
		setTimeout(function(){
			console.log("timed out");
		},10000)
		
		 hallbook.find({ name: 'Five' }, function (err, docs) {
//			 set
			 res.json(docs);
         });

};

exports.CheckAvailability= function(hallname,sdate,edate, callback) {
	var d= hallbook.find({ name: hallname,enddate: { $gte : sdate}}, function (err, docs) {
		var l_status = true;
//		console.log((docs[0].startdate.nextweek()));
		for(var i=0;i<docs.length;i++){
			if(docs[i].term=='Day'){
				if((sdate.getHours() <= docs[i].enddate.getHours()) && (sdate.getHours() >= docs[i].startdate.getHours())) {
					if ((sdate.getMinutes() <= docs[i].enddate.getMinutes())  && (sdate.getMinutes() >= docs[i].startdate.getMinutes())){
						l_status = false;
					}
				}
			}
			else if(docs[i].term='Week'){
				if(docs[i].startdate==sdate){
					if ((sdate.getMinutes() <= docs[i].enddate.getMinutes())  && (sdate.getMinutes() >= docs[i].startdate.getMinutes())){
						l_status = false;
					}
				}
				else{
//					var nextweekdate =  new Date(docs[i].startdate.getTime() + 7 * 24 * 60 * 60 * 1000);
					while(sdate <= nextweekdate){
						if(sdate==nextweekdate){
							if ((sdate.getMinutes() <= docs[i].enddate.getMinutes())  && (sdate.getMinutes() >= docs[i].startdate.getMinutes())){
								l_status = false;
							}
						}
						nextweekdate =  new Date(docs[i].startdate.getTime() + 7 * 24 * 60 * 60 * 1000);
					}
				}
					
			}
			
			else{
				while(sdate <= now){
					if(sdate==now){
						if ((sdate.getMinutes() <= docs[i].enddate.getMinutes())  && (sdate.getMinutes() >= docs[i].startdate.getMinutes())){
								l_status = false;
						}
					}
					var now = docs[i].startdate;
					var thisMonth = now.getMonth();
					now.setMonth(thisMonth+1);
					if(now.getMonth() != thisMonth+1 && now.getMonth() != 0)
					now.setDate(0);

				}
			}
		}
		callback(l_status);
    });
	};

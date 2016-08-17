var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var fs = require('fs');
var mime = require('mime');
var database = require('../config/database'); 

	
var configurations = mongoose.Schema({
	userquota : Number,// in GB
	filesizelimit : Number, // in MB
	deletetime	: Number, // in hrs
	supportedfilext : [], // vector
	restrictwords	: [],
	lifeofunsharedfiles	: Number // in days
});	
	
var config = mongoose.model('configurations',configurations);	
	
	
exports.createconfig=function(req,res){
	
	var q=req.body.userquota;
	var livetodelete = req.body.lhtd;
	var filesize = req.body.fs;
	var fileextension = req.body.fileExtensions;
	var restricwords = req.body.Restricted
	var fsl
	var aconfig = new config({ 	
		userquota : 10,// in GB
		filesizelimit : 20, // in MB
		deletetime	: 1, // in hrs
		supportedfilext : [], // vector
		restrictwords	: [],
		lifeofunsharedfiles	: 1
	});
	
	aconfig.save(function(err, aconfig) {
	if (err) 
		res.json({ok:false});
	else
		res.json({ok:true});
	});		
};

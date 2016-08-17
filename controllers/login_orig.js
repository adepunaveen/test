var MongoClient = require('mongodb').MongoClient, Server = require('mongodb').Server, db;
var collection;
var authCollection;
var GeoJSON = require('geojson');
var mailer = require("nodemailer");
/*var mongoClient = new MongoClient(new Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
	db = mongoClient.db("repository");
	collection = db.collection("login");
});*/
// var util = require('util');
// ObjectID = require('mongodb').ObjectID;

exports.getRecord = function(req, res) {
	var reqname=req.param('name');
 collection.find({name:reqname}).toArray(function(err, rec) {
		if(err)
		{
			res.send(200,"No FIle found");
		}
		else
		{
			console.log(rec);
			res.send(rec);

		}
    });
}

exports.login = function(req, res) {
	var username = req.param('username');
	var password= req.param('password');
	console.log(password);
	collection.find({username:username,password:password}).toArray(function(err, rec) {
		
		if (err) {
			res.send(500, {error : "Failed to login!"});
		} else {
			if(rec!=''){
				res.send(200, "success");
			}
			else{
				res.send("unsuccess");
			}
			
		}
		});
	}










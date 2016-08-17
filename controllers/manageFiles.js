var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var fs = require('fs');
var Grid = require('gridfs-stream');
var mime = require('mime');
var database = require('../config/database'); 
var nodemailer = require('nodemailer');

var db = mongoose.connect(database.url);

Grid.mongo = mongoose.mongo;
var gfs = new Grid(mongoose.connection.db);

var dataFiles = mongoose.model('fs.files', {
    text : String
});

var sessionSchema = mongoose.Schema({
    	session: String,
    	expires: Date
	});
	
var session = mongoose.model('Session',sessionSchema);

var shareFiles = mongoose.model('ShareFiles', {
    filename : String,
    userid : String,    
    username: String,
    parent: String,
    role: String    
    });

var testdataschema = mongoose.Schema({
	name : String,
	address : String
	});	
	
var testdata = mongoose.model('testdata',testdataschema);
	
var user;

exports.getFiles = function(req, res) {

    var folderId = req.params.folder; 

    if (folderId == "undefined") {
        dataFiles.find({'metadata.parentId': null}, function(err, files) {
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)
        res.json(files); 
    });
    } else {
        dataFiles.find({'metadata.parentId': folderId}, function(err, files) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
            res.json(files); 
        });
    }   
    
};

exports.getParentFolder = function(req, res) {

    var folderId = req.params.folder;   

    dataFiles.find({_id: folderId}, function(err, files) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
            res.json(files); 
        });     
};

exports.getFolderFiles = function(req, res) {

    var path = './Repository';
    var files = [];

    var items = fs.readdirSync(path);

    for (var i = 0; i < items.length; i++) {
        var file = path + '/' + items[i];

        var stats = fs.statSync(file);

        var data = { name: items[i],
                     size: stats['size'],
                     type: mime.lookup(file) };

        files.push(data);
    };
    
    res.json(files);    
};

exports.deleteFile = function(req, res) {

    var parentId = req.body.parentId;
    var fileId = req.body.fileId;

    dataFiles.find({_id: fileId}, function(err, files) {

        var rec = JSON.stringify(files[0]);
        var file = JSON.parse(rec);

        gfs.remove({ _id: file._id }, function (err) {
            if (err) return handleError(err);

            if (file.metadata.type == 'folder') {
                removeSubStructure(fileId);
            };

            if (parentId == "undefined") {
                dataFiles.find({'metadata.parentId': null}, function(err, files) {

                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err)
                    res.json(files); 
                });
            } else {
                dataFiles.find({'metadata.parentId': parentId}, function(err, files) {

                    // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                    if (err)
                        res.send(err)
                    res.json(files); 
                });
            };
        });        
    });            
};

var removeSubStructure = function( fileId ) {

    dataFiles.find({'metadata.parentId': fileId}, function(err, files) {
        files
            .forEach(function(file){

                var sFile = JSON.stringify(file);
                var pFile = JSON.parse(sFile);

                gfs.remove({ _id: pFile._id }, function (err) {
                    if (err) return handleError(err);

                    if (pFile.metadata.type == 'folder') {
                        removeSubStructure(pFile._id);
                    }
                });                                                              
            });         
    });    
};

exports.deleteFolderFile = function(req, res) {

    var filepath = './Repository/' + req.params.file_name;
    fs.unlinkSync(filepath);

    var path = './Repository';
    var files = [];

    var items = fs.readdirSync(path);

    for (var i = 0; i < items.length; i++) {
        var file = path + '/' + items[i];

        var stats = fs.statSync(file);

        var data = { name: items[i],
                     size: stats['size'],
                     type: mime.lookup(file) };

        files.push(data);
    };
    
    res.json(files);        
};

exports.downloadFile = function(req, res) {

    var fileName = req.body.fileName;
    var fileId = req.body.fileId;

    var readstream = gfs.createReadStream({
            _id: fileId
        });

    const bufs = [];

    readstream.on('data', function (chunk) {
        bufs.push(chunk);
    });

    readstream.on('end', function () {

        const fbuf = Buffer.concat(bufs);
        const base64 = fbuf.toString('base64');

        var data = JSON.stringify ({
            data: base64,
            name: fileName
        });

        res.send(200,data);
    });
};

exports.searchFile = function(req, res) {

    var str = req.params.text.toLowerCase();
    var folderFiles = [];

    dataFiles.find( {'metadata.type': 'file'}, function(err, files) {

        var counter=0;
        files
            .forEach(function(file){
                
                var readstream = gfs.createReadStream(file);

                readstream.on('data', function (buffer) {
                    //console.log(Object.prototype.toString.call(file));
                    //console.log(Object.keys(file));
                    var sFile = JSON.stringify(file);
                    var pFile = JSON.parse(sFile);
                    if (pFile.filename.toLowerCase().indexOf(str) != -1 || buffer.toString().toLowerCase().indexOf(str) != -1) {
                        folderFiles.push(file);                          
                    }

                    counter=counter+1;

                    if(counter==files.length) {
                        res.json(folderFiles);
                    }                                                                       
                });                                               
            });                
    });
};

exports.searchFolders = function(req, res) {

    var str = req.params.text.toLowerCase();

    dataFiles.find( {'metadata.type': 'folder', filename: { $regex: str, $options: 'i' }}, function(err, files) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)
            
        res.json(files); 
    });
};

exports.uploadFile = function(req, res) {
    
    var origString = req.body.content;
    var fileName = req.body.name;
    var email = req.body.email;
    var user = req.body.user;
    var parentId = req.body.parentId;
    
    var formatString = new Buffer(origString, 'base64');//toString("ascii");

    var writeStream = gfs.createWriteStream({
        filename: fileName,
        
        mode: 'w',
        metadata: {
            owner: user,
            type: 'file',
            email: email,
            ownerId: 24,
            parentId: parentId
                   }
    }); 
    writeStream.on('close', function() {
        
        if (parentId == "undefined") {
            dataFiles.find({'metadata.parentId': null}, function(err, files) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                res.json(files); 
            });
        } else {
            dataFiles.find({'metadata.parentId': parentId}, function(err, files) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                res.json(files); 
            });
        };  
    });
    writeStream.write(formatString); 
    writeStream.end();
    
};

exports.getMyUploads=function(req,res){
    var email=req.param('email');
     dataFiles.find({"metadata.email":email},function(err, data) {
            if (err)
                res.send(err)
            res.json(data); 
        });

};


exports.createFolder = function(req, res) {
  
    var folderName = req.body.folder;
    var parentId = req.body.parentId;
    var email = req.body.email;
    var user = req.body.user;
  
    var writeStream = gfs.createWriteStream({
        filename: folderName,
        mode: 'w',
        metadata: {
            owner: user,
            type: 'folder',
            ownerId: 24,
            parentId: parentId,
            email: email
        }
    }); 
 
    writeStream.on('close', function() {

        if (parentId == "undefined") {
            dataFiles.find({'metadata.parentId': null}, function(err, files) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                res.json(files); 
            });
        } else {
            dataFiles.find({'metadata.parentId': parentId}, function(err, files) {

                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                res.json(files); 
            });
        };        
    });
                
    //writeStream.write(formatString); 
    writeStream.end();    
};

exports.getUser = function(req,res){
	console.log("getUser");
	var data = "";
	res.setHeader('Content-Type', 'application/json');
	session.find({},function(err,records){
        console.log("find");
		records.forEach(function(record){
			console.log("record");
			var rec = JSON.stringify(record.session);
            var ses = JSON.parse(rec);
            
            var user_id = JSON.parse(ses).userid;
            var user_name = JSON.parse(ses).username;
            
            console.log(user_name);
            if(user_id!=undefined && user_name!=undefined){
            	data = user_name;
            	user = user_name;
                console.log(user);
            	res.json(data);
            }
		})
	});
};

exports.sendEmail = function(req,res){

    var email = req.body.email;
    var user = req.body.user;

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        // host: 'smtp.office365.com',
        // port: 587,
        auth: {
            user: 'mmconnecktz@gmail.com',
            pass: 'mm@12345'
        }
    });

    var str1 = 'Dear ' + user + ',';
    var str2 = 'This is a test mail from Node.js';
    var str3 = 'Regards,';
    var str4 = 'MMConnect';
    var text = str1 + '\n\n' + str2 + '\n\n' + str3 + '\n' + str4;

    var mailOptions = { from: 'mmconnecktz@gmail.com', // sender address
                        to: email, // list of receivers
                        subject: 'Test Email', // Subject line
                        text: text //, // plaintext body
                        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead 
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            res.json({yo: 'error'});
        } else {
            console.log('Message sent: ' + info.response);
            res.json({yo: info.response});
        };
    });
};

exports.shareFile = function(req, res) {
        
    var fileName = req.body.filename;    
    var parentid = req.body.parentId; 
    var userId = 53;
    var role   = 'w';

    console.log('name'+fileName);
    console.log(parentid);
    console.log('user id-- ' +userId);
    
    if (parentid === "undefined") {
        parentid = null;
    }
    
    shareFiles.create({
        filename: fileName,
        userid: userId,
        parent: String(parentid),
        username: 'JC',
        role: role        
    });
};

exports.store=function(req,res){
    var email=req.param('name');
          console.log('hello');
	insertDocument();
};
var insertDocument = function(db, callback) {
	console.log(db);
   var silence = new testdata({ name: 'Silence' ,address:'sfdadsa'});
	console.log(silence.name); 
	silence.save(function(err, silence) {
	if (err) return console.error(err);
	console.dir(silence);
});
};

var express = require('express'),
    mongoose = require('mongoose'),
    database = require('./config/database'); 
	mongoStore = require('connect-mongo/es5')(express),
	manageFiles = require('./controllers/manageFiles'),
	login = require('./controllers/login');
	bodyParser = require('body-parser');
	signup = require('./controllers/signup');
	group = require('./controllers/group');
	configs = require('./controllers/config');
 
 var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin, Origin, Content-Type, Accept, Authorization, access_token, TS");
    next();
}

var app = express();
app.use(express.static('public'));
app.use( express.cookieParser() );

app.use(express.session({
	store: new mongoStore({
    	url: database.url,
    	clear_interval: 360
  	}),
  	
  	key:'app.sess',
  	resave: false,
    saveUninitialized: true,
  	cookie: {
  		secure: true,
  		maxAge: new Date(Date.now() + 3600)
  	},  	
	secret: 'magikmindsQWERTY'}));
	
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(allowCrossDomain);
//start edits
app.use(app.router); 
//end edits
app.get('/',function(req,res){
	if(!req.session.views){
		req.session.views = 1;
	}else {
		req.session.views +=1;
	}
	req.json({
		"status": "ok",
		"frequency":req.session.views
	});
});

 app.get('/login', function(req, res) {
    res.sendfile('app/index.html');
 });
 app.get('/creategroup', function(req, res) {
    res.sendfile('app/groups.html');
 });

 
 
//login
//app.post('/login',express.bodyParser(),login.login);

app.post('/signin',express.bodyParser(),signup.login);
app.post('/book',express.bodyParser(),signup.book);


//app.post('/testing',express.bodyParser(),signup.testing);
app.get('/testing',express.bodyParser(),signup.testing);


//My Custom Servics
app.post('/getFiles/:folder', manageFiles.getFiles);
app.post('/getFolderFiles/:folder', manageFiles.getFolderFiles);
app.post('/getParentFolder/:folder', manageFiles.getParentFolder);

app.post('/deleteFile', manageFiles.deleteFile);
app.delete('/deleteFolderFile/:file_name', manageFiles.deleteFolderFile);

app.post('/downloadFile', manageFiles.downloadFile);

app.post('/searchFile/:text', manageFiles.searchFile);
app.post('/searchFolders/:text', manageFiles.searchFolders);

app.post('/shareFile', manageFiles.shareFile);

app.post('/uploadFile', manageFiles.uploadFile);
app.get('/getMyUploads', manageFiles.getMyUploads);
app.post('/store',express.bodyParser(),signup.store);

app.post('/createFolder', manageFiles.createFolder);

app.post('/sendEmail', manageFiles.sendEmail);

app.get('/session',manageFiles.getUser);

app.post('/creategroup', group.creategroup);
app.post('/viewgroup', group.viewgroup);
app.post('/updategroup', group.updategroup);
app.post('/deletegroup', group.deletegroup);


app.post('/createconfig', configs.createconfig);
//app.get('/checkdelete', configs.checkdelete);

app.get('/logout',function(req,res){
	req.session.destroy();
})


app.listen(3001);
console.log('Listening on port 3001...');
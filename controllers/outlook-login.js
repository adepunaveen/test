
exports.login = function(req, res) {
	var username = req.param('username');
	var password= req.param('password');
	
	var session = req.session;
	
	var imap = new require('imap')({
		user: username,
		password: password,
		host: 'outlook.office365.com',
		port: 993,
		tls: true,
		tlsOptions: { rejectUnauthorized: false }//,
		//debug: console.log
	});
		
	imap.connect();
		
	imap.once('error', function(err) {
		res.send(200,"invalidinput");
	});
	
	imap.once('end', function() {
		console.log('Connection ended');
	});
		
	imap.once('ready', function() {
		if(imap.state != 'authenticated') { //So, I check here if the state is 'authenticated' to make sure, otherwise the execution fails at some point.
			imap.connect() //So, I try to make the connection again.
		}
		
		String.prototype.capitalize = function() {
    		return this.charAt(0).toUpperCase() + this.slice(1);
		}
		
		var name = username.capitalize().split(".")[0];
		var session = req.session;
		session.userid = username;
		session.username = name;
	
		var data = JSON.stringify ({
			result: "success",
			user: name,
			email:username
		});
		res.send(200,data);
			
	});
	
}










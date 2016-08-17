
exports.login = function(req, res) {
	var username = req.param('uname');
	var password= req.param('upassword');
	
	var session = req.session;
	
	var data = JSON.stringify ({
			result: "success",
			user: username,
			pwd:password
		});
		res.send(200,data);
			
	}
	











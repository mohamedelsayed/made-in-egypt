const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'sUG6akIrGG4T5eEGTc6Caau825btqttL1uPZlCqx';
const User = require('../../models/User');

module.exports = {
	authenticateUser: function(req, res, next){
		jwt.verify(req.headers['X-Auth-Token'], jwtSecret, function(err, decoded){
			if(err){
				return res.sendStatus(401);
			}
			User.findById(decoded.id)
			.then((user)=>{
				req.user = user;
				next();
			})
			.catch((err)=>{
				console.error(err);
				res.sendStatus(500);
			})
		})
	},
	optionalAuthenticateUser: function(req, res, next){
		if(!req.headers['X-Auth-Token']){
			return next();
		}
		jwt.verify(req.headers['X-Auth-Token'], jwtSecret, function(err, decoded){
			if(err){
				console.warn(err);
				return res.sendStatus(500);
			}
			User.findById(decoded.id)
			.then((user)=>{
				req.user = user;
				next();
			})
			.catch((err)=>{
				console.error(err);
				res.sendStatus(500);
			})
		})
	},
	authenticateAdmin: function(req, res, next){
		next();
	},
	optionalAuthenticateAdmin: function(req, res, next){
		next();
	}
}
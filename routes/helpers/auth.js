const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config')
const User = require('../../models/User');
const Admin = require('../../models/Admin');

module.exports = {
	authenticateUser: function(req, res, next){
		jwt.verify(req.headers['x-auth-token'], jwtSecret, function(err, decoded){
			if(err){
				return res.sendStatus(401);
			}
			User.findById(decoded.id).lean()
			.then((user)=>{
				if(!user){
					return res.status(401).send("No user found")
				}
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
		if(!req.headers['x-auth-token']){
			return next();
		}
		jwt.verify(req.headers['x-auth-token'], jwtSecret, function(err, decoded){
			if(err){
				console.warn(err);
				return res.sendStatus(500);
			}
			User.findById(decoded.id).lean()
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
		jwt.verify(req.headers['x-auth-token'], jwtSecret, function(err, decoded){
			if(err){
				console.warn(err.message);
				return res.sendStatus(401);
			}
			Admin.findById(decoded.id).lean()
			.then((admin)=>{
				if(!admin){
					console.log("DECODED", decoded);
					return res.status(401).send('Admin not found');
				}
				req.admin = admin;
				next();
			})
			.catch((err)=>{
				console.error(err);
				res.sendStatus(500);
			})
		})
	},
	optionalAuthenticateAdmin: function(req, res, next){
		next();
	},
	authenticateAdminWithQuery: function(req, res, next){
		jwt.verify(req.query['token'], jwtSecret, function(err, decoded){
			if(err){
				console.warn(err.message);
				return res.sendStatus(401);
			}
			Admin.findById(decoded.id).lean()
			.then((admin)=>{
				if(!admin){
					console.log("DECODED", decoded);
					return res.status(401).send('Admin not found');
				}
				req.admin = admin;
				next();
			})
			.catch((err)=>{
				console.error(err);
				res.sendStatus(500);
			})
		})
	}
}
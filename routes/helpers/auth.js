const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config')
const User = require('../../models/User');
const Admin = require('../../models/Admin');

module.exports = {
	authenticateUser: function(req, res, next){
		jwt.verify(req.headers['X-Auth-Token'], jwtSecret, function(err, decoded){
			if(err){
				return res.sendStatus(401);
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
	optionalAuthenticateUser: function(req, res, next){
		if(!req.headers['X-Auth-Token']){
			return next();
		}
		jwt.verify(req.headers['X-Auth-Token'], jwtSecret, function(err, decoded){
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
		jwt.verify(req.headers['X-Auth-Token'], jwtSecret, function(err, decoded){
			if(err){
				return res.sendStatus(401);
			}
			Admin.findById(decoded.id).lean()
			.then((admin)=>{
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
	}
}
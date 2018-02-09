const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const { authenticateUser } = require('./helpers/auth');

router.post('/login', (req, res)=>{
	res.sendStatus(501);
})

router.get('/auth', (req, res, next)=>{
	res.sendStatus(200);
})

router.route('/users')
.get((req, res)=>{
	User.find({}).lean()
	.then((users)=>{
		res.json(users);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post((req, res)=>{

	let { firstName, lastName, email, password, passwordConfirmation, phone, address } = req.body;
	if(password === passwordConfirmation){
		User.findOne({
			email
		})
		.then((user)=>{
			if(user){
				return res.json({
					error: "User with same email already exists"
				})
			}
			return bcrypt.hash(password, parseInt(process.env.SALT) || 10)
		})
		.then((hash)=>{
			return User.create({
				firstName, lastName, email, password: hash, phone, address
			})
		})
		.then((newUser)=>{
			return res.sendStatus(201);
		})
		.catch((err)=>{
			console.error(err);
			return res.sendStatus(500);
		})
	} else {
		res.json({
			error: "Passwords do not match"
		})
	}

})

router.get('/users/:id', (req, res)=>{
	User.findById(req.params.id).lean()
	.then((user)=>{
		res.json(user);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.get('/products', (req, res)=>{

	Product.find({}).lean()
	.then((products)=>{
		res.json(products)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.get('/products/:id', (req, res)=>{

	Product.findById(req.params.id).lean()
	.then((product)=>{
		res.json(product);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

module.exports = router;
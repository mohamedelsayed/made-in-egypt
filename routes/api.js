const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

router.post('/login', (req, res)=>{
	res.sendStatus(501);
})

router.get('/auth', (req, res, next)=>{
	res.sendStatus(200);
})

router.get('/users', (req, res)=>{
	User.find({}).lean()
	.then((users)=>{
		res.json(users);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
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

	let { sortBy, sortDirection, filter }

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
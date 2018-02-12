const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const { jwtSecret } = require('./helpers/config');

const { authenticateUser, optionalAuthenticateUser, authenticateAdmin } = require('./helpers/auth');

router.post('/login', (req, res)=>{
	let {email, password} = req.body;
	User.findOne({
		email: req.body.email
	}).lean()
	.then((user)=>{
		if(user){
			bcrypt.compare(password, user.password, (err, correct)=>{
				if(err){
					console.error(err);
					return res.sendStatus(500);
				}
				if(correct){
					return res.json({
						token: jwt.sign({
							id: user._id
						}, jwtSecret)
					})
				} else {
					return res.sendStatus(401);
				}
			})
		} else {
			return res.sendStatus(404);
		}
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})

router.post('/admin/login', (req, res)=>{
	let {username, password} = req.body;
	Admin.findOne({
		username: req.body.username
	}).lean()
	.then((admin)=>{
		if(admin){
			bcrypt.compare(password, admin.password, (err, correct)=>{
				if(err){
					console.error(err);
				}
				if(correct){
					return res.json({
						token: jwt.sign({
							id: admin._id
						}, jwtSecret)
					})
				} else {
					return res.sendStatus(401);
				}
			})
		}
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})

router.get('/auth', authenticateUser, (req, res, next)=>{
	res.sendStatus(200);
})

router.get('/admin/auth', authenticateAdmin, (req, res, next)=>{
	res.sendStatus(200);
})

router.route('/admins')
.post(authenticateAdmin, (req, res)=>{
	let { username, password } = req.body;
	bcrypt.hash(password, 10, (err, hash)=>{
		if(err){
			console.error(err);
			return res.sendStatus(500);
		}
		Admin.create({
			username,
			password: hash
		})
		.then((created)=>{
			res.sendStatus(201);
		})
		.catch((err)=>{
			console.error(err);
			res.sendStatus(500);
		})
	})
})
.put(authenticateAdmin, (req, res)=>{
	res.sendStatus(501);
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
			res.sendStatus(201);
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
.put(authenticateUser, (req, res)=>{
	// res.sendStatus(501);
	// let { firstName, lastName, email, password, passwordConfirmation, phone, address } = req.body;
	let acceptedAttrs = [ "firstName", "lastName", "email", "password", "passwordConfirmation", "phone", "address" ]
	let attrs = {};
	Object.keys(req.body).forEach((key)=>{
		if(acceptedAttrs.includes(key)) Object.assign(attrs, {[key]: req.body[key]});
	})

	if(attrs.password || attrs.passwordConfirmation){
		if(attrs.password !== attrs.passwordConfirmation){
			return res.json({
				failure: "Passwords don't match"
			});
		} else {
			delete attrs.passwordConfirmation;
			bcrypt.hash(password, 10, (err, hash)=>{
				if(err){
					console.error(err);
					return res.sendStatus(500);
				}
				attrs.password = hash;
				return _updateUser(req, res, attrs);
			})
		}
	} else {
		return _updateUser(req, res, attrs)
	}
})

function _updateUser(req, res, attrs){
	User.findByIdAndUpdate(req.user._id, attrs)
	.then((result)=>{
		res.json({
			success: "User updated successfully"
		})
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
}

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

router.route('/products')
.get((req, res)=>{

	/**
	 * Finds all products and filters them and sort them according to the query sent
	*/

	let { sortBy, sortDirection, filterByBrand, filterPriceFrom, filterPriceTo } = req.query;

	let query = {};
	let sort = {};

	if(filterByBrand){
		filter.brand = filterByBrand;
	}
	if(filterPriceFrom || filterPriceTo){
		filter.price = {};
		if(filterPriceFrom){
			Object.assign(filter.price, {$gte: parseFloat(filterPriceFrom)})
		}
		if(filterPriceTo){
			Object.assign(filter.price, {$lte: parseFloat(filterPriceTo)})
		}
	}

	
	if(sortBy){
		let direction = parseInt(sortDirection);
		sort[sortBy] = (direction && [1, -1].includes(direction))? direction : -1;
	}

	/* In all cases, sort by creation time */
	Object.assign(sort, {createdAt: -1});

	Product.find(query).sort(sort).lean()
	.then((products)=>{
		res.json(products)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post(authenticateUser, (req, res)=>{
	res.sendStatus(501);
})

router.get('/products/:id', optionalAuthenticateUser, (req, res)=>{

	Product.findById(req.params.id).lean()
	.then((product)=>{
		res.json(product);
		/* Creates a view if viewed by user */
		if(!req.admin){	
			let createdView = { viewedBy: null };
			if(req.user){
				createdView.viewedBy = req.user._id;
			}
			
			Product.updateOne({_id: product._id}, {
				$push: {
					views: createdView
				}
			})
			.catch((err)=>{
				console.error("Couldn't create view instance for product", req.para)
			})
		}
	})
	.catch((err)=>{
		console.error(err);
	})
})

router.post('/review/:productId', authenticateUser, (req, res)=>{
	if(!req.body.review){
		return res.json({
			error: "Review cannot be empty"
		})
	}
	Product.findById(req.params.productId)
	.then((product)=>{
		if(product){
			return Product.findByIdAndUpdate(req.params.productId, {
				$push: {
					reviews: 
						{
							reviewer: req.user._id,
							content: req.body.review
						}
					}
				}
			)
		} else {
			return res.sendStatus(404);
		}
	})
	.then((updatedProduct)=>{
		return res.json({
			success: "Review submitted successfully"
		})
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})

router.get('/similar/:productId', (req, res)=>{
	Product.findOne(req.params.productId).lean()
	.then((product)=>{
		return Product.find({
			$not: {
				_id: req.params.productId
			},
			price: {
				$lte: product.price * 1.25,
				$gte: product.price * 0.75
			},
			category: product.category
		}).lean()
	})
	.then((similarProducts)=>{
		return res.json(similarProducts);
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})

router.route('/orders')
.get((req, res)=>{
	Order.find({}).sort({}).lean()
	.then((orders)=>{
		res.json(orders);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post((req, res)=>{
	res.sendStatus(501);
})

router.route('/categories')
.get((req, res)=>{

})
.post(authenticateAdmin, async (req, res)=>{
	let { name, parentCategory } = req.body;
	let attrs = {name};
	if(name){
		let foundCategory = await Category.findOne({name});
		if(foundCategory){
			return res.sendStatus(409);
		}
	} else {
		return res.sendStatus(406);
	}
	if(parentCategory){
		let parent = await Category.findOne({name: parentCategory}).lean();
		if(parent){
			attrs['parentCategory'] = parent._id;
		} else {
			return res.sendStatus(406);
		}
	}
	Category.create(attrs)
	.then((category)=>{
		res.sendStatus(201);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})



module.exports = router;
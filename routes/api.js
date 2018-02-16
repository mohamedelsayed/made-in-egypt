const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const co = require('co');
const randomstring = require('randomstring');
const multer = require('multer');
// const upload = multer({storage: multer.memoryStorage()});
const upload = multer();
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(global.Promise);
const publicS3 = new AWS.S3({
	accessKeyId: process.env.ACCESS_KEY_ID || 'AKIAIYLCCVSOEDYBUVVA',
	secretAccessKey: process.env.SECRET_ACCESS_KEY || '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',
	// region: 'eu-west-2'
})

const Admin = require('../models/Admin');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const { jwtSecret } = require('./helpers/config');
const { removeEmptyObjectKeys } = require('./helpers/helpers');

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
						firstName: user.firstName,
						lastName: user.lastName,
						phone: user.phone,
						address: user.address,
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

// TODO: add authenticateAdmin for fetching all users route
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
				return res.status(409).json({
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
.post(authenticateAdmin, (req, res)=>{
	// res.sendStatus(501);
	let { name, description, price, quantity, category, brand, productDetails } = req.body;
	co(function*(){
		let theCategory = yield Category.findOne({name: category}).lean();
		let theBrand = yield Brand.findOne({name: brand}).lean();
		if(!theBrand || !theCategory){
			return res.json({
				failure: "Brand and/or category not found"
			})
		}
		yield Product.create({
			name, description, price, quantity, categoryId: theCategory._id, brandId: theBrand._id, productDetails
		})
		return res.sendStatus(201);
	})
	.catch(err =>{
		console.error(err);
		res.sendStatus(500);
	});
})

router.route('/products/:id')
.get(optionalAuthenticateUser, (req, res)=>{

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
.put(authenticateAdmin, (req, res)=>{
	let { nameEn,	nameAr,	description, price,	quantity,
				ratingTotal, categoryId, brandId,	productDetailsEn,
				productDetailsAr } = req.body;
	let theBody = { nameEn,	nameAr,	description, price,	quantity,
					ratingTotal, categoryId, brandId,	productDetailsEn,
					productDetailsAr };
	theBody = removeEmptyObjectKeys(theBody);
	Product.findByIdAndUpdate(req.params.id, theBody)
	.then((result)=>{
		res.sendStatus(200);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
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
.post(authenticateUser, (req, res)=>{
	let { items, paymentMethod } = req.body;
	let finalPrice = 0;
	let orderProducts = [];
	let invalidItems = false;
	co(function*(){
		for(let item in items){
			if(item.quantity && item.productId){
				let currentProduct = yield Product.findById(item.productId);
				if(!currentProduct){
					invalidItems = true;
					continue;
				}
				if(currentProduct.quantity >= item.quantity && item.quantity > 0){
					yield Product.findByIdAndUpdate(item.productId, {$inc: {quantity: -(item.quantity)}});
					orderProducts.push(item);
					finalPrice += (item.quantity * item.price)
				} else {
					invalidItems = true;
				}
			}
		}
		let theOrder = yield Order.create({
			userId: req.user._id,
			price: finalPrice,
			items: orderProducts,
			paymentMethod: paymentMethod,
			state: 'Pending'
		})
		if(invalidItems){
			Object.assign(theOrder, {error: "Order created with some invalid content"});
		}
		res.send(theOrder);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.post('/order/:orderId/cancel', authenticateUser, (req, res)=>{
	co(function*(){
		let order  = yield Order.findById(req.params.orderId)
		if(order.userId === req.user._id){
			order.set({status: 'Cancelled'});
			let promiseArray = [];
			for(let item in order.items){
				promiseArray.push(
					Product.findByIdAndUpdate(item.productId, {$inc: {quantity: item.quantity}}).exec()
				)
			}
			promiseArray.push(order.save());
			yield promiseArray;
			return res.json({
				success: "Order cancelled"
			})
		} else {
			res.status(403).send({
				error: "You are not allowed to edit this order"
			});
		}
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/categories')
.get((req, res)=>{
	Category.find().lean()
	.then((categories)=>{
		return res.json(categories);
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
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

router.route('/categories/:id')
.get((req, res)=>{
	Category.findById(req.params.id).lean()
	.then((category)=>{
		if(category){
			return Product.find({categoryId: category._id}).lean();
		}
	})
	.then((products)=>{
		if(!products){
			return res.sendStatus(404);
		}
		res.json(products);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/brands')
.get((req, res)=>{
	Brand.find().lean()
	.then((brands)=>{
		res.json(brands);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post(authenticateUser, upload.single('logo'), (req, res)=>{
	let { name } = req.body;
	let photoName = "brandImage-"+randomstring.generate();
	let createBrand = function(){
		let params = { name };
		console.log("PARAMS", params);
		if(req.file){
			Object.assign(params, {
				logo: ('https://s3.amazonaws.com/'
					+ (process.eventNames.BUCKET_NAME || 'madeinegypt-test') + '/'
					+ photoName)
				}
			)
		}
		Brand.create(params)
		.then((brand)=>{
			return res.sendStatus(201);
		})
		.catch((err)=>{
			console.error(err);
			return res.sendStatus(500);
		})
	}
	if(req.file){
		publicS3.putObject({
			Body: req.file.buffer,
			Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
			Key: photoName
		}).promise()
		.then((dataSent)=>{
			return true;
		})
		.catch((err)=>{
			console.error(err);
			return false;
		})
		.then((shouldContinue)=>{
			if(shouldContinue){
				return createBrand();
			}
			return res.sendStatus(500);
		})
	} else {
		createBrand();
	}
})

router.route('/brands/:id')
.get((req, res)=>{
	let brand;
	Brand.findById(req.params.id).lean()
	.then((theBrand)=>{
		if(theBrand){
			brand = theBrand;
			return Product.find({brandId: brand._id}).lean()
		} else {
			return null;
		}
	})
	.then((products)=>{
		if(products){
			res.json({brand, products})
		} else {
			res.sendStatus(404);
		}
	})
})



module.exports = router;
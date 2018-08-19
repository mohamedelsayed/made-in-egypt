const express = require('express');
const router = express.Router();

const path = require('path');
const URL = require('url');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const co = require('co');
const randomstring = require('randomstring');
const multer = require('multer');
const upload = multer({storage: multer.memoryStorage()});
// const upload = multer();

const _ = require('lodash');
const moment = require('moment')
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(global.Promise);
const publicS3 = new AWS.S3({
	accessKeyId: process.env.ACCESS_KEY_ID || 'AKIAIYLCCVSOEDYBUVVA',
	secretAccessKey: process.env.SECRET_ACCESS_KEY || '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',
	// region: 'eu-west-2'
	region: process.env.REGION || undefined
})
const xlsx = require('xlsx');
const firebase = require('firebase-admin');
firebase.initializeApp({
	databaseURL: process.env.FIREBASE_DB || 'https://made-in-egypt-dev.firebaseio.com/',
	credential: firebase.credential.cert(require('../firebaseCredentials.json'))
});

const firebaseDB = firebase.database();
const fcm = firebase.messaging()

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const CardToken = require('../models/CardToken')

const { jwtSecret, /* shippingFees */ } = require('./helpers/config');
const { removeEmptyObjectKeys } = require('./helpers/helpers');
const paymob = require('./helpers/paymobPayment');
const mailer = require('./helpers/email');

const { authenticateUser, optionalAuthenticateUser, authenticateAdmin, authenticateAdminWithQuery } = require('./helpers/auth');

function _setFavourites(products, user){
	if(!user) return;
	if(!products) return console.log("No products sent");
	let favourites = user.favourites.map((f)=>f.toString())
	if(!_.isArray(products)){
		// single product. Accessed directly
		let index = favourites.indexOf(products._id.toString())
		if(index > -1){
			products.isFavourite = true;
		} else {
			products.isFavourite = false;
		}
		return;
	}
	products.forEach((product, index)=>{
		let fIndex = favourites.indexOf(product._id.toString());
		if(fIndex > -1){
			products[index].isFavourite = true;
		} else {
			products[index].isFavourite = false;
		}
	})
}

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
					return CardToken.findOne({userId: user._id}, '-token').lean()
					.then((card)=>{
						return res.json({
							_id: user._id,
							firstName: user.firstName,
							lastName: user.lastName,
							phone: user.phone,
							address: user.address,
							email,
							creditCard: card,
							verified: user.verified,
							token: jwt.sign({
								id: user._id
							}, jwtSecret)
						})
					})
					.catch((err)=>{
						console.error(err);
						res.sendStatus(500);
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

router.get('/verify', async (req, res)=>{
	let { data } = req.query;
	try {
		const decipher = crypto.createDecipher('aes192', '5c323744f3d5b477390bc9bcd2886267afbcf5459199150e605851b4cba2');
		let decrypted = decipher.update(data, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		let user = await User.findById(decrypted)
		if(!user){
			return res.sendStatus(404);
		}
		if(user.verified === true){
			return res.status(400).send("You are already verified");
		}
		user.verified = true;
		await user.save();
		return res.send("You have been verified successfully. Welcome to <strong>Made In Egypt</strong>.Please log in through the app.")
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})

router.get('/resendverification', async (req, res)=>{
	let { email } = req.query;
	let user = await User.findOne({ email }).lean();
	if(!user){
		return res.sendStatus(404);
	}
	if(user.verified){
		return res.sendStatus(400);
	}
	try {
		const cipher = crypto.createCipher('aes192', '5c323744f3d5b477390bc9bcd2886267afbcf5459199150e605851b4cba2');
	
		let encrypted = cipher.update(user._id.toString(), 'utf8', 'hex');
		encrypted += cipher.final('hex');
		mailer.sendAutoEmail("Verify Email", `Click on the following link or copy and paste it in your browser to verify your account.<br> <a href="madeinegypt.ga/api/verify?data=${encrypted}">madeinegypt.ga/api/verify?data=${encrypted}</a>`, email)
		res.sendStatus(200);
	} catch(err){
		console.error(err);
		return res.sendStatus(500);
	}
})

router.post('/resetpassword', (req, res)=>{
	let { email } = req.body;
	User.findOne({email})
	.then((user)=>{
		if(!user){
			return res.sendStatus(404);
		}
		let newPassword = randomstring.generate(12);
		bcrypt.hash(newPassword, parseInt(process.env.SALT) || 10)
		.then((hashed)=>{
			user.password = hashed;
			return user.save()
		})
		.then((updated)=>{
			mailer.sendAutoEmail("Reset Password", `You have requested to reset your password. Here's your new one: <br><strong>${newPassword}</strong>`, email)
			return res.sendStatus(200);
		})
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.post('/admin/login', (req, res)=>{
	let {username, password} = req.body;
	Admin.findOne({
		username
	}).lean()
	.then((admin)=>{
		if(admin){
			console.log("Admin found")
			bcrypt.compare(password, admin.password, (err, correct)=>{
				if(err){
					console.log("Admin password error")
					console.error(err);
				}
				if(correct){
						return res.json({
						token: jwt.sign({
							id: admin._id
						}, jwtSecret),
						master: admin.master
					})
				} else {
					console.log("Admin password incorrect")
					return res.sendStatus(401);
				}
			})
		} else {
			console.log("No admin found")
			return res.sendStatus(401)
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
	res.status(200).send({master: req.admin.master});
})

router.route('/admin/categories')
.all(authenticateAdmin)
.get((req, res)=>{
	Category.find().populate('parentCategory').lean()
	.then((categories)=>{
		res.send(categories);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/admin/brands')
.all(authenticateAdmin)
.get((req, res)=>{
	Brand.find().lean()
	.then((brands)=>{
		res.send(brands);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
/* .post(upload.single('logo'), (req, res)=>{
	let { nameEn, nameAr } = req.body;
	if(!nameEn || !nameAr){
		return res.sendStatus(400);
	}
	let creationObject = { nameEn, nameAr }
	if(logo){
		let logo = randomstring.generate(20);
		publicS3.putObject({
			Body: req.file.buffer,
			Key: logo,
			Bucket: 
		})
	}
}) */

router.route('/admin/users')
.all(authenticateAdmin)
.get((req, res)=>{
	User.find({}, '-password').lean()
	.then((users)=>{
		res.send(users)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500)
	})
})

router.route('/admin/orders')
.all(authenticateAdmin)
.get((req, res)=>{
	let { pageNumber=1, status, method } = req.query;
	let filter = {};
	if(status){
		filter.state = status;
	}
	if(method){
		filter.paymentMethod = method;
	}
	Order.find(filter)
	.sort({createdAt: -1})
	.skip(20* (pageNumber - 1))
	.limit(20)
	.populate('userId')
	.populate('items.productId')
	.lean()
	.then((orders)=>{
		res.send(orders)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500)
	})
})

router.route('/admin/orders/:orderId')
.all(authenticateAdmin)
.put((req, res)=>{
	let { orderId } = req.params
	let { state } = req.body;
	// TODO: handle on cancel order return items to stock
	let responseSent = false;
	Order.findById(orderId).lean()
	.then(async (order)=>{
		if(!order){
			res.sendStatus(404);
			responseSent = true;
			throw Error("Order not found");
		}
		try {
			if(state === 'Cancelled'){
				let returnedProducts = order.items.map((item)=>{
					return Product.findById(item.productId).lean().exec()
				})
				returnedProducts = await Promise.all(returnedProducts);
				returnedProducts.forEach(async(product, index)=>{
					if(!product){
						return;
					}
					let detailIndex = product.details.findIndex((detail)=>{
						return detail.size === order.items[index].details.size
					})
					if(detailIndex < 0){
						responseSent = true;
						res.sendStatus(500);
						throw Error("Detail not found")
					}
					console.log("DETAIL INDEX", detailIndex, product.details, "ORDER DETAILS", order.items[index].details);
					await Product.findByIdAndUpdate(product._id, {
						$inc: {
							['details.'+detailIndex+'.quantity']: order.items[index].details.quantity
						}
					}, {
						new: true
					})
					.then((updated)=>console.log("RESTOCKED", updated))
				})
			}
			if(!responseSent){
				await Order.findByIdAndUpdate(orderId, {
					state
				}, {
					new: true
				})
				res.sendStatus(200);
			}
		} catch(err){
			throw Error(err);
		}
	})
	.catch((err)=>{
		console.error(err);
		if(!responseSent){
			res.sendStatus(500);
		}
	})
})

router.post('/admin/report/sales', authenticateAdmin, async (req, res)=>{
	let { startDate, endDate, brandId } = req.body;
	let filter = {};
	if(startDate || endDate){
		filter['createdAt'] = {}
		if(startDate){
			filter['createdAt']['$gt'] = moment(startDate).valueOf();
		}
		if(endDate){
			filter['createdAt']['$lt'] = moment(endDate).add(1, 'day').valueOf()
		}
	}
	try {
		console.log(filter);
		let orders = await Order.find(filter)/* .populate({path: 'items.productId', model: 'Product'}) */.lean()
		console.log(orders.length);
		let theBrand;
		if(brandId){
			theBrand = await Brand.findById(brandId).lean();
			// orders = orders.filter((order)=>{
				// 	return order.items.findIndex((item)=>{
					// 		// console.log(item.productId.brandId.toString(), brandId, item.productId.brandId === brandId)
					// 		return item.productId.brandId.toString() === brandId
					// 	}) > -1
					// })
			if(!theBrand){
				return res.sendStatus(404);
			}
		}
		let reportProducts = {};

		for (let oIndex = 0; oIndex < orders.length; oIndex++) {
			const order = orders[oIndex];
			if(order.state === "Cancelled")	{/* console.log("Continuing index:", oIndex, orders.length);  */continue;}
			for (let index = 0; index < order.items.length; index++) {
				const item = order.items[index];
				if(brandId && item.brandId && item.brandId.toString() !== theBrand._id.toString()) {/* console.log("Continuing at item", oIndex, index, item.brandId.toString(), theBrand._id.toString(), order.items.length); */ continue;}
				if(!item.details.quantity || !item.price){
					console.error("Detail quantity or price not available for item in order "+order._id);
					continue;
				}
				// console.log("Passed at item", oIndex, index, item.brandId.toString(), theBrand? theBrand._id.toString() : "No brand given")
				if(!reportProducts[item.productId]){
					// let productBrand = await Brand.findById(item.productId.brandId).lean()
					// let productCategory = await Category.findById(item.productId.categoryId).lean()
					reportProducts[item.productId] = {
						"ID": item.productId? item.productId.toString() : "Product Deleted",
						"English Name": item.nameEn,
						"Arabic Name": item.nameAr,
						"Brand": item.brand,
						"Category": item.category,
						salesVolume: 0,
						salesValue: 0,
						// "Views": item.productId? item.productId.views.length : "Product Deleted"
					}
				}
				reportProducts[item.productId].salesVolume += item.details.quantity;
				reportProducts[item.productId].salesValue += item.price;
			}
		}
		// res.send({orders, reportProducts})
		let reportData = Object.keys(reportProducts).map((key)=>{
			return reportProducts[key];
		})
		let excelSheet = xlsx.utils.json_to_sheet(reportData)
		let workbook = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(workbook, excelSheet, "Report");
		let sheetName = moment().valueOf()+".xlsx";
		xlsx.writeFile(workbook, sheetName);
		fs.readFile(sheetName, (err, data)=>{
			if(err) throw Error(err);
			res.send(data);
			fs.unlink(sheetName, (err)=>{if(err)console.error(err)});
		})
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})

router.post('/admin/report/products', authenticateAdmin, async (req, res)=>{
	let { startDate, endDate, brandId, categoryId } = req.body;
	console.log(req.body);
	let filter = {};
	if(startDate || endDate){
		filter['createdAt'] = {}
		if(startDate){
			filter['createdAt']['$gt'] = moment(startDate).format();
		}
		if(endDate){
			filter['createdAt']['$lt'] = moment(endDate).add(1, 'day').format()
		}
	}

	if(brandId){
		filter.brandId = brandId
	}

	if(categoryId){
		filter.categoryId = categoryId;
	}

	console.log("FILTER", filter);

	let reportData = await Product.find(filter, '-ratingTotal -ratingCount -ratings -views -reviews -__v -createdBy -_id').populate('brandId').populate('categoryId').lean();
	// console.log(reportData);
	console.log(reportData.length);
	
	for (let index = 0; index < reportData.length; index++) {
		let product = reportData[index];
		product = JSON.parse(JSON.stringify(product));
		product.photos = JSON.stringify(product.photos);
		product.category = product.categoryId? product.categoryId.nameEn + " - " + product.categoryId.nameAr : "N/A";
		product.brand = product.brandId? product.brandId.nameEn + " - " + product.brandId.nameAr : "N/A";
		delete product.categoryId;
		delete product.brandId;
		product.featured = (product.featured)? "Yes" : "No";
		product.details = JSON.stringify(product.details);
		product.createdAt = moment(product.createdAt).format("DD/MM/YYYY");
		reportData[index] = product;
	}

	let excelSheet = xlsx.utils.json_to_sheet(reportData)
	let workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, excelSheet, "Report");
	let sheetName = moment().valueOf()+".xlsx";
	xlsx.writeFile(workbook, sheetName);
	fs.readFile(sheetName, (err, data)=>{
		if(err) throw Error(err);
		res.send(data);
		fs.unlink(sheetName, (err)=>{if(err)console.error(err)});
	})
})

router.post('/admin/report/orders', authenticateAdmin, async (req, res)=>{
	let { startDate, endDate, state, paymentMethod } = req.body;
	console.log(req.body);
	let filter = {};
	if(startDate || endDate){
		filter['createdAt'] = {}
		if(startDate){
			filter['createdAt']['$gt'] = moment(startDate).valueOf();
		}
		if(endDate){
			filter['createdAt']['$lt'] = moment(endDate).add(1, 'day').valueOf()
		}
	}

	if(state){
		filter.state = state;
	}

	if(paymentMethod){
		filter.paymentMethod = paymentMethod;
	}


	let orders = await Order.find(filter).populate('userId').lean();

	let reportData = [];
	for (let index = 0; index < orders.length; index++) {
		const order = orders[index];
		for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
			const item = order.items[itemIndex];
			reportData.push({
				"ID": JSON.stringify(order._id),
				"User email": order.userId? order.userId.email : "N/A",
				// "Order total price": order.totalPrice,
				"Shipping fees": order.shippingFees,
				"Cash on delivery fess": order.cashOnDeliveryFees,
				"Payment method": order.paymentMethod,
				"State": order.state,
				"Delivery Date": order.deliveryDate,
				"Address": order.address || order.userId.address,
				"Phone": order.phone || order.userId.phone,
				"Item price": item.price,
				"English Name": item.nameEn,
				"Arabic Name": item.nameAr,
				"Brand": item.brand,
				"Category": item.category,
				"Details": JSON.stringify(item.details),
				"Order Date": moment(order.createdAt).format("DD/MM/YYYY")
			})
		}
	}

	let excelSheet = xlsx.utils.json_to_sheet(reportData)
	let workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, excelSheet, "Report");
	let sheetName = moment().valueOf()+".xlsx";
	xlsx.writeFile(workbook, sheetName);
	fs.readFile(sheetName, (err, data)=>{
		if(err) {
			console.error(err);
			res.sendStatus(500);
		}
		res.send(data);
		fs.unlink(sheetName, (err)=>{if(err)console.error(err)});
	})
})

router.post('/admin/report/users', authenticateAdmin, async (req, res)=>{
	let { startDate, endDate, gender } = req.body;
	let filter = {};
	if(startDate || endDate){
		filter['createdAt'] = {}
		if(startDate){
			filter['createdAt']['$gt'] = moment(startDate).valueOf();
		}
		if(endDate){
			filter['createdAt']['$lt'] = moment(endDate).add(1, 'day').valueOf()
		}
	}

	if(gender){
		filter['gender'] = gender
	}

	let reportData = await User.find(filter, '-updatedAt -password -favourites -__v -_id -fcmToken').lean();

	for (let index = 0; index < reportData.length; index++) {
		let user = reportData[index];
		user.createdAt = moment(user.createdAt).format('DD/MM/YYYY');
		reportData[index] = user;
	}


	let excelSheet = xlsx.utils.json_to_sheet(reportData)
	let workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, excelSheet, "Report");
	let sheetName = moment().valueOf()+".xlsx";
	xlsx.writeFile(workbook, sheetName);
	fs.readFile(sheetName, (err, data)=>{
		if(err) throw Error(err);
		res.send(data);
		fs.unlink(sheetName, (err)=>{if(err)console.error(err)});
	})
})

router.get('/admin/print/:orderId', authenticateAdminWithQuery, (req, res)=>{
	Order.findById(req.params.orderId).populate('userId').lean()
	.then((order)=>{
		res.render('print', {
			totalPrice: order.totalPrice,
			date: moment().format('DD/MM/YYYY'),
			address: order.userId.address,
			receiver: order.userId.firstName + " " + order.userId.lastName,
			instructions: "None",
			items: order.items,
			total: order.items.reduce((accumilator, item)=>{
				return accumilator + item.price
			}, 0),
			shippingFees: order.shippingFees,
			cashOnDeliveryFees: order.cashOnDeliveryFees
		})
	})
	.catch((err)=>{
		res.sendStatus(500);
	})
})

router.get('/admin/orders/count', authenticateAdmin, (req, res)=>{
	Order.count()
	.then((count)=>{
		res.send(count);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.post('/admin/report', authenticateAdmin, (req, res)=>{
	let { start, end, brandId } = req.body;
})

router.route('/admin/products')
.all(authenticateAdmin)
.get((req, res)=>{
	// Product.find().populate('brandId').populate('categoryId')
	let theProducts, theBrands, theCategories;
	let { search, brandId, categoryId, featured } = req.query;
	let filter = {
		$and: []
	};

	if(search || brandId || categoryId || featured){
		if(search){
			filter['$and'].push(
				{
					$or: [
						{
							_id: {
								$regex: search, $options: 'i'
							}
						},
						{
							nameEn: {
								$regex: search, $options: 'i'
							}
						},
						{
							nameAr: {
								$regex: search, $options: 'i'
							}
						}
					]
				}
			)
		}
		if(brandId){
			filter['$and'].push(
				{
					brandId: mongoose.Types.ObjectId(brandId)
				}
			)
		}
	
		if(categoryId){
			filter['$and'].push(
				{
					categoryId: mongoose.Types.ObjectId(categoryId)
				}
			)
		}

		if(featured){
			filter['$and'].push(
				{
					featured: JSON.parse(featured)
				}
			)
		}
	} else {
		filter = {};
	}

	console.log(filter);

	Product.aggregate([
		{
			$match: filter
		},
		{
			$lookup: {
				from: 'brands',
				localField: 'brandId',
				foreignField: '_id',
				as: 'brand'
			}	
		},
		{
			$lookup: {
				from: 'categories',
				localField: 'categoryId',
				foreignField: '_id',
				as: 'category'
			}
		},
		{
			$project: {
				'nameEn': 1,
				'nameAr': 1,
				'descriptionEn': 1,
				'descriptionAr': 1,
				'price': 1,
				'discount': 1,
				'color': 1,
				'details': 1,
				'photos': 1,
				'ratingTotal': 1,
				'ratingCount': 1,
				'views': 1,
				'reviews': 1,
				'featured': 1,
				'createdBy': 1,
				'createdAt': 1,
				'updatedAt': 1,
				'brand': {
					$arrayElemAt: ['$brand', 0]
				},
				'category': {
					$arrayElemAt: ['$category', 0]
				},
				'quantity': {
					$sum: '$details.quantity'
				}
			}
		}, {
			$sort: {
				'createdAt': -1
			}
		}
	])
	.then((products)=>{
		theProducts = products;
		return Category.find().lean()
	})
	.then((categories)=>{
		theCategories = categories;
		return Brand.find().lean()
	})
	.then((brands)=>{
		theBrands = brands;																																																																																																		
		return res.send({products: theProducts, brands: theBrands, categories: theCategories});
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})
.post((req, res)=>{
	res.sendStatus(501)
})

router.route('/admins')
.all(authenticateAdmin)
.get((req, res)=>{
	Admin.find({}, '_id username master').lean()
	.then((admins)=>{
		res.send(admins);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post((req, res)=>{
	let { username, password, master=true } = req.body;
	Admin.find({
		username
	}).lean()
	.then((admin)=>{
		if(admin.length > 0){
			return res.status(400).json({
				error: "Admin with same username already exists"
			})
		}
		bcrypt.hash(password, 10, (err, hash)=>{
			if(err){
				console.error(err);
				return res.sendStatus(500);
			}
			Admin.create({
				username,
				password: hash,
				master
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
})
.put(async (req, res)=>{
	// res.sendStatus(501);
	let { oldPassword, newPassword } = req.body;
	try {
		let match = await bcrypt.compare(oldPassword, req.admin.password)
		if(match){
			let encPassword = await bcrypt.hash(newPassword, 10)
			await Admin.findByIdAndUpdate(req.admin._id, {
				password: encPassword
			}, {
				new: true
			})
			return res.sendStatus(200);
		}
		return res.status(400).json({
			error: "Old password is incorrect"
		})
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})

router.route('/admins/:adminId')
.all(authenticateAdmin)
.delete((req, res)=>{
	let { adminId } = req.params
	Admin.findByIdAndRemove(adminId).lean()
	.then((deletedAdmin)=>{
		if(deletedAdmin){
			return res.sendStatus(200);
		}
		res.sendStatus(404);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

// TODO: add authenticateAdmin for fetching all users route
router.route('/users')
.get(authenticateAdmin, (req, res)=>{
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
	let responseSent = false;
	let { firstName, lastName, email, password, passwordConfirmation, phone, address, gender, creditCard } = req.body;
	if(password === passwordConfirmation){
		User.findOne({
			email
		})
		.then((user)=>{
			if(user){
				res.status(409).json({
					error: "User with same email already exists"
				})
				responseSent = true;
				throw Error("User with same email");
			}
			return bcrypt.hash(password, parseInt(process.env.SALT) || 10)
		})
		.then(async (hash)=>{
			let newUser = await User.create({
				firstName, lastName, email, password: hash, phone, address, gender
			}).catch((err)=>{
				console.error(err);
				res.status(400).send({
					errorCode: 0
				})
				responseSent = true
				throw Error("User invalid");
			})
			if(creditCard){
				let { cardNumber, cardHolderName, expiryMonth, expiryYear, cvn } = creditCard;
				if(!(cardNumber || cardHolderName || expiryMonth || expiryYear || cvn)){
					await User.deleteOne(newUser._id)
					res.status(400).send({
						errorCode: 1
					})
					responseSent = true;
					throw Error("Invalid credit card details")
				}
				let createdToken = await paymob.createCreditCardToken(newUser, cardHolderName, cardNumber, expiryYear, expiryMonth, cvn).catch(async (err)=>{
					console.error(err);
					await User.deleteOne(newUser._id)
					res.status(400).send({
						errorCode: 1
					})
					responseSent = true;
					throw Error("Error creating token")
				})
				Object.assign(newUser, {maskedPan: createdToken.maskedPan})
			}

			const cipher = crypto.createCipher('aes192', '5c323744f3d5b477390bc9bcd2886267afbcf5459199150e605851b4cba2');
			let encrypted = cipher.update(newUser._id.toString(), 'utf8', 'hex');
			encrypted += cipher.final('hex');
			mailer.sendAutoEmail("Verify Email", `Click on the following link or copy and paste it in your browser to verify your account.<br> <a href="madeinegypt.ga/api/verify?data=${encrypted}">madeinegypt.ga/api/verify?data=${encrypted}</a>`, email)
			
			res.status(201).send(newUser);
		})
		.catch((err)=>{
			console.error(err);
			// return res.sendStatus(500);
			if(!responseSent){
				return res.sendStatus(500);
			}
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
	let acceptedAttrs = [ "firstName", "lastName", "email", "password", "passwordConfirmation", "phone", "address", "gender" ]
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
			bcrypt.hash(attrs.password, 10, (err, hash)=>{
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

router.get('/file', (req, res)=>{
	const { url } = req.query;
	if(!url){
		res.sendStatus(500);
	}
	try {
		let parsed = URL.parse(url);
		let stream = publicS3.getObject({
			Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
			Key: parsed.pathname.slice(1)
		}).createReadStream()
		stream
		.on('error', (err)=>{console.error(err); stream.unpipe(); res.end()})
		.pipe(res)
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})

router.route('/products')
.get(optionalAuthenticateUser, (req, res)=>{

	/**
	 * Finds all products and filters them and sort them according to the query sent
	*/

	let { query, sortBy, sortDirection, filterByBrand, filterPriceFrom, filterPriceTo, pageNumber = 1 } = req.query;

	let filter = {};
	let sort = {};

	if(query && query !== " "){
		// filter["$text"] = {
		// 	"$search": query
		// }
		// let rx = {$regex: /.*${query}.*/i}
		let rx = { '$regex' : `.*${query}.*`, '$options' : 'i' }
		filter["$or"] = [
			{
				nameEn: rx
			},
			{
				nameAr: rx
			},
			{
				descriptionEn: rx
			},
			{
				descriptionAr: rx
			},
		]
	}

	if(filterByBrand){
		try {
			filter.brandId = mongoose.Types.ObjectId(filterByBrand);
		} catch(err){
			console.error(err);
			return res.sendStatus(400);
		}
	}
	if(filterPriceFrom || filterPriceTo){
		filter.price = {};
		if(filterPriceFrom && _.isNumber(parseFloat(filterPriceFrom))){
			filter.price = Object.assign({}, filter.price, {$gte: parseFloat(filterPriceFrom)})
		}
		if(filterPriceTo && _.isNumber(parseFloat(filterPriceTo))){
			filter.price = Object.assign({}, filter.price, {$lte: parseFloat(filterPriceTo)})
		}
		if(Object.keys(filter.price).length < 1) delete filter.price;
	}
	
	if(sortBy){
		let direction = parseInt(sortDirection);
		sort[sortBy] = (direction && [1, -1].includes(direction))? direction : -1;
	}

	/* In all cases, sort by creation time */
	Object.assign(sort, {createdAt: -1});

	Product.find(filter, '-views -ratings').sort(sort).skip((parseInt(pageNumber) - 1)*15).limit(15).populate('brandId').lean()
	.then((products)=>{
		_setFavourites(products, req.user)
		res.json(products)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.all(authenticateAdmin)
.post(upload.array('photos'), (req, res)=>{
	let { nameEn, nameAr, descriptionEn, descriptionAr, price, discount, details, category, brand, /* color */colors, featured } = req.body;
	details = JSON.parse(details);
	colors = JSON.parse(colors);
	if(!_.isArray(details) || _.isUndefined(details)){
		return res.status(400).json({
			error: "Details is not an array or undefined"
		});
	}
	if(!_.isArray(colors) || _.isUndefined(colors)){
		return res.status(400).json({
			error: "Colors is not an array or undefined"
		});
	}
	colors = colors.filter((color)=>color)
	if(details.length < 1){
		return res.status(400).json({
			error: "Details are missing"
		})
	}
	details = details.map((detail)=>{
		detail.quantity = parseFloat(detail.quantity);
		return detail;
	})
	co(function*(){
		let theCategory = yield Category.findOne({_id: category}).lean();
		let theBrand = yield Brand.findOne({_id: brand}).lean();
		if(!theBrand || !theCategory){
			return res.status(400).json({
				error: "Brand and/or category not found"
			})
		}
		let uploadArray = [];
		let photos = []
		if(req.files && req.files.length > 0){
			uploadArray = req.files.map((file)=>{
				let photoName = randomstring.generate(15)+path.extname(file.originalname)
				return publicS3.upload({
					Body: file.buffer,
					Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
					Key: photoName
				}).promise()
			})
			let doneUpload = yield uploadArray;
			photos = doneUpload.map((uploaded)=>{
				return uploaded.Location
			})
		}
		if(colors.length === 0){
			yield Product.create({
				nameEn, nameAr, descriptionEn, descriptionAr, price, discount, details, categoryId: theCategory._id, brandId: theBrand._id, featured: (featured === "yes"), photos,
				ratingTotal: 0, ratingCount: 0, createdBy: req.admin._id
			})
		} else {
			for (let index = 0; index < colors.length; index++) {
				const color = colors[index];
				if(!color){
					continue;
				}
				yield Product.create({
					nameEn, nameAr, descriptionEn, descriptionAr, price, discount, details, categoryId: theCategory._id, brandId: theBrand._id, color, featured: (featured === "yes"), photos,
					ratingTotal: 0, ratingCount: 0, createdBy: req.admin._id
				})
			}
		}
		return res.sendStatus(201);
	})
	.catch(err =>{
		console.error(err);
		res.sendStatus(500);
	});
})
.put(upload.array('photos'), (req, res)=>{
	let { _id, nameEn, nameAr, descriptionEn, descriptionAr, price, discount, details, category, brand, color, featured } = req.body;
	if(!_id){
		return res.status(400).json({
			error: "Product ID not provided"
		})
	}
	details = JSON.parse(details);
	if(!_.isArray(details) || _.isUndefined(details)){
		return res.status(400).json({
			error: "Details is not an array or undefined"
		});
	}
	if(details.length < 1){
		return res.status(400).json({
			error: "Details are missing"
		})
	}
	details.quantity = parseFloat(details.quantity)
	details = details.map((detail)=>{
		detail.quantity = parseFloat(detail.quantity);
		return detail;
	})
	co(function*(){
		let theProduct = yield Product.findById(_id).lean();
		let theCategory = yield Category.findById(category).lean();
		let theBrand = yield Brand.findById(brand).lean();
		if(!theProduct){
			return res.status(404).json({
				error: "Product not found"
			})
		}
		if(!theBrand || !theCategory){
			return res.status(400).json({
				error: "Brand and/or category not found"
			})
		}
		let uploadArray = [];
		let photos = []
		if(req.files && req.files.length > 0){
			uploadArray = req.files.map((file)=>{
				let photoName = randomstring.generate(15)+path.extname(file.originalname)
				return publicS3.upload({
					Body: file.buffer,
					Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
					Key: photoName
				}).promise()
			})
			let doneUpload = yield uploadArray;
			photos = doneUpload.map((uploaded)=>{
				return uploaded.Location
			})
		}
		console.log("PHOTOS", photos, photos.length);
		yield Product.findByIdAndUpdate(_id, Object.assign({},{
			nameEn, nameAr, descriptionEn, descriptionAr, price, discount, details, categoryId: theCategory._id, brandId: theBrand._id, color, featured
		}, (photos.length > 0)? {
			$push: {
				photos: {
					$each: photos
				}
			}
		}: {}), {new: true}).then((updated)=>console.log(updated))
		return res.sendStatus(201);
	})
	.catch(err =>{
		console.error(err);
		res.sendStatus(500);
	});
})

router.post('/fetch/products', (req, res)=>{
	let { productIds } = req.body;
	Product.find({
		_id: {
			$in: productIds
		}
	})
	.populate('brandId')
	.lean()
	.then((products)=>{
		res.send(products);
	})
	.catch((err)=>{
		console.error(err)
		res.sendStatus(500);
	})
})

router.route('/creditcard')
.get(authenticateUser, (req, res)=>{
	CardToken.findOne({
		userId: req.user._id
	}, '_id maskedPan').lean()
	.then((card)=>{
		if(card){
			return res.send(card);
		}
		return res.status(404).send(null)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.put(authenticateUser, async (req, res)=>{
	let {cardNumber, nameOnCard, expiryMonth, expiryYear, cvn} = req.body;
	try{
		let oldToken = await CardToken.findOne({userId: req.user._id})
		let newToken = await paymob.createCreditCardToken(req.user, nameOnCard, cardNumber, expiryYear, expiryMonth, cvn)
		if(oldToken){
			await CardToken.findByIdAndRemove(oldToken._id)
		}
		res.status(201).send({
			maskedPan: newToken.maskedPan
		})
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})
.delete(authenticateUser, (req, res)=>{
	CardToken.remove({
		userId: req.user._id
	})
	.then(()=>{
		res.sendStatus(200);
	})
	.catch(err=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/featured')
.get((req, res)=>{
	Product.find({featured: true}).populate('brandId').lean()
	.then((products)=>{
		res.send(products)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.put(authenticateAdmin, (req, res)=>{
	let { productId, featured } = req.body;
	if(!_.isBoolean(featured)){
		return res.sendStatus(400);
	}
	Product.findByIdAndUpdate(productId, {featured}, {new: true})
	.then((updatedProduct)=>{
		res.send(updatedProduct);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.get('/latest', optionalAuthenticateUser, (req, res)=>{
	Product.find({}, '-views -ratings').sort({createdAt: -1}).limit(20).populate('brandId').lean()
	.then((latestProducts)=>{
		_setFavourites(latestProducts, req.user)
		res.send(latestProducts);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.get('/mostpopular', (req, res)=>{
	Product.aggregate([
		{
			"$project": {
				_id: 1,
				viewCount: {"$size": "$views"},
				brandId: 1,
				nameEn: 1,
				nameAr: 1,
				descriptionEn: 1,
				descriptionAr: 1,
				price: 1,
				discount: 1,
				color: 1,
				details: 1,
				photos: 1,
				ratingTotal: 1,
				ratingCount: 1,
				// ratings: 1,
				categoryId: 1,
				reviews: 1,
				featured: 1,
				createdAt: 1,
				updatedAt: 1
			}
		},
		{
			"$sort": {viewCount: -1}
		},
		{
			"$limit": 10
		},
		{ 
			"$lookup": {
				from: 'brands',
				localField: 'brandId',
				foreignField: '_id',
				as: 'brand'
			} 
		},
		{
			"$project": {
				_id: 1,
				viewCount: 1,
				'brandId': {
					$arrayElemAt: ['$brand', 0]
				},
				nameEn: 1,
				nameAr: 1,
				descriptionEn: 1,
				descriptionAr: 1,
				price: 1,
				discount: 1,
				color: 1,
				details: 1,
				photos: 1,
				ratingTotal: 1,
				ratingCount: 1,
				// ratings: 1,
				categoryId: 1,
				reviews: 1,
				featured: 1,
				createdAt: 1,
				updatedAt: 1
			}
		}
	])
	.then((products)=>{
		res.send(products)
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500)
	})
})

router.route('/products/:id')
.get(optionalAuthenticateUser, (req, res)=>{

	Product.findById(req.params.id).populate('brandId').lean()
	.then((product)=>{
		_setFavourites(product, req.user)
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
		res.sendStatus(500);
	})
})
.all(authenticateAdmin)
.put((req, res)=>{
	let { nameEn,	nameAr,	description, price,	quantity,
				ratingTotal, categoryId, brandId,	productDetailsEn,
				productDetailsAr } = req.body;
	let theBody = { nameEn,	nameAr,	description, price,	quantity,
					ratingTotal, categoryId, brandId,	productDetailsEn,
					productDetailsAr };
	theBody = removeEmptyObjectKeys(theBody);
	let theProduct;
	Product.findByIdAndUpdate(req.params.id, theBody).lean()
	.then((product)=>{
		if(!product){
			return res.sendStatus(404);
		}
		res.sendStatus(200);
		// Check if this product is a favourite for any user.
		// Then send these users a notification that it came into stock if it was less than 5
		theProduct = product;
		if(theBody.quantity > 5 && result.quantity <= 5){
			// The quantity of the product has been increased beyond 5
			return User.find({
				favourites: product._id
			}).lean()
		}
	})
	.then((theUsers)=>{
		console.log("THE USERS",theUsers)
		if(theUsers && theProduct){
			for (let userIndex = 0; userIndex < theUsers.length; userIndex++) {
				const element = theUsers[userIndex];
				const ref = firebaseDB.ref(`/notifications/${theUsers[userIndex]._id}`);
				ref.push(`An item you added to your favourites (${theProduct.nameEn}) has come into stock`, (err)=>{
					if(err){
						console.error(err);
					}
				})
			}
		}
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.delete(async (req, res)=>{
	let productId = req.params.id;
	try {
		let pendingOrderOfProduct = await Order.findOne({
			state: 'Pending',
			'items.productId': productId
		}).lean()
		if(pendingOrderOfProduct){
			return res.sendStatus(409);
		}
		await Product.findByIdAndRemove(productId).lean()
		return res.sendStatus(204);
	} catch(err){
		console.error(err);
		res.sendStatus(500)
	}
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

router.get('/similar/:productId', optionalAuthenticateUser, (req, res)=>{
	let responseSent = false;
	Product.findById(req.params.productId, '-views -ratings').populate('brandId').lean()
	.then((product)=>{
		if(!product){
			res.sendStatus(404);
			responseSent = true;
			throw Error("Product not found");
		}
		return Product.find({
			_id: {
				$ne: req.params.productId
			},
			price: {
				$lte: product.price * 1.25,
				$gte: product.price * 0.75
			},
			categoryId: product.categoryId
		}).populate('brandId').lean()
	})
	.then((similarProducts)=>{
		_setFavourites(similarProducts, req.user)
		return res.json(similarProducts);
	})
	.catch((err)=>{
		console.error(err);
		if(!responseSent){
			return res.sendStatus(500);
		}
	})
})

router.post('/rate/:productId', authenticateUser, (req, res)=>{
	let { productId } = req.params;
	let { rating } = req.body;
	if(!rating || !_.isNumber(rating) || rating > 5 || rating < 1){
		return res.sendStatus(400);
	}
	let responseSent = false;
	Product.findById(productId).lean()
	.then((product)=>{
		if(!product){
			res.sendStatus(404);
			responseSent = true;
			throw Error("Product not found");
		}
		let {ratingTotal, ratingCount, ratings} = product;
		let userRating = ratings.find(function(rating){
			return rating.user.toString() == req.user._id.toString()
		})
		// let incrementValue = rating - (userRating)? userRating.value : 0;
		if(userRating){
			let ratingDifference = rating - userRating.value;
			return Product.findOneAndUpdate({
				_id: productId,
				'ratings.user': req.user._id
			}, {
				'ratings.$.value': rating,
				$inc: {
					ratingTotal: ratingDifference
				}
			}, {
				new: true
			})
		} else {
			return Product.findByIdAndUpdate(productId, {
				$push: {
					ratings: {
						user: req.user._id,
						value: rating
					}
				},
				$inc: {
					ratingTotal: rating,
					ratingCount: 1	
				}
			}, {
				new: true
			})
		}
	})
	.then((updatedProduct)=>{
		if(!updatedProduct){
			throw Error("Product not updated")
		}
		res.sendStatus(201);
	})
	.catch((err)=>{
		console.error(err);
		if(!responseSent){
			res.sendStatus(500);
		}
	})
})

router.get('/favourites', authenticateUser, (req, res)=>{
	User.findById(req.user._id)
	.then((user)=>{
		console.log(user.favourites)
		let favourited = user.favourites.map((favourite)=>{
			return Product.findById(favourite, '-views -reviews').populate('brandId').lean();
		})
		return Promise.all(favourited);
	})
	.then((favourites)=>{
		return res.send(favourites);
	})
	// .populate('favourites')
	// .lean()
	// .then((populatedUser)=>{
	// 	res.send(populatedUser.favourites);
	// })
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/favourites/:productId')
.post(authenticateUser, (req, res)=>{
	let { productId } = req.params;
	Product.findById(productId).lean()
	.then((product)=>{
		if(!product){
			return res.sendStatus(404);
		}
		console.log(req.user.favourites)
		if(req.user.favourites.findIndex(id => id.toString() === productId) === -1){
			return User.findByIdAndUpdate(req.user._id, {
				$push: {favourites: product._id}
			}, {
				new: true
			})
			.then((doc)=>{
				return res.sendStatus(201);
			})
			.catch((err)=>{
				console.error(err);
				res.sendStatus(500);
			})
		} else {
			res.sendStatus(200);
		}
	})
	.catch((err)=>{
		console.error(err);
		return res.sendStatus(500);
	})
})
.delete(authenticateUser, (req, res)=>{
	let { productId } = req.params;
	User.findByIdAndUpdate(req.user._id, {
		$pull: {
			favourites: productId
		}
	}, {
		new: true
	})
	.then((updated)=>{
		console.log(updated);
		res.status(200).send(updated);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

async function _checkProductAndSendFCMIfNeeded(productId){
	try {
		let product = await Product.findById(productId).lean()
		if(product.details.find((detail)=>detail.quantity <= 5)){
			let concernedUsers = await User.find({
				favourites: product._id
			}).lean()
			concernedUsers.forEach(async (user)=>{
				if(user.fcmToken){
					let fcmMsg = await fcm.send({
						token: user.fcmToken,
						data: {
							titleEn: "Product Running Out",
							bodyEn: "An item you favourited is running out of stock",
							titleAr: "المنتج على وشك ان ينفذ",
							bodyAr: "احد المنتجات التي فضلتها على وشك ان ينفذ من عندنا"
						}
					})
					console.log(fcmMsg);
					return true;
				}
				return true;
			})
		}
	} catch(err){
		console.error(err);
		return false;
	}
}

router.route('/orders')
.get(authenticateUser, (req, res)=>{
	Order.find({userId: req.user._id}).sort({}).lean()
	.then((orders)=>{
		res.json(orders);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.post(authenticateUser, async (req, res)=>{
	let { products, paymentMethod, creditCard, shippingFees, address, phone, cashOnDeliveryFees } = req.body;
	if(!_.isArray(products) || products.length < 1 || !shippingFees){
		return res.sendStatus(400);
	}
	let processedProducts = [];
	let productsPromiseArray = products.map(element => {
		return Product.findById(element._id).populate('brandId').populate('categoryId').lean()
	})
	let theProducts = await Promise.all(productsPromiseArray);
	// TODO: check there is no id replicas
	let productDecrementor = [];
	let decrementQuantity = function(){
		productDecrementor.forEach((product)=>{
			let decrementValue = -1 * product.quantity
			let key = 'details.'+product.detailIndex+'.quantity';
			Product.findByIdAndUpdate(product.productId, {
				$inc: {
					[key]: decrementValue
				}
			})
			.catch((err)=>{
				console.error(err);
			})
		})
	}
	try {
		let totalPrice = 0;
		theProducts.forEach((element, index)=>{
			if(!element){
				res.status(404).send({error: "Unknown element at index "+index});
				throw Error("Element unknown:", element);
			}
			let decrementObj = {
				productId: element._id
			};
			if(!products[index].details || !_.isArray(products[index].details) || products[index].details.length === 0){
				res.status(400).json({
					error: "Product details not provided or malformed"
				})
				throw Error("Product at index "+index+" has no details")
			}
			let detailIndex;
			if(!products[index].details[0].size){
				detailIndex = 0
			} else {
				detailIndex = _.findIndex(element.details, (entry)=>{
					return entry.size == products[index].details[0].size
				})
			}
			decrementObj.detailIndex = detailIndex;
			decrementObj.quantity = products[index].details[0].quantity;
			if(detailIndex < 0){
				res.status(400).json({
					error: "Specified size for product " + products[index]._id + "found"
				})
				throw Error("Size not found");
			}
			if(!products[index].details[0].quantity || products[index].details[0].quantity > element.details[detailIndex].quantity){
				res.status(400).json({
					error: "Quantity of product not sent or quatity is less than product quantity"
				});
				throw Error("Quantity conflict");
			}
			_checkProductAndSendFCMIfNeeded(products[index]._id)
			console.log(products[index], element)
			processedProducts.push({
				productId: element._id,
				price: products[index].details[0].quantity * element.price * (element.discount? 1 - (element.discount/100) : 1),
				details: products[index].details[0],
				nameEn: element.nameEn,
				nameAr: element.nameAr,
				brandId: element.brandId._id,
				brand: element.brandId.nameEn + " - " + element.brandId.nameAr,
				category: (element.categoryId)? element.categoryId.nameEn + " - " + element.categoryId.nameAr : "Deleted Category",
				imageUrl: element.photos.length > 1? element.photos[0] : undefined
			})
			totalPrice += element.price * products[index].details[0].quantity * (element.discount? 1 - (element.discount/100) : 1)
			productDecrementor.push(decrementObj);
		})
		console.log("TOTAL", totalPrice, "SF", shippingFees)
		console.log(processedProducts)
		totalPrice += shippingFees;
		totalPrice += (cashOnDeliveryFees || 0)
		let balanceToUse = 0;
		if(req.user.balance > 0){
			if(req.user.balance >= totalPrice){
				balanceToUse = req.user.balance - totalPrice;
			}
			balanceToUse = req.user.balance;
			await User.findByIdAndUpdate(req.user._id, {
				$inc: {
					balance: -totalPrice
				}
			})
		}
		switch(paymentMethod){
			case 'Credit Card':
				if(!creditCard){
					return res.status(400).json({
						error: "Credit card info missing"
					})
				}
				let theOrder = await Order.create({
					userId: req.user._id,
					price: totalPrice,
					shippingFees: shippingFees,
					paymentMethod,
					state: 'Pending',
					deliveryDate: moment().add(14, 'd').valueOf(),
					items:processedProducts,
					address,
					phone
				}).catch((err)=>console.log("Order failed to create created", err))
				if(!theOrder){
					res.status(500).json({
						error: "Order failed"
					})
					throw Error("Order failed. No order")
				}

				let theToken = (creditCard.cvn && !creditCard.cardNumber && !creditCard.nameOnCard && !creditCard.expiryMonth && !creditCard.expiryYear)? await CardToken.findOne({userId: req.user._id}) : await paymob.createCreditCardToken(req.user, creditCard.nameOnCard, creditCard.cardNumber, creditCard.expiryYear, creditCard.expiryMonth, creditCard.cvn).catch((err)=>{console.error(err); res.status(400).json({error: "Credit card info provided are not correct or incomplete"})})
				if(theToken){
					let paymentResponse = await paymob.pay(theToken.token, totalPrice * 100, req.user, creditCard.cvn).catch(async (err)=>{
						await Order.findByIdAndRemove(theOrder._id)
						res.status(400).json({
							error: "Failed to complete payment"
						})
					})
					if(paymentResponse && paymentResponse.status < 300){
						res.sendStatus(200)
						decrementQuantity()
					} else {
						await Order.findByIdAndRemove(theOrder._id)
						return res.status(400).json({
							error: "Couldn't complete payment"
						})
					}
				} else {
					await Order.findByIdAndRemove(theOrder._id).catch((err)=>console.error(err));
					res.status(400).send("Incorrect credit card info")
					throw Error("Incorrect credit card info")
				}
				break;
			case 'Cash On Delivery':
				await Order.create({
					userId: req.user._id,
					price: totalPrice,
					shippingFees: shippingFees,
					cashOnDeliveryFees,
					paymentMethod,
					state: 'Pending',
					deliveryDate: moment().add(14, 'd').valueOf(),
					items: processedProducts
				})
				res.sendStatus(201);
				decrementQuantity();
				break;
			default:
				return res.status(400).json({
					error: "Payment method invalid"
				})
		}
	} catch(err) {
		console.error(err);
		res.sendStatus(500);
	}
})

router.post('/orders/mock', authenticateUser, async (req, res)=>{
	let { products, shippingFees, address, phone, cashOnDeliveryFees } = req.body;
	if(!_.isArray(products) || products.length < 1 || !shippingFees){
		return res.sendStatus(400);
	}
	let processedProducts = [];
	let productsPromiseArray = products.map(element => {
		return Product.findById(element._id).populate('brandId').lean()
	})
	let theProducts = await Promise.all(productsPromiseArray);
	// TODO: check there is no id replicas
	try {
		let totalPrice = 0;
		theProducts.forEach((element, index)=>{
			if(!element){
				res.sendStatus(500);
				throw Error("Element unknown:", element);
			}
			if(!products[index].details[0]){
				res.status(400).json({
					error: "Product details not provided"
				})
				throw Error("Product at index "+index+" has no details")
			}
			let detailIndex;
			if(!products[index].details[0].size){
				detailIndex = 0
			} else {
				console.log("Element details", element.details, ". Sent details:", products[index].details)
				detailIndex = _.findIndex(element.details, (entry)=>{
					return entry.size == products[index].details[0].size
				})
			}
			if(detailIndex < 0){
				res.status(400).json({
					error: "Specified size for product " + products[index]._id + " not found. Allowed "+JSON.stringify(products[index].details[0])
				})
				throw Error("Size not found");
			}
			if(!products[index].details[0].quantity || products[index].details[0].quantity > element.details[detailIndex].quantity){
				res.status(400).json({
					error: "Quantity of product not sent or quatity is less than product quantity"
				});
				throw Error("Quantity conflict");
			}
			totalPrice += element.price * products[index].details[0].quantity * (element.discount? 1 - (element.discount/100) : 1)
			totalPrice += (cashOnDeliveryFees || 0)
		})
		let balanceToUse = 0;
		if(req.user.balance > 0){
			if(req.user.balance >= totalPrice){
				balanceToUse = req.user.balance - totalPrice;
			}
			balanceToUse = req.user.balance;
		}
		return res.status(200).json({
			products: theProducts,
			currentBalance: req.user.balance,
			balanceToBeUsed: balanceToUse,
			shippingFees: shippingFees,
			totalPrice,
			cashOnDeliveryFees,
			address,
			phone,
			deliveryDate: moment().add(14, 'd').format('DD/MM/YYYY')
		});
	} catch(err) {
		console.error("Caught error", err);
	}
})

router.get('/orders/:orderId', authenticateUser, (req, res)=>{
	let { orderId } = req.params;
	Order.findOne({
		_id: orderId,
		userId: req.user._id
	})
	.then((order)=>{
		if(order){
			return res.send(order);
		}
		res.sendStatus(404);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.post('/order/:orderId/cancel', authenticateUser, (req, res)=>{
	co(function*(){
		let order  = yield Order.findById(req.params.orderId)
		if(order.userId === req.user._id && order.status === 'Pending'){
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
.all(authenticateAdmin)
.post(async (req, res)=>{
	let { nameEn, nameAr, parentCategory } = req.body;
	let attrs = {nameEn, nameAr};
	if(nameEn || nameAr){
		let foundCategory = await Category.findOne({
			$or: [
				{nameEn},
				{nameAr}
			]
		});
		if(foundCategory){
			return res.sendStatus(409);
		}
	} else {
		return res.sendStatus(406);
	}
	if(parentCategory){
		let parent = await Category.findOne({_id: parentCategory}).lean();
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
.get(optionalAuthenticateUser, (req, res)=>{
	let { sortBy, sortDirection, filterByBrand, filterPriceFrom, filterPriceTo, pageNumber = 1 } = req.query;

	let filter = {};
	let sort = {};

	if(filterByBrand){
		try {
			filter.brandId = mongoose.Types.ObjectId(filterByBrand);
		} catch(err){
			console.error(err);
			return res.sendStatus(400);
		}
	}
	if(filterPriceFrom || filterPriceTo){
		filter.price = {};
		if(filterPriceFrom && _.isNumber(parseFloat(filterPriceFrom))){
			filter.price = Object.assign({}, filter.price, {$gte: parseFloat(filterPriceFrom)})
		}
		if(filterPriceTo && _.isNumber(parseFloat(filterPriceTo))){
			filter.price = Object.assign({}, filter.price, {$lte: parseFloat(filterPriceTo)})
		}
		if(Object.keys(filter.price).length < 1) delete filter.price;
	}
	
	if(sortBy){
		let direction = parseInt(sortDirection);
		sort[sortBy] = (direction && [1, -1].includes(direction))? direction : -1;
	}

	/* In all cases, sort by creation time */
	Object.assign(sort, {createdAt: -1});

	Category.findById(req.params.id).lean()
	.then((category)=>{
		if(category){
			return Product.find(Object.assign({}, {categoryId: category._id}, filter)).sort(sort).skip((parseInt(pageNumber) - 1)*15).limit(15).populate('brandId').lean();
		}
	})
	.then((products)=>{
		if(!products){
			return res.sendStatus(404);
		}
		_setFavourites(products, req.user)
		res.json(products);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})
.all(authenticateAdmin)
.put(async (req, res)=>{
	try {
		let { nameEn, nameAr, parentCategory } = req.body;
		if(!nameEn || !nameAr){
			return res.sendStatus(400);
		}
		let updateObject = {nameEn, nameAr};
		let theCategory = await Category.findById(req.params['id']).lean()
		if(parentCategory){
			let theParent = await Category.findById(parentCategory).lean()
			if(!theParent){
				return res.sendStatus(404);
			}
			Object.assign(updateObject, {parentCategory});
		} else {
			Object.assign(updateObject, {parentCategory: null});
		}
		if(!theCategory){
			return res.sendStatus(404);
		}
		console.log(updateObject);
		await Category.findByIdAndUpdate(theCategory._id, updateObject);
		res.sendStatus(200);
	} catch(err){
		console.error(err);
		return res.sendStatus(500);
	}
})
.delete(async (req, res)=>{
	try {
		let theCategory = await Category.findById(req.params['id']).lean()
		let children = await Category.find({parentCategory: req.params['id']}).lean()
		if(children && children.length > 0){
			return res.sendStatus(409);
		}
		if(!theCategory){
			return res.sendStatus(404);
		}
		await Category.deleteOne({_id: theCategory._id});
		await Product.deleteMany({categoryId: req.params['id']})
		return res.sendStatus(200);
	} catch(err){
		console.error(err);
		return res.sendStatus(500);
	}
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
.all(authenticateAdmin)
.post(upload.single('logo'), (req, res)=>{
	let { nameEn, nameAr } = req.body;
	let photoName = "brandImage-"+randomstring.generate()+((req.file)? "."+ path.extname(req.file.originalname) : "");
	let createBrand = function(){
		let params = { nameEn, nameAr };
		if(req.file){
			Object.assign(params, {
				logo: ('https://s3.eu-west-2.amazonaws.com/'
				+ (process.env.BUCKET_NAME || 'madeinegypt-test') + '/'
				+ photoName)
			})
		}
		console.log("PARAMS", params);
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
.get(optionalAuthenticateUser, (req, res)=>{
	let { sortBy, sortDirection, filterByBrand, filterPriceFrom, filterPriceTo, pageNumber = 1 } = req.query;

	let filter = {};
	let sort = {};

	if(filterByBrand){
		try {
			filter.brandId = mongoose.Types.ObjectId(filterByBrand);
		} catch(err){
			console.error(err);
			return res.sendStatus(400);
		}
	}
	if(filterPriceFrom || filterPriceTo){
		filter.price = {};
		if(filterPriceFrom && _.isNumber(parseFloat(filterPriceFrom))){
			filter.price = Object.assign({}, filter.price, {$gte: parseFloat(filterPriceFrom)})
		}
		if(filterPriceTo && _.isNumber(parseFloat(filterPriceTo))){
			filter.price = Object.assign({}, filter.price, {$lte: parseFloat(filterPriceTo)})
		}
		if(Object.keys(filter.price).length < 1) delete filter.price;
	}
	
	if(sortBy){
		let direction = parseInt(sortDirection);
		sort[sortBy] = (direction && [1, -1].includes(direction))? direction : -1;
	}

	/* In all cases, sort by creation time */
	Object.assign(sort, {createdAt: -1});

	let brand;
	Brand.findById(req.params.id).lean()
	.then((theBrand)=>{
		if(theBrand){
			brand = theBrand;
			return Product.find(Object.assign({}, {brandId: brand._id}, filter)).sort(sort).skip((parseInt(pageNumber) - 1)*15).populate('brandId').limit(15).lean()
		} else {
			return null;
		}
	})
	.then((products)=>{
		if(products){
			brand.products = products;
			_setFavourites(brand.products, req.user)
			res.json(brand)
		} else {
			res.sendStatus(404);
		}
	})
})
.all(authenticateAdmin)
.put(upload.single('logo'), async (req, res)=>{
	try {
		let theBrand = await Brand.findById(req.params['id']).lean();
		if(!theBrand){
			return res.sendStatus(404);
		}
		let { nameEn, nameAr } = req.body;
		if(!nameEn || !nameAr){
			return res.sendStatus(400);
		}
		let updateObject = { nameEn, nameAr }
		if(req.file){
			let logo = randomstring.generate(20);
			let uploaded = await publicS3.upload({
				Body: req.file.buffer,
				Key: logo,
				Bucket: process.env.BUCKET_NAME || 'madeinegypt-test'
			}).promise()
			Object.assign(updateObject, { logo: uploaded.Location })
			// Object.assign(updateObject, { logo: ('https://s3.eu-west-2.amazonaws.com/'
			// + (process.env.BUCKET_NAME || 'madeinegypt-test') + '/'
			// + logo) })
		}
		await Brand.findByIdAndUpdate(theBrand._id, updateObject, {new: true});
		return res.sendStatus(200);
	} catch(err){
		console.error(err);
		return res.sendStatus(500);
	}

})
.delete((req, res)=>{
	const brandId = req.params['id']
	// Order.aggregate([
	// 	{
	// 		$match: {state: 'Pending'}
	// 	},
	// 	{
	// 		$lookup: {
	// 			from: 'products',
	// 			localField: 'items.productId',
	// 			foreignField: '_id',
	// 			as: 'orderProducts'
	// 		}
	// 	},
	// 	{
	// 		$count: {'orderProducts.brandId': brandId}
	// 	}
	// ])

	// console.log("BRAND",brandId);
	// Order.findOne({
	// 	state: 'Pending',
	// 	'items.brand': brandId
	// }).lean()
	// .then((orders)=>{
	// 	console.log(orders);
	// })
	Order.findOne({
		state: 'Pending',
		'items.brand': brandId
	}).count()
	.then((count)=>{
		if(count > 0){
			return res.sendStatus(409)
		}
		// TODO: delete brand
		return Product.remove({
			brandId
		})
		.then((deletion)=>{
			console.log(deletion);
		})
		.then(()=>{
			return Brand.deleteOne({_id: brandId})
		})
		.then((deletion)=>{
			console.log(deletion);
			Product.deleteMany({brandId: brandId})
			.catch((err)=>{
				console.error(err);
			})
			res.sendStatus(200)
		})
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500)
	})
})

router.route('/image/:productId')
.delete(authenticateAdmin, async (req, res)=>{
	let { productId } = req.params;
	let { image } = req.query;
	if(!image){
		return res.sendStatus(400);
	}
	try {
		let product = await Product.findById(productId).lean();
		if(!product){
			return res.sendStatus(404);
		}
		await Product.findByIdAndUpdate(productId, {
			$pull: {
				photos: image
			}
		})
		res.sendStatus(204);
	} catch(err){
		console.error(err);
		res.sendStatus(500);
	}
})

router.route('/notifications')
.post(authenticateAdmin, (req, res)=>{
	// let { targetAudience, message } = req.body;
	// if(!targetAudience || !message){
	// 	return res.sendStatus(400);
	// }
	// const ref = firebaseDB.ref(`/notifications/${targetAudience}`);
	// ref.push(message, (err)=>{
	// 	if(err){
	// 		console.error(err);
	// 		return res.status(500).send("Error occured will adding message to user's notifications");
	// 	}
	// 	res.status(201).send("Pushed");
	// })
	res.sendStatus(501);
})

router.put('/fcmtoken', authenticateUser, (req, res)=>{
	let { token } = req.body;
	User.findByIdAndUpdate(req.user._id, {
		fcmToken: token
	}, {
		new: true
	})
	.then((updated)=>{
		console.log("Updated FCM Token is", updated.fcmToken);
		res.sendStatus(200);
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500);
	})
})

router.route('/config')
.get((req, res)=>{
	publicS3.getObject({
		Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
		Key: "config/config.json"
	}).promise()
	.then((configFile)=>{
		res.json(JSON.parse(Buffer.from(configFile.Body).toString()));
	})
	.catch((err)=>{
		console.error(err);
		res.sendStatus(500)
	})
})
.put(authenticateAdmin, (req, res)=>{
	let { cashOnDeliveryFees = 5, shippingFees = 15, freeShippingMinimumOrder = 250, address = "N/A", phone = "N/A" } = req.body;
	let file = Buffer.from(`
	{
		"cashOnDeliveryFees": ${cashOnDeliveryFees},
		"shippingFees": ${shippingFees},
		"freeShippingMinimumOrder": ${freeShippingMinimumOrder},
		"address": "${address}",
		"phone": "${phone}"
	}
	`);
	publicS3.putObject({
		Body: file,
		Bucket: process.env.BUCKET_NAME || 'madeinegypt-test',
		Key: "config/config.json"
	}).promise()
	.then(upload => res.sendStatus(200))
	.catch((err) => {
		console.error(err)
		res.sendStatus(500);
	})
})



module.exports = router;
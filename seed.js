const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = {
	products: async function(){
		let file = fs.readFileSync(path.join('/home/omar/Downloads','MOCK_DATA.json'))
		await mongoose.connect('mongodb://admin:admin@ds233238.mlab.com:33238/madeinegypt');
		let myfile = JSON.parse(file);
		return await Product.create(myfile);
	},
	categories: async function(){
		await mongoose.connect('mongodb://admin:admin@ds233238.mlab.com:33238/madeinegypt');
		await Category.create([
			{name: "Men's fashion"},
			{name: "Woman's fashion"},
			{name: "Furniture"},
			{name: "Electronics"},
			{name: "Appliances"},
		])
		return "DONE"
	},
	subCategories: async function(){
		await mongoose.connect('mongodb://admin:admin@ds233238.mlab.com:33238/madeinegypt');
		let allCategories = await Category.find().lean();
		let cats = [];
		_.times(20, (num)=>{
			let rand = Math.floor(Math.random()*5);
			cats.push({name: "Category "+num, parentCategory: allCategories[rand]});
		})
		await Category.create(cats);
		return "DONE"
	},
	brands: async function(){
		await mongoose.connect('mongodb://admin:admin@ds233238.mlab.com:33238/madeinegypt');
		let file = fs.readFileSync(path.join('/home/omar/Downloads','MOCK_DATA (1).json'))
		return await Brand.create(JSON.parse(file));
	},
	updateProducts: async function(){
		await mongoose.connect('mongodb://admin:admin@ds233238.mlab.com:33238/madeinegypt');
		let brands = await Brand.find().lean();
		let categories = await Category.find().lean();
		let products = await Product.find();
		let promiseArray = [];
		products.forEach((entry)=>{
			let brandAssigned = brands[Math.floor(Math.random()*brands.length)];
			let categoryAssigned = categories[Math.floor(Math.random()*categories.length)];
			entry.categoryId = categoryAssigned._id;
			entry.brandId = brandAssigned._id;
			promiseArray.push(entry.save());
		})
		await promiseArray;
		return "done with "+promiseArray.length;
	}
}
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const ItemOrderSchema = new Schema({
	price: {
		type: Number,
		required: true
	},
	productId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Product'
	},
	quantity: {
		type: Number,
		required: true
	},
	productDetails: Object
})

const OrderSchema = new Schema({
	price: {
		type: Number,
		require: true
	},
	items: {
		type: [ItemOrderSchema],
		required: true
	},
	paymentMethod: {
		type: String,
		required: true,
		enum: ['Credit Card', 'Cash On Delivery']
	},
	state: {
		type: String,
		required: true,
		enum: ['Pending', 'Cancelled', 'On Route', 'Delivered']
	}
})

module.exports = mongoose.model('Order', OrderSchema);
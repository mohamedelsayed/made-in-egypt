const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
	price: {
		type: Number,
		required: true
	},
	productId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Product'
	},
	details: {
		type: Schema.Types.Mixed,
		required: true
	}
}, {
	timestamps: true
})

const OrderSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	totalPrice: {
		// With shipping
		type: Number,
		require: true
	},
	shippingFees: {
		type: Number,
		required: true
	},
	items: {
		type: [OrderItemSchema],
		required: true,
		validate: {
			validator: function(value){
				return value.length > 0
			},
			msg: "Cannot create order with no items"
		}
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
	},
	deliveryDate: {
		type: Date,
		required: true
	},
}, {
	timestamps: true
})

module.exports = mongoose.model('Order', OrderSchema);
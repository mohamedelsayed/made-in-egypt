const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	phone: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	favourites: {
		type: [Schema.Types.ObjectId],
		required: true,
		ref: 'Product'
	},
	verified: {
		type: Boolean,
		required: true
	},
	// orders: {
	// 	type: [Schema.Types.ObjectId],
	// 	required: true,
	// 	ref: 'Product'
	// },
}, {
	timestamps: true
})

module.exports = mongoose.model('User', UserSchema);
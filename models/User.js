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
		required: true
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
	// orders: {
	// 	type: [Schema.Types.ObjectId],
	// 	required: true,
	// 	ref: 'Product'
	// },
	creditCard: {
		type: Object
	}
})

module.exports = mongoose.model('User', UserSchema);
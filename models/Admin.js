const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

let AdminSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	master: {
		type: Boolean,
		required: true
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('Admin', AdminSchema);
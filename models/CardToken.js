const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const CardTokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	token: {
		type: String,
		required: true
	},
	maskedPan: {
		type: String,
		required: true
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('CardToken', CardTokenSchema);
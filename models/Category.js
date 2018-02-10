const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
	name: {
		type: String,
		required: true
	},
	parentCategory: {
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}
}, {
	timestamps: true
})

module.exports = mongoose.model('Category', CategorySchema);
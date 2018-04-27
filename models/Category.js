const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
	nameEn: {
		type: String,
		required: true,
		unique: true
	},
	nameAr: {
		type: String,
		required: true,
		unique: true
	},
	parentCategory: {
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}
}, {
	timestamps: true
})

CategorySchema.index({
	nameEn: "text",
	nameAr: "text"
})

module.exports = mongoose.model('Category', CategorySchema);
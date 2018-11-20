const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;
const validGovernrate = [
	'Giza',
	'Qalyubia',
	'Alexandria',
	'Aswan',
	'Asyut',
	'Beheira',
	'BeniSuef',
	'Dakahlia',
	'Damietta',
	'Faiyum',
	'Gharbia',
	'Ismailia',
	'KafrElSheikh',
	'Luxor',
	'Matruh',
	'Minya',
	'Monufia',
	'NewValley',
	'NorthSinai',
	'SouthSinai',
	'PortSaid',
	'Qena',
	'RedSea',
	'Sharqia',
	'Sohag',
	'Suez'
];

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
	governorate: {
		type: String,
		enum: ['Cairo', 'Giza',
			'Qalyubia',
			'Alexandria',
			'Aswan',
			'Asyut',
			'Beheira',
			'BeniSuef',
			'Dakahlia',
			'Damietta',
			'Faiyum',
			'Gharbia',
			'Ismailia',
			'KafrElSheikh',
			'Luxor',
			'Matruh',
			'Minya',
			'Monufia',
			'NewValley',
			'NorthSinai',
			'SouthSinai',
			'PortSaid',
			'Qena',
			'RedSea',
			'Sharqia',
			'Sohag',
			'Suez'
		],
		required: true

	},
	gender: {
		type: String,
		enum: ["male", "female"],
		// required: true
	},
	favourites: {
		type: [{
			type: Schema.Types.ObjectId,
			ref: 'Product'
		}],
		required: true
	},
	verified: {
		type: Boolean,
		required: true,
		default: false
	},
	fcmToken: {
		type: String
	}
	// orders: {
	// 	type: [Schema.Types.ObjectId],
	// 	required: true,
	// 	ref: 'Product'
	// },
}, {
		timestamps: true
	})

module.exports = mongoose.model('User', UserSchema);
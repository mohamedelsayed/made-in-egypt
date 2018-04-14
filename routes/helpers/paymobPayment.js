const crypto = require('crypto');
const axios = require('axios').default;
// axios.defaults.validateStatus = function(status){
// 	return status > 500;
// }
axios.defaults.headers.post['Content-Type'] = "application/json"

const CardToken = require('../../models/CardToken');

const { paymob } = require('./config');

const authentication = function(){
	return axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
		username: paymob.username,
		password: paymob.password
	})
}

const orderRegistration = function(token, merchantId, amount, currency, merchantOrderId, user){
	return axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders?token='+token, {
		delivery_needed: "false",
		merchant_id: merchantId,
		amount_cents: amount,
		currency: currency || "EGP",
		merchant_order_id: merchantOrderId,
		items: [],
		shipping_data: {
			first_name: user.firstName,
			last_name: user.lastName,
			phone_number: user.phone,
			email: user.email,
			apartment: "Not specified",
			floor: "Not specified",
			street: "Not specified",
			building: "Not specified",
			postal_code: "Not specified",
			country: "Not specified",
			city: "Not specified",
		}
	})
}

const paymentKey = function(token, amount, orderId, expiration, user, currency){
	return axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys?token='+token, {
		amount_cents: amount,
		expiration: expiration || 36000,
		card_integration_id: paymob.cardIntegrationId,
		currency: currency || "EGP",
		billing_data: {
			first_name: user.firstName,
			last_name: user.lastName,
			phone_number: user.phone || "not specified",
			email: user.email,
			shipping_method: "DG",
			apartment: "not specified",
			floor: "not specified",
			street: "not specified",
			building: "not specified",
			city: "not specified",
			country: "not specified",
			state: "not specified"
		}
	})
}

const payOrder = function(token, cvn, user, paymentKeyToken){
	return axios.post('https://accept.paymobsolutions.com/api/acceptance/payments/pay', {
		source: {
			identifier: token,
			subtype: "TOKEN",
			cvn: cvn
		},
		billing: {
			first_name: user.firstName,
			last_name: user.lastName,
			email: user.email,
			phone_number: user.phone || "not specified"
		},
		payment_token: paymentKeyToken
	})
}

const tokenization = function(token, user, cardNumber, cardHolderName, expiryMonth, expiryYear, cvn){
	return axios.post('https://accept.paymobsolutions.com/api/acceptance/tokenization?payment_token='+token, {
		pan: cardNumber,
		cardholder_name: cardHolderName,
		expiry_month: expiryMonth,
		expiry_year: expiryYear,
		cvn: cvn,
		email: user.email
	})
}

module.exports = {
	pay: async function(requestedCardToken, amount, user, cvn){
		if(!(requestedCardToken && amount && user && cvn)){
			throw Error("Paramters sent are incomplete");
		}
		let cardToken = await CardToken.findOne({userId: user._id, token: requestedCardToken}).lean()
		let authResponse = await authentication();
		let {token, profile} = authResponse.data;
		let merchantId = profile.id;
		let merchantOrderId = crypto.randomBytes(8).toString('base64').toUpperCase();
		let orderRegistrationResponse = await orderRegistration(token, merchantId, amount, null, merchantOrderId, user);
		let paymobOrderIdFromResponse = orderRegistrationResponse.data.id;
		let paymentKeyResponse = await paymentKey(token, amount, paymobOrderIdFromResponse, null, user, null);
		let paymentKeyToken = paymentKeyResponse.data.token;
		let payOrderResponse = await payOrder(cardToken.token, cvn, user, paymentKeyToken);
		// 27c27d9709df79abd680e8374950903399e91e35c4a79cff53862ae4
		// 8772e3807cffc63e3a5c1ef28a0fc3adc902f9066e1bda0e7e1b798d
		// let payOrderResponse = await payOrder("27c27d9709df79abd680e8374950903399e91e35c4a79cff53862ae4", cvn, user, paymentKeyToken);
		return payOrderResponse;
	},
	createCreditCardToken: async function(user, cardHolderName, cardNumber, expiryYear, expiryMonth, cvn){
		if(!(user && cardHolderName && cardNumber && expiryYear && expiryMonth && cvn)){
			throw Error("Parameters sent are incomplete. Sent: "+user +"\n"+ cardHolderName +"\n"+ cardNumber +"\n"+ expiryYear +"\n"+ expiryMonth +"\n"+ cvn);
		}
		let authResponse = await authentication();
		let {token} = authResponse.data;
		let paymentKeyResponse = await paymentKey(token, 0, null, null, user, null);
		console.log(paymentKeyResponse.data)
		let paymentKeyToken = paymentKeyResponse.data.token;
		let tokenizationResponse = await tokenization(paymentKeyToken, user, cardNumber, cardHolderName, expiryMonth, expiryYear, cvn);
		console.log(tokenizationResponse.data);
		return tokenization.data;
		let createdCardToken = await CardToken.create({
			user: user._id,
			token: tokenizationResponse.data.token,
			maskedPan: tokenizationResponse.data.masked_pan,
			cardSubType: tokenizationResponse.data.card_subtype
		})
		return createdCardToken;
	}
}
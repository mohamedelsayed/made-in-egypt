module.exports = {
	jwtSecret: process.env.JWT_SECRET || 'sUG6akIrGG4T5eEGTc6Caau825btqttL1uPZlCqx',
	paymob: {
		username: process.env.PAYMOB_USERNAME || "MadeInEgypt",
		password: process.env.PAYMOB_PASSWORD || "MyP@ssw0rd1",
		cardIntegrationId: process.env.PAYMOB_CID || "1141"
	},
	shippingFees: parseInt(process.env.SHIPPING_FEE) || 20
}

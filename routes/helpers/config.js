module.exports = {
	jwtSecret: process.env.JWT_SECRET || 'sUG6akIrGG4T5eEGTc6Caau825btqttL1uPZlCqx',
	paymob: {
		username: "MadeInEgypt" || process.env.PAYMOB_USERNAME,
		password: "MyP@ssw0rd1" || process.env.PAYMOB_PASSWORD,
		cardIntegrationId: "1141" || process.env.PAYMOB_CID
	}
}
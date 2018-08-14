const nodeMailer = require('nodemailer');
const _ = require('lodash');
const emailUser = "no-reply@madeinegyptapp.com";
const emailPassword = "a9535b1571f865f7edb1c76e";
const transport = nodeMailer.createTransport({
	host: 'smtp.zoho.com',
	port: 465,
	secure: true,
	auth: {
		user: emailUser,
		pass: emailPassword
	}
});

module.exports = {
	checkEmailFormat: function(email){
		const regularExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return regularExpression.test(email);
	},
	sendAutoEmail: function(subject, text, recepient){
		return new Promise((resolve, reject)=>{
			if(_.isString(subject) && subject.length > 0 && _.isString(text) && text.length > 0 && (_.isArray(recepient) || (_.isString(recepient)))){
				const regularExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if(_.isArray(recepient)){
					let validEmails = recepient.every((value)=>{
						return _.isString(value) && regularExpression.test(value.toLowerCase())
					})
					if(!validEmails){
						reject("Email recepient(s) not valid");
					}
				} else {
					let valid = regularExpression.test(recepient);
					if(!valid){
						reject("Email recepient not valid");
					}
				}
			} else {
				reject(`Arguments sent are malformed. Sent subject: ${subject} \ntext: ${text} \nrecepient(s):${recepient}`)
			}
			transport.sendMail({
				from: `"Made In Egypt App" <${emailUser}>`,
				to: (_.isArray(recepient))? recepient.join(", ") : recepient,
				subject, text, 
				html: `
					<div style="padding: 20px 40px; text-align: center">
						<p style="font-size: 24px;">${text}</p>
					</div>
					`
			}, (err, info)=>{
				if(err){
					reject(err);
				}
				resolve(info);
			})
		})
	}
}
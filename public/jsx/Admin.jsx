import React from 'react';
import axios from 'axios';

export default class Admin extends React.Component {
	constructor(){
		super();
		this.state = {
			oldPassword: "",
			newPassword: "",
			newPasswordRepeat: "",
			passwordError: ""
		}
	}

	handleChangePassword = ()=>{
		if(this.state.oldPassword === this.state.newPassword){
			return this.state.setState({passwordError: "Old and new password cannot match"})
		}
		if(this.state.newPassword === this.state.newPasswordRepeat){
			if(this.state.newPassword.length < 6){
				return this.setState({passwordError: "Password is too short"})
			}
			// TODO: send password change requests
		} else {
			return this.setState({passwordError: "Passwords don't match"});
		}
	}

	render(){
		return(
			<div>
				<div>
					{/* TODO: Change password */}
				</div>
				<div>
					{/* TODO: Add new admin */}
				</div>
				<div>
					{/* TODO: Generate reports */}
				</div>
			</div>
		)
	}
}

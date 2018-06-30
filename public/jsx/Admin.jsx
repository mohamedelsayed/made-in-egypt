import React from 'react';
import axios from 'axios';
import { Button } from 'semantic-ui-react';

export default class Admin extends React.Component {
	constructor(){
		super();
		this.state = {
			oldPassword: "",
			newPassword: "",
			newPasswordRepeat: "",
			passwordError: "",
			passwordMessage: ""
		}
	}

	handleChangePassword = ()=>{
		if(this.state.oldPassword === this.state.newPassword){
			return this.setState({passwordError: "Old and new password cannot match"})
		}
		if(this.state.newPassword === this.state.newPasswordRepeat){
			if(this.state.newPassword.length < 6){
				return this.setState({passwordError: "Password is too short"})
			}
			// TODO: send password change requests
			axios.put('/api/admins', {
				oldPassword: this.state.oldPassword,
				newPassword: this.state.newPassword
			}, {
				headers: {
					'x-auth-token': localStorage.getItem('auth')
				},
				validateStatus: function(status){
					return status < 500
				}
			})
			.then((response)=>{
				if(response.status < 300){
					this.setState({oldPassword: "", newPassword: "", newPasswordRepeat: "", passwordError: "", passwordMessage: "Password changed successfully"}, ()=>{
						setTimeout(()=>{
							this.setState({passwordMessage: ""})
						}, 5000)
					})
				} else {
					this.setState({oldPassword: "", newPassword: "", newPasswordRepeat: "", passwordError: response.data.error})
				}
			})
			.catch((err)=>{
				console.error(err);
				this.setState({passwordError: "Something went wrong"});
			})
		} else {
			return this.setState({passwordError: "Passwords don't match"});
		}
	}

	render(){
		const inputFieldStyle = {
			borderWidth: 1,
			borderColor: '#eee',
			borderRadius: 2,
			padding: '3px 5px',
			marginBottom: '3px'
		}
		return(
			<div style={{padding: '10px 20px'}}>
				<div>
					<h2>Change Password</h2>
					{
						this.state.passwordError?
						<div style={{color: 'red', padding: '20px'}}>
							{this.state.passwordError}
						</div>
						:
						null
					}
					{
						this.state.passwordMessage?
						<div style={{color: 'teal', padding: '20px'}}>
							{this.state.passwordMessage}
						</div>
						:
						null
					}
					<input type="password" value={this.state.oldPassword} placeholder="Old Password" onChange={(event)=>this.setState({oldPassword: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					<input type="password" value={this.state.newPassword} placeholder="New Password" onChange={(event)=>this.setState({newPassword: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					<input type="password" value={this.state.newPasswordRepeat} placeholder="New Password Repeat" onChange={(event)=>this.setState({newPasswordRepeat: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					<Button onClick={this.handleChangePassword}>Change</Button>
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

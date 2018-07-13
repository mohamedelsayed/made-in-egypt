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
			passwordMessage: "",
			newAdminUsername: "",
			newAdminPassword: "",
			newAdminPasswordRepeat: "",
			newAdminError: "",
			newAdminMessage: "",
			cashOnDeliveryFees: 0,
			shippingFees: 0,
			freeShippingMinimumOrder: 0,
			configError: "",
			configDisabled: true
		}
	}

	componentDidMount(){
		axios.get('/api/config')
		.then((response)=>{
			let { cashOnDeliveryFees, shippingFees, freeShippingMinimumOrder } = response.data
			this.setState({cashOnDeliveryFees, shippingFees, freeShippingMinimumOrder, configDisabled: false})
		})
		.catch((err)=>{
			console.error(err);
		})
	}

	handleChangePassword = ()=>{
		if(this.state.oldPassword === this.state.newPassword){
			return this.setState({passwordError: "Old and new password cannot match"})
		}
		if(this.state.newPassword === this.state.newPasswordRepeat){
			if(this.state.newPassword.length < 6){
				return this.setState({passwordError: "Password is too short"})
			}
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

	handleNewAdmin = ()=>{

		if(this.state.newAdminPassword === this.state.newAdminPasswordRepeat){
			if(this.state.newAdminPassword.length < 6){
				return this.setState({passwordError: "Password is too short"})
			}
			axios.post('/api/admins', {
				username: this.state.newAdminUsername,
				password: this.state.newAdminPassword,
				master: this.state.masterAdmin
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
					this.setState({newAdminUsername: "", newAdminPassword: "", newAdminPasswordRepeat: "", newAdminError: "", newAdminMessage: "Admin created successfully"}, ()=>{
						setTimeout(()=>{
							this.setState({newAdminMessage: ""})
						}, 5000)
					})
				} else {
					this.setState({newAdminUsername: "", newAdminPassword: "", newAdminPasswordRepeat: "", newAdminError: response.data.error})
				}
			})
			.catch((err)=>{
				console.error(err);
				this.setState({newAdminError: "Something went wrong"});
			})
		} else {
			return this.setState({newAdminError: "Passwords don't match"});
		}
	}

	handleEditConfig = ()=>{
		this.setState({configDisabled: true})
		axios.put('/api/config', {
			cashOnDeliveryFees: this.state.cashOnDeliveryFees,
			shippingFees: this.state.shippingFees,
			freeShippingMinimumOrder: this.state.freeShippingMinimumOrder
		}, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.componentDidMount();
		})
		.catch((err)=>{
			this.setState({configError: "Something went wrong"})
			console.error(err);
		})
		.then(()=>{
			this.setState({configDisabled: false});
		})
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
					<h2>Create New Admin</h2>
					{
						this.state.newAdminError?
						<div style={{color: 'red', padding: '20px'}}>
							{this.state.newAdminError}
						</div>
						:
						null
					}
					{
						this.state.newAdminMessage?
						<div style={{color: 'teal', padding: '20px'}}>
							{this.state.newAdminMessage}
						</div>
						:
						null
					}
					<input type="text" value={this.state.newAdminUsername} placeholder="Username" onChange={(event)=>this.setState({newAdminUsername: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					<input type="password" value={this.state.newAdminPassword} placeholder="New Password" onChange={(event)=>this.setState({newAdminPassword: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					<input type="password" value={this.state.newAdminPasswordRepeat} placeholder="New Password Repeat" onChange={(event)=>this.setState({newAdminPasswordRepeat: event.currentTarget.value})} style={inputFieldStyle} /><br/>
					Warehouse Admin? <input type="checkbox" value={!this.state.masterAdmin} onChange={(event)=>this.setState({masterAdmin: !event.currentTarget.checked})} /><br />
					<Button onClick={this.handleNewAdmin}>Create</Button>
				</div>
				<div>
					{/* TODO: Edit configs */}
					<h2>Edit Configuration</h2>
					{
						this.state.configError?
						<div style={{color: 'red', padding: '20px'}}>
							{this.state.configError}
						</div>
						:
						null
					}
					Cash On Delivery Fees: <input disabled={this.state.configDisabled} type="number" value={this.state.cashOnDeliveryFees} min="0" onChange={(event)=>this.setState({cashOnDeliveryFees: event.currentTarget.valueAsNumber})} /><br/>
					Shipping Fees: <input disabled={this.state.configDisabled} type="number" value={this.state.shippingFees} min="0" onChange={(event)=>this.setState({shippingFees: event.currentTarget.valueAsNumber})} /><br/>
					Free Shipping Minimum Order: <input disabled={this.state.configDisabled} type="number" value={this.state.freeShippingMinimumOrder} min="0" onChange={(event)=>this.setState({freeShippingMinimumOrder: event.currentTarget.valueAsNumber})} /><br/>
					<Button onClick={this.handleEditConfig}>Edit</Button>
				</div>
				<div>
					{/* TODO: Generate reports */}
				</div>
			</div>
		)
	}
}

import React from 'react';
import axios from 'axios';
import { Button, Table, Modal, Dropdown } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';

import moment from 'moment';

import 'react-datepicker/dist/react-datepicker.css';

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
			configDisabled: true,
			admins: [],
			deleteOpen: false,
			adminDeleteTarget: undefined,
			reportStartDate: undefined,
			reportEndDate: undefined,
			brands: [],
			selectedBrand: undefined
		}
	}

	componentDidMount(){
		axios.get('/api/config')
		.then((response)=>{
			let { cashOnDeliveryFees, shippingFees, freeShippingMinimumOrder } = response.data
			this.setState({cashOnDeliveryFees, shippingFees, freeShippingMinimumOrder, configDisabled: false})
			return axios.get('/api/admins', {
				headers: {
					'x-auth-token': localStorage.getItem('auth')
				}
			})
		})
		.then((response)=>{
			this.setState({admins: response.data});
			return axios.get('/api/brands')
		})
		.then((response)=>{
			this.setState({brands: response.data});
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

	handleDelete = ()=>{
		axios.delete(`/api/admins/${this.state.adminDeleteTarget._id}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({deleteOpen: false, adminDeleteTarget: undefined}, this.componentDidMount);
		})
		.catch(err=>console.error(err));
	}

	generateReport = ()=>{
		if(!(this.state.reportStartDate && this.state.reportEndDate)){
			return console.warn("Report start date or end date missing");
		}
		let start = moment(this.state.reportStartDate).valueOf();
		let end = moment(this.state.reportEndDate).valueOf();

		axios.post('/api/admin/report', {
			start, end
		}, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.catch((err)=>{
			console.error(err);
		})
	}

	render(){
		const actionBtnStyle = {
			margin: '3px'
		}
		const inputFieldStyle = {
			borderWidth: 1,
			borderColor: '#eee',
			borderRadius: 2,
			padding: '3px 5px',
			marginBottom: '3px'
		}
		return(
			<div style={{padding: '10px 20px'}}>
				<Modal
					header={"Delete Admin?"}
					actions={[
						<Button style={actionBtnStyle} key={"deleteCategoryNo"} onClick={()=>this.setState({deleteOpen: false, adminDeleteTarget: undefined})} >No</Button>,
						<Button style={actionBtnStyle} key={"deleteCategoryYes"} onClick={this.handleDelete}>Yes</Button>
					]}
					onClose={()=>this.setState({deleteOpen: false, adminDeleteTarget: undefined})}
					open={this.state.deleteOpen}
				/>
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
				<div style={{marginTop: 10}}>
					{/* TODO: Generate reports */}
					<h1>Sales Report</h1>
					<label>Start Date: </label>
					<DatePicker
						dateFormat="DD/MM/YYYY"
						selected={this.state.reportStartDate}
						onChange={(date)=>this.setState({reportStartDate: date})}
					/>
					{/* <input type="date" onChange={(event)=>this.setState({reportStartDate: event.currentTarget.valueAsDate})}/> */}
					<label>End Date: </label>
					<DatePicker
						dateFormat="DD/MM/YYYY"
						selected={this.state.reportEndDate}
						onChange={(date)=>this.setState({reportEndDate: date})}
					/>
					{/* <input type="date" onChange={(event)=>this.setState({reportEndDate: event.currentTarget.valueAsDate})}/> */}
					<label>Brand:</label><br />
					<Dropdown style={{marginRight: 15}} options={[{key: "none", value: null, text: "Choose Brand"}].concat(this.state.brands.map((brand)=>{
						return {
							key: brand._id,
							value: brand._id,
							text: brand.nameEn + " - " + brand.nameAr
						}
					}))} onChange={(event, data)=>this.setState({selectedBrand: data.value})} defaultValue={null} />
					<Button onClick={this.generateReport}>
						Generate Report
					</Button>
				</div>
				<div style={{marginTop: 10}}>
					<Table celled striped>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell colSpan='3'>Admins ({this.state.admins.length})</Table.HeaderCell>
							</Table.Row>
							<Table.Row>
								<Table.HeaderCell textAlign='center'>Username</Table.HeaderCell>
								<Table.HeaderCell textAlign='center'>Type</Table.HeaderCell>
								<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{
								this.state.admins.map((admin)=>{
									return(
										<Table.Row key={Math.random()+"admin"}>
											<Table.Cell width="1" collapsing textAlign='center'>{admin.username}</Table.Cell>
											<Table.Cell width="1" collapsing textAlign='center'>{admin.master? "Master": "Warehouse"}</Table.Cell>
											<Table.Cell width="1" collapsing textAlign='center'>
												<Button onClick={()=>this.setState({adminDeleteTarget: admin, deleteOpen: true})}>
													Delete
												</Button>
											</Table.Cell>
										</Table.Row>
									)
								})
							}
						</Table.Body>
					</Table>
				</div>
			</div>
		)
	}
}

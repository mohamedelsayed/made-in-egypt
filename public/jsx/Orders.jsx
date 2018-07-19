import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Dropdown, Radio, Loader, Menu } from 'semantic-ui-react'

import axios from 'axios';

export default class Orders extends Component {
	constructor(){
		super();
		this.state = {
			orders: [],
			pageNumber: 1,
			filterMethod: undefined,
			filterStatus: undefined
		}
	}
	componentDidMount(){
		axios.get(`/api/admin/orders`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({orders: response.data});
		})
		.catch((err)=>{
			console.error(err);
		})
	}
	handleUpdatePage = ()=>{
		axios.get(`/api/admin/orders?pageNumber=${this.state.pageNumber}${this.state.filterMethod? '&method='+this.state.filterMethod: ''}${this.state.filterStatus? '&status='+this.state.filterStatus: ''}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({orders: response.data});
		})
		.catch((err)=>{
			console.error(err);
		})
	}
	changeOrderState = (orderId, newState)=>{
		axios.put(`/api/admin/orders/${orderId}`, {
			state: newState
		}, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then(()=>{
			this.handleUpdatePage();
		})
		.catch((err)=>{
			console.error(err);
		})
	}
	render(){
		const actionBtnStyle = {
			margin: '3px'
		}
		return(
			<div style={{padding: '15px', overflowX: 'scroll'}}>
				<h1 style={{textAlign: 'center'}}>Orders</h1>
				{/* <Modal
					trigger={<Button>Create New Order</Button>}
					header="New Order"
					content={<OrderForm context={this} />}
				/> */}
				<Dropdown
					placeholder="Payment Method"
					options={[
						{key: "Allpayments", text: "All", value: null},
						{key: "Credit Card payments", text: "Credit Card", value: "Credit Card"},
						{key: "Cash payments", text: "Cash On Delivery", value: "Cash On Delivery"},
					]}
					onChange={(event, data)=>this.setState({filterMethod: data.value})}
				/>
				<Dropdown
					placeholder="Status"
					options={[
						{key: "Allstatus", text: "All", value: null},
						{key: "Cancelled order", text: "Cancelled", value: "Cancelled"},
						{key: "Pending order", text: "Pending", value: "Pending"},
						{key: "User processing order", text: "User Processing", value: "User Processing"},
						{key: "Completed order", text: "Completed", value: "Completed"},
					]}
					onChange={(event, data)=>this.setState({filterStatus: data.value})}
				/>
				<Button onClick={()=>{
					this.setState({pageNumber: 1}, this.handleUpdatePage)
				}}>
					Filter
				</Button>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='12'>Orders ({this.state.orders.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>Buyer Email</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Buyer Phone</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Buyer Address</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Shipping Fee</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Payment Method</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>State</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Delivery Date</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Items</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Total Price</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.orders.map((order)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, orderId, orderId, orderDetailsEn, orderDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing textAlign='center'>{order.userId.email}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.phone || order.userId.phone}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.address || order.userId.address}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.shippingFees}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.paymentMethod}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.state}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.deliveryDate}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>
										{order.items.map(item => <div key={Math.random()} style={{border: '1px solid black', borderRadius: '1px', marginBottom: '1px'}}>
											{/* {item.productId.nameEn} - {item.productId.nameAr}: {item.quantity}<br /> */}
											{
												item.productId?
												<div>
													{item.nameEn + " - " + item.nameAr/*  + " : " + item.details.quantity */}
												</div>
												:
												<div>
													"Product Deleted: "+{item.nameEn + " - " + item.nameAr/*  + " : " + item.details.quantity */}
												</div>
											}
											{JSON.stringify(item.details)}
										</div>)}
									</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>
									{
										order.items.reduce((accumilator, item)=>{
											return accumilator + item.price
										}, 0)
									}
									</Table.Cell>
									<Table.Cell width="1" textAlign='center'>
										{
											(order.state === 'Pending')?
											<Button style={actionBtnStyle} onClick={()=>{
												this.changeOrderState(order._id, 'Under Processing');
												window.open('/api/admin/print/'+order._id+"?token="+localStorage.getItem('auth'), "_blank")
											}}>Accept & Print</Button>
											:
											null
										}
										{
											(order.state === 'Under Processing')?
											<Button style={actionBtnStyle} onClick={()=>this.changeOrderState(order._id, 'Completed')}>Confirm</Button>
											:
											null
										}
										{
											(order.state === 'Pending' || order.state === 'Under Processing')?
											<Button style={actionBtnStyle} onClick={()=>this.changeOrderState(order._id, 'Cancelled')}>Cancel</Button>
											:
											null
										}
									</Table.Cell>
								</Table.Row>
								)
							})
						}
					</Table.Body>
					<Table.Footer>
						<Table.Row>
							<Table.HeaderCell colSpan='15'>
								<Menu floated='right' pagination>
									{/* <Menu.Item as='a' icon>
										<Icon name='chevron left' />
									</Menu.Item> */}
									{
										(this.state.pageNumber > 1)?
										<Menu.Item as='a' onClick={()=>{
											this.setState({pageNumber: this.state.pageNumber - 1}, ()=>{
												this.handleUpdatePage();
											})
										}}>Previous</Menu.Item>
										:
										null
									}
									<Menu.Item as='a' onClick={()=>{
										this.setState({pageNumber: this.state.pageNumber + 1}, ()=>{
											this.handleUpdatePage();
										})
									}}>Next</Menu.Item>
									{/* <Menu.Item as='a'>3</Menu.Item>
									<Menu.Item as='a'>4</Menu.Item>
									<Menu.Item as='a' icon>
										<Icon name='chevron right' />
									</Menu.Item> */}
								</Menu>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Footer>
				</Table>
			</div>
		)
	}
}

// class OrderForm extends Component {
// 	constructor(){
// 		super();
// 		this.state = {
// 			creating: false
// 		}
// 		this.newCategory = {

// 		}
// 	}
// 	handleSubmit = ()=>{
// 		console.log(this.newCategory);
// 		this.setState({creating: true});
// 		setTimeout(()=>{
// 			this.setState({creating: false})
// 		}, 1000)
// 	}
// 	render(){
// 		return(
// 			<div style={{padding: '20px'}}>
// 				<Form>
// 					<Form.Field>
// 						<label>English Name</label>
// 						<input type="text" onChange={(event)=>this.newCategory.nameEn = event.currentTarget.value} />
// 					</Form.Field>
// 					<Form.Field>
// 						<label>Arabic Name</label>
// 						<input type="text" onChange={(event)=>this.newCategory.nameAr = event.currentTarget.value} />
// 					</Form.Field>
// 					<Form.Field>
// 						<label>Logo</label>
// 						<input type="file" onChange={(event)=>this.newCategory.logo = event.currentTarget.files[0]} />
// 					</Form.Field>
// 					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.creating} /></Button>
// 				</Form>
// 			</div>
// 		)
// 	}
// }
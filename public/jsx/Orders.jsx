import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Dropdown, Radio, Loader, Menu } from 'semantic-ui-react'

import axios from 'axios';

export default class Orders extends Component {
	constructor(){
		super();
		this.state = {
			orders: [],
			pageNumber: 1
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
		axios.get(`/api/admin/orders?pageNumber=${this.state.pageNumber}`, {
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
	render(){
		const actionBtnStyle = {
			margin: '3px'
		}
		return(
			<div style={{padding: '15px', overflowX: 'scroll'}}>
				<div>
					<h2>Filter</h2>
					<div>
						<Dropdown placeholder="Payment Method" options={[{text: "Cash", value: "Cash On Delivery"}, {text: "Credit Card", value: "Credit Card"}]} />
					</div>
					<div>
						<Dropdown placeholder="Status" options={[{text: "Pending", value: "Pending"}, {text: "Cancelled", value: "Cancelled"}, {text: "Accepted", value: "Accepted"}]} />
					</div>
					<Button>Filter</Button>
				</div>
				<h1 style={{textAlign: 'center'}}>Orders</h1>
				{/* <Modal
					trigger={<Button>Create New Order</Button>}
					header="New Order"
					content={<OrderForm context={this} />}
				/> */}
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
											{item.productId.nameEn} - {item.productId.nameAr}: {item.quantity}<br />
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
									<Table.Cell width="1" textAlign='center'><Button style={actionBtnStyle}>Confirm</Button><Button style={actionBtnStyle}>Cancel</Button></Table.Cell>
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
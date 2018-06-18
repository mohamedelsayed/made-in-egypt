import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader, Menu } from 'semantic-ui-react'

import axios from 'axios';

export default class Orders extends Component {
	constructor(){
		super();
		this.state = {
			orders: [],
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
	render(){
		const actionBtnStyle = {
			margin: '3px'
		}
		return(
			<div style={{padding: '15px', overflowX: 'scroll'}}>
				<h1 style={{textAlign: 'center'}}>Orders</h1>
				<Modal
					trigger={<Button>Create New Order</Button>}
					header="New Order"
					content={<OrderForm context={this} />}
				/>
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
									<Table.Cell width="1" collapsing textAlign='center'>{order.userId.phone}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.userId.address}</Table.Cell>
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
									<Table.Cell width="1" collapsing textAlign='center'>{order.totalPrice}</Table.Cell>
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
									<Menu.Item as='a' icon>
										<Icon name='chevron left' />
									</Menu.Item>
									<Menu.Item as='a'>1</Menu.Item>
									<Menu.Item as='a'>2</Menu.Item>
									<Menu.Item as='a'>3</Menu.Item>
									<Menu.Item as='a'>4</Menu.Item>
									<Menu.Item as='a' icon>
										<Icon name='chevron right' />
									</Menu.Item>
								</Menu>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Footer>
				</Table>
			</div>
		)
	}
}

class OrderForm extends Component {
	constructor(){
		super();
		this.state = {
			creating: false
		}
		this.newCategory = {

		}
	}
	handleSubmit = ()=>{
		console.log(this.newCategory);
		this.setState({creating: true});
		setTimeout(()=>{
			this.setState({creating: false})
		}, 1000)
	}
	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					<Form.Field>
						<label>English Name</label>
						<input type="text" onChange={(event)=>this.newCategory.nameEn = event.currentTarget.value} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input type="text" onChange={(event)=>this.newCategory.nameAr = event.currentTarget.value} />
					</Form.Field>
					<Form.Field>
						<label>Logo</label>
						<input type="file" onChange={(event)=>this.newCategory.logo = event.currentTarget.files[0]} />
					</Form.Field>
					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.creating} /></Button>
				</Form>
			</div>
		)
	}
}
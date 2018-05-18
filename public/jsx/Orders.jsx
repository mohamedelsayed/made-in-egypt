import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader } from 'semantic-ui-react'

import axios from 'axios';

export default class Orders extends Component {
	constructor(){
		super();
		this.state = {
			orders: [],
		}
	}
	componentDidMount(){
		axios.get('http://localhost:3000/api/admin/orders', {
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
			<div style={{padding: '15px'}}>
				<h1 style={{textAlign: 'center'}}>Orders</h1>
				<Modal
					trigger={<Button>Create New Order</Button>}
					header="New Order"
					content={<OrderForm context={this} />}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='3'>Orders ({this.state.orders.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>English Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Logo</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.orders.map((order)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, orderId, orderId, orderDetailsEn, orderDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing>{/* <Icon name='folder' /> */} {order.nameEn}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.nameAr}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{order.logo? <img src={order.logo} /> : null}</Table.Cell>
									<Table.Cell width="1" textAlign='center'><Button style={actionBtnStyle}>Edit</Button><Button style={actionBtnStyle}>Delete</Button></Table.Cell>
								</Table.Row>
								)
							})
						}
					</Table.Body>
					<Table.Footer>
						<Table.Row>
							<Table.HeaderCell colSpan='3'>
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
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form } from 'semantic-ui-react'

import axios from 'axios';

export default class Products extends Component {
	constructor(){
		super();
		this.state  = {
			products: []
		}
	}

	componentDidMount(){
		console.log(localStorage.getItem('auth'));
		axios.get('http://localhost:3000/api/admin/products', {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: (status)=> status < 500
		})
		.then((response)=>{
			if(response.status == 200){
				this.setState({products: response.data});
			} else {
				if(response.status == 401){
					localStorage.removeItem('auth');
					this.props.changeView('login');
				}
				console.warn(response.status, response.data);
			}
		})
		.catch((err)=>{
			console.error(err);
		})
	}

	render(){
		const actionBtnStyle = {
			margin: '3px auto'
		}
		return(
			<div style={{padding: '15px'}}>
				<h1 style={{textAlign: 'center'}}>Products</h1>
				<Modal
					trigger={<Button>Create New Product</Button>}
					header="New Product"
					content={<ProductForm context={this} />}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='13'>Products ({this.state.products.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>English Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Description</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Price</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Quantity</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Number of photos</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Rating</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Brand</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Category</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Details</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Views</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Reviews</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.products.map((product)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, categoryId, brandId, productDetailsEn, productDetailsAr, views, reviews */}
									<Table.Cell collapsing>{/* <Icon name='folder' /> */} {product.nameEn}</Table.Cell>
									<Table.Cell collapsing textAlign='center'>{product.nameAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.description}</Table.Cell>
									<Table.Cell textAlign='center'>{product.price}</Table.Cell>
									<Table.Cell textAlign='center'>{product.quantity}</Table.Cell>
									<Table.Cell textAlign='center'>{product.photos.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.ratingTotal/product.ratingCount || 0}</Table.Cell>
									<Table.Cell textAlign='center'>{product.brandId.name}</Table.Cell>
									<Table.Cell textAlign='center'>{product.categoryId.name}</Table.Cell>
									<Table.Cell textAlign='center'>{JSON.stringify(product.productDetails)}</Table.Cell>
									<Table.Cell textAlign='center'>{product.views.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.reviews.length}</Table.Cell>
									<Table.Cell textAlign='center'><Button style={actionBtnStyle}>Action 1</Button><Button style={actionBtnStyle}>Action 2</Button><Button style={actionBtnStyle}>Action 3</Button></Table.Cell>
								</Table.Row>
								)
							})
						}
					</Table.Body>
				</Table>
			</div>
		)
	}
}

class ProductForm extends Component {
	constructor(){
		super();
		this.state = {}
	}

	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					<Form.Field>
						<label>English Name</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>English Name</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Description</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Price</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Quantity</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Photos</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Brand</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Category</label>
						<input />
					</Form.Field>
					<Form.Field>
						<label>Details</label>
						<input />
					</Form.Field>
				</Form>
			</div>
		)
	}
}
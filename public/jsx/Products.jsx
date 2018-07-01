import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio } from 'semantic-ui-react'

import axios from 'axios';

export default class Products extends Component {
	constructor(){
		super();
		this.state  = {
			products: [],
			brands: [],
			categories: [],
			featured: "no",
			deleteOpen: false,
			editOpen: false,
			createOpen: false,
			targetProductId: undefined
		}
	}

	componentDidMount(){
		console.log(localStorage.getItem('auth'));
		axios.get(`/api/admin/products`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: (status)=> status < 500
		})
		.then((response)=>{
			if(response.status == 200){
				this.setState({products: response.data.products, brands: response.data.brands, categories: response.data.categories});
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

	handleDelete = ()=>{
		axios.delete(`/api/products/${this.state.targetProductId}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.componentDidMount();
			this.setState({deleteOpen: false, targetProductId: undefined});
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
			<div style={{padding: '15px', overflowX: 'scroll'}}>
				<h1 style={{textAlign: 'center'}}>Products</h1>
				<Modal
					trigger={<Button>Create New Product</Button>}
					header="New Product"
					content={<ProductForm context={this} />}
				/>
				<Modal
					// trigger={<Button>Create New Product</Button>}
					header="Delete Product?"
					actions={[
						<Button style={actionBtnStyle} key={"deleteProductNo"} onClick={()=>this.setState({deleteOpen: false, targetProductId: undefined})} >No</Button>,
						<Button style={actionBtnStyle} key={"deleteProductYes"} onClick={this.handleDelete}>Yes</Button>
					]}
					onClose={()=>this.setState({deleteOpen: false, targetProductId: undefined})}
					open={this.state.deleteOpen}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='15'>Products ({this.state.products.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>English Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>English Description</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Description</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Price</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Discount</Table.HeaderCell>
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
								<Table.Row key={Math.random().toFixed(5)} error={product.quantity < 6}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, categoryId, brandId, productDetailsEn, productDetailsAr, views, reviews */}
									<Table.Cell collapsing>{/* <Icon name='folder' /> */} {product.nameEn}</Table.Cell>
									<Table.Cell collapsing textAlign='center'>{product.nameAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionEn}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.price}</Table.Cell>
									<Table.Cell textAlign='center'>{product.discount}</Table.Cell>
									<Table.Cell textAlign='center'>{product.quantity}</Table.Cell>
									<Table.Cell textAlign='center'>{product.photos.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.ratingTotal/product.ratingCount || 0}</Table.Cell>
									<Table.Cell textAlign='center'>{product.brand.name}</Table.Cell>
									<Table.Cell textAlign='center'>{product.category.name}</Table.Cell>
									<Table.Cell textAlign='center'>{JSON.stringify(product.productDetails)}</Table.Cell>
									<Table.Cell textAlign='center'>{product.views.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.reviews.length}</Table.Cell>
									<Table.Cell textAlign='center'><Button style={actionBtnStyle}>Edit</Button><Button style={actionBtnStyle} onClick={()=>this.setState({targetProductId: product._id, deleteOpen: true})}>Delete</Button></Table.Cell>
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
		this.state = {
			brands: [],
			categories: []
		}
	}

	componentDidMount(){
		this.setState({brands: this.props.context.state.brands.map((brand)=>Object.assign({},{key: brand._id, value: brand._id, text: brand.nameEn+" - "+brand.nameAr})),
									categories: this.props.context.state.categories.map((category)=>Object.assign({},{key: category._id, value: category._id, text: category.nameEn+" - "+category.nameAr}))})
	}

	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					<Form.Field>
						<label>English Name</label>
						<input type="text" onChange={(event)=>this.setState({ nameEn: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input type="text" onChange={(event)=>this.setState({ nameAr: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>English Description</label>
						<input type="text" onChange={(event)=>this.setState({ descriptionEn: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Description</label>
						<input type="text" onChange={(event)=>this.setState({ descriptionAr: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Price</label>
						<input type="text" onChange={(event)=>this.setState({ price: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Discount</label>
						<input type="text" onChange={(event)=>this.setState({ discount: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Color</label>
						<input type="text" onChange={(event)=>this.setState({ color: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Details</label>
						<div>
							<label>Quantity</label>
							<input type="text" onChange={(event)=>this.setState({ quantity: event.currentTarget.value})} />
							<label>Size</label>
							<input type="text" onChange={(event)=>this.setState({ size: event.currentTarget.value})} />
						</div>
					</Form.Field>
					<Form.Field>
						<label>Photos</label>
						<input type="file" multiple onChange={(event)=>this.setState({photos: event.currentTarget.files})} />
					</Form.Field>
					<Form.Field>
						<label>Brand</label>
						<Select options={this.state.brands} />
					</Form.Field>
					<Form.Field>
						<label>Category</label>
						<Select options={this.state.categories} />
					</Form.Field>
					<Form.Field>
						<label>Featured</label>
						<Radio label="Yes" checked={this.state.featured === 'yes'} value="yes" onChange={(e, {value})=>this.setState({featured: value})} />
						<Radio label="No" checked={this.state.featured === 'no'} value="no" onChange={(e, {value})=>this.setState({featured: value})} />
					</Form.Field>
				</Form>
			</div>
		)
	}
}
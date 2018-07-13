import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Dropdown } from 'semantic-ui-react'

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
			targetProductId: undefined,
			targetProduct: undefined
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
				let processedProducts = response.data.products.map((product)=>{
					let quantity = product.details.reduce((accumilator, detail)=>{
						return accumilator + parseInt(detail.quantity)
					}, 0)
					product.quantity = quantity;
					return product;
				})
				this.setState({products: processedProducts, brands: response.data.brands, categories: response.data.categories});
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

	handleSearch = ()=>{
		axios.get(`/api/admin/products${this.state.searchText? '?search='+this.state.searchText : ''}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: (status)=> status < 500
		})
		.then((response)=>{
			if(response.status == 200){
				let processedProducts = response.data.products.map((product)=>{
					let quantity = product.details.reduce((accumilator, detail)=>{
						return accumilator + parseInt(detail.quantity)
					}, 0)
					product.quantity = quantity;
					return product;
				})
				this.setState({products: processedProducts, brands: response.data.brands, categories: response.data.categories});
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
			<div style={{padding: '15px', overflowX: 'scroll'}}>
				<h1 style={{textAlign: 'center'}}>Products</h1>
				<Modal
					trigger={<Button onClick={()=>this.setState({createOpen: true})}>Create New Product</Button>}
					header="New Product"
					content={<ProductForm context={this} />}
					open={this.state.createOpen}
					onClose={()=>this.setState({createOpen: false})}
				/>
				<Modal
					header="Edit Product"
					content={<ProductEditForm context={this} />}
					open={this.state.editOpen}
					onClose={()=>this.setState({editOpen: false})}
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
				<div>
					<input type="text" placeholder="Search" onChange={(event)=>this.setState({searchText: event.currentTarget.value})} style={{border: '1px solid #ddd', borderRadius: 2, marginRight: 10, marginTop: 10, height: 32, padding: 10}} />
					<Button onClick={this.handleSearch}>Search</Button>
				</div>
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
							<Table.HeaderCell textAlign='center'>Color</Table.HeaderCell>
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
									<Table.Cell collapsing textAlign='center'>{/* <Icon name='folder' /> */} {product.nameEn}</Table.Cell>
									<Table.Cell collapsing textAlign='center'>{product.nameAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionEn}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.price}</Table.Cell>
									<Table.Cell textAlign='center'>{product.color}</Table.Cell>
									<Table.Cell textAlign='center'>{product.discount}</Table.Cell>
									<Table.Cell textAlign='center'>{product.quantity}</Table.Cell>
									<Table.Cell textAlign='center'>{product.photos.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.ratingTotal/product.ratingCount || 0}</Table.Cell>
									<Table.Cell textAlign='center'>{product.brand.name}</Table.Cell>
									<Table.Cell textAlign='center'>{product.category.name}</Table.Cell>
									<Table.Cell textAlign='center'>{JSON.stringify(product.productDetails)}</Table.Cell>
									<Table.Cell textAlign='center'>{product.views.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.reviews.length}</Table.Cell>
									<Table.Cell textAlign='center'><Button style={actionBtnStyle} onClick={()=>this.setState({targetProduct: product, editOpen: true})} >Edit</Button><Button style={actionBtnStyle} onClick={()=>this.setState({targetProductId: product._id, deleteOpen: true})}>Delete</Button></Table.Cell>
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
			error: "",
			brands: [],
			categories: [],
			details: [{}]
		}
	}

	componentDidMount(){
		this.setState({brands: this.props.context.state.brands.map((brand)=>Object.assign({},{key: brand._id, value: brand._id, text: brand.nameEn+" - "+brand.nameAr})),
									categories: this.props.context.state.categories.map((category)=>Object.assign({},{key: category._id, value: category._id, text: category.nameEn+" - "+category.nameAr}))})
	}

	handleSubmit = ()=>{
		this.setState({error: ""})
		let { nameEn, nameAr, descriptionEn, descriptionAr, price, discount, color, details, photos, brand, category, featured } = this.state;
		details = details.filter((entry)=>{
			return entry.quantity
		})
		if(!(nameEn || nameAr || descriptionEn || descriptionAr || price || discount || color || details.length > 0 || photos || brand || category || featured)){
			return this.setState({error: "Form is incomplete"})
		}
		console.log(nameEn, nameAr, descriptionEn, descriptionAr, price, discount, color, details, photos, brand, category, featured);
		let data = new FormData();
		data.append('nameEn', nameEn)
		data.append('nameAr', nameAr)
		data.append('descriptionEn', descriptionEn)
		data.append('descriptionAr', descriptionAr)
		data.append('price', price)
		if(discount){
			data.append('discount', discount)
		}
		data.append('color', color)
		data.append('details', JSON.stringify(details))
		console.log(typeof photos);
		Object.keys(photos).forEach((photoKey)=>{
			data.append('photos', photos[photoKey], photos[photoKey].name);
		})
		data.append('photos', photos)
		data.append('brand', brand)
		data.append('category', category)
		data.append('featured', featured)
		axios.post('/api/products', data, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: function(status){
				return status < 500
			}
		})
		.then((response)=>{
			if(response.status < 300){
				this.props.context.componentDidMount();
				return this.props.context.setState({createOpen: false});
			}
			this.setState({error: response.data.error});
		})
		.catch((err)=>{
			console.error(err);
			this.setState({error: "Something went wrong"});
		})
	}

	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					{
						this.state.error?
						<div style={{color: 'red'}}>
							{this.state.error}
						</div>
						:
						null
					}
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
						<input type="number" min="0" onChange={(event)=>this.setState({ price: event.currentTarget.valueAsNumber})} />
					</Form.Field>
					<Form.Field>
						<label>Discount</label>
						<input type="number" min="0" max="100" onChange={(event)=>this.setState({ discount: event.currentTarget.valueAsNumber})} />
					</Form.Field>
					<Form.Field>
						<label>Color</label>
						<input type="text" onChange={(event)=>this.setState({ color: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Details</label>
						{
							this.state.details.map((d, index)=>{
								return(
									<div>
										<label>Quantity</label>
										<input type="number" min="0" onChange={(event)=>{
											let detailsUpdate = this.state.details;
											detailsUpdate[index].quantity = event.currentTarget.value
											this.setState({ details: detailsUpdate })
										}} />
										<label>Size</label>
										<input type="text" onChange={(event)=>{
											let detailsUpdate = this.state.details;
											detailsUpdate[index].size = event.currentTarget.value
											this.setState({ details: detailsUpdate })
										}} />
									</div>
								)
							})
						}
						<Button onClick={()=>this.setState({details: this.state.details.concat([{}])})}>Add Detail</Button>
					</Form.Field>
					<Form.Field>
						<label>Photos</label>
						<input type="file" multiple onChange={(event)=>this.setState({photos: event.currentTarget.files})} />
					</Form.Field>
					<Form.Field>
						<label>Brand</label>
						<Dropdown placeholder="Select Brand" options={this.state.brands} onChange={(event, data)=>this.setState({brand: data.value})} />
					</Form.Field>
					<Form.Field>
						<label>Category</label>
						<Dropdown placeholder="Select Category" options={this.state.categories} onChange={(event, data)=>this.setState({category: data.value})} />
					</Form.Field>
					<Form.Field>
						<label>Featured</label>
						<Radio label="Yes" checked={this.state.featured === 'yes'} value="yes" onChange={(e, {value})=>this.setState({featured: value})} />
						<Radio label="No" checked={this.state.featured === 'no'} value="no" onChange={(e, {value})=>this.setState({featured: value})} />
					</Form.Field>
					<Button onClick={this.handleSubmit}>Create Product</Button>
				</Form>
			</div>
		)
	}
}

class ProductEditForm extends Component {
	constructor(){
		super();
		this.state = {
			error: "",
			details: [],
			brand: {},
			category: {}
		}
	}
	componentDidMount(){
		this.setState({...this.props.context.state.targetProduct, 
			brands: this.props.context.state.brands.map((brand)=>Object.assign({},{key: brand._id, value: brand._id, text: brand.nameEn+" - "+brand.nameAr})),
			categories: this.props.context.state.categories.map((category)=>Object.assign({},{key: category._id, value: category._id, text: category.nameEn+" - "+category.nameAr}))
		})
	}

	handleSubmit = ()=>{
		this.setState({error: ""})
		let { _id, nameEn, nameAr, descriptionEn, descriptionAr, price, discount, color, details, photos, brand, category, featured } = this.state;
		if(!(_id || nameEn || nameAr || descriptionEn || descriptionAr || price || discount || color || details.length > 0 || photos || brand || category || featured)){
			return this.setState({error: "Form is incomplete"})
		}
		details = details.filter((entry)=>{
			return entry.quantity
		})
		console.log(nameEn, nameAr, descriptionEn, descriptionAr, price, discount, color, details, photos, brand, category, featured);
		let data = new FormData();
		data.append('_id', _id)
		data.append('nameEn', nameEn)
		data.append('nameAr', nameAr)
		data.append('descriptionEn', descriptionEn)
		data.append('descriptionAr', descriptionAr)
		data.append('price', price)
		if(discount){
			data.append('discount', discount)
		}
		data.append('color', color)
		data.append('details', JSON.stringify(details))
		console.log(typeof photos);
		Object.keys(photos).forEach((photoKey)=>{
			data.append('photos', photos[photoKey], photos[photoKey].name);
		})
		data.append('photos', photos)
		data.append('brand', brand._id)
		data.append('category', category._id)
		data.append('featured', featured)
		axios.put('/api/products', data, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: function(status){
				return status < 500
			}
		})
		.then((response)=>{
			if(response.status < 300){
				this.props.context.componentDidMount();
				return this.props.context.setState({createOpen: false});
			}
			this.setState({error: response.data.error});
		})
		.catch((err)=>{
			console.error(err);
			this.setState({error: "Something went wrong"});
		})
	}

	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					{
						this.state.error?
						<div style={{color: 'red'}}>
							{this.state.error}
						</div>
						:
						null
					}
					<Form.Field>
						<label>English Name</label>
						<input type="text" value={this.state.nameEn} onChange={(event)=>this.setState({ nameEn: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input type="text" value={this.state.nameAr} onChange={(event)=>this.setState({ nameAr: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>English Description</label>
						<input type="text" value={this.state.descriptionEn} onChange={(event)=>this.setState({ descriptionEn: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Description</label>
						<input type="text" value={this.state.descriptionAr} onChange={(event)=>this.setState({ descriptionAr: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Price</label>
						<input type="number" value={this.state.price} min="0" onChange={(event)=>this.setState({ price: event.currentTarget.valueAsNumber})} />
					</Form.Field>
					<Form.Field>
						<label>Discount</label>
						<input type="number" value={this.state.discount} min="0" max="100" onChange={(event)=>this.setState({ discount: event.currentTarget.valueAsNumber})} />
					</Form.Field>
					<Form.Field>
						<label>Color</label>
						<input type="text" value={this.state.color} onChange={(event)=>this.setState({ color: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Details</label>
						{
							this.state.details?
							this.state.details.map((d, index)=>{
								return(
									<div key={"d-"+index}>
										<label>Quantity</label>
										<input type="number" min="0" value={d.quantity} onChange={(event)=>{
											let detailsUpdate = this.state.details;
											detailsUpdate[index].quantity = event.currentTarget.value
											this.setState({ details: detailsUpdate })
										}} />
										<label>Size</label>
										<input type="text" value={d.size} onChange={(event)=>{
											let detailsUpdate = this.state.details;
											detailsUpdate[index].size = event.currentTarget.value
											this.setState({ details: detailsUpdate })
										}} />
									</div>
								)
							})
							:
							null
						}
						<Button onClick={()=>this.setState({details: this.state.details.concat([{}])})}>Add Detail</Button>
					</Form.Field>
					<Form.Field>
						<label>Photos</label>
						<div>{this.state.photos? this.state.photos.map((photo, index)=><a href={photo} style={{margin: '5px 15px'}} target="_blank" key={"p-"+index}>Photo {index}</a>) : null}</div>
						<input type="file" multiple onChange={(event)=>this.setState({photos: event.currentTarget.files})} />
					</Form.Field>
					<Form.Field>
						<label>Brand</label>
						<Dropdown placeholder="Select Brand" value={this.state.brand._id} options={this.state.brands} onChange={(event, data)=>this.setState({brand: data.value})} />
					</Form.Field>
					<Form.Field>
						<label>Category</label>
						<Dropdown placeholder="Select Category" value={this.state.category._id} options={this.state.categories} onChange={(event, data)=>this.setState({category: data.value})} />
					</Form.Field>
					<Form.Field>
						<label>Featured</label>
						<Radio label="Yes" checked={this.state.featured} value={true} onChange={(e, {value})=>this.setState({featured: value})} />
						<Radio label="No" checked={!this.state.featured} value={false} onChange={(e, {value})=>this.setState({featured: value})} />
					</Form.Field>
					<Button onClick={this.handleSubmit}>Create Product</Button>
				</Form>
			</div>
		)
	}
}
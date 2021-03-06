import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Dropdown } from 'semantic-ui-react';
import cloneDeep from 'lodash/cloneDeep';

import axios from 'axios';
Array.prototype.insert = function (index, item) {
	this.splice( index, 0, item );
};


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
			targetProduct: undefined,
			filterBrand: undefined,
			filterCategory: undefined,
			filterFeatured: null,
			error: null,
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
			alert('Can not delete this product because it belongs to a pending order')
			this.setState({
				error: 'Can not delete this product because it belongs to a pending order'
			})
			setTimeout(() => {
				this.setState({
					error: ''
				})
			}, 30000);
			console.error(err);
		})
	}

	handleSearch = ()=>{
		axios.get(`/api/admin/products?${this.state.searchText? 'search='+this.state.searchText : ''}${this.state.filterBrand? '&brandId='+this.state.filterBrand : ''}${this.state.filterCategory? '&categoryId='+this.state.filterCategory : ''}${this.state.filterFeatured !== null? '&featured='+this.state.filterFeatured : ''}`, {
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
				{
						this.state.error?
						<div style={{color: 'red', textAlign: 'center'}}>
							{this.state.error}
						</div>
						:
						null
				}
				<Modal
					trigger={<Button onClick={()=>this.setState({createOpen: true})}>Create New Product</Button>}
					header="New Product"
					content={<ProductForm context={this} />}
					open={this.state.createOpen}
					onClose={()=>this.setState({createOpen: false})}
					closeOnDimmerClick={false}
				/>
				<Modal
					header="Edit Product"
					content={<ProductEditForm context={this} />}
					open={this.state.editOpen}
					onClose={()=>this.setState({editOpen: false})}
					closeOnDimmerClick={false}
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
					closeOnDimmerClick={false}
				/>
				<div>
					<input type="text" placeholder="Search" onChange={(event)=>this.setState({searchText: event.currentTarget.value})} style={{border: '1px solid #ddd', borderRadius: 2, marginRight: 10, marginTop: 10, height: 32, padding: 10}} />
					<Dropdown placeholder="Filter Brand" options={[{text: "None", value: null, key: "filterbrandnull"}].concat(this.state.brands.map((brand)=>{
						return {
							key: "filterkey-"+brand._id,
							value: brand._id,
							text: brand.nameEn + " - " + brand.nameAr
						}
					}))} onChange={(event, data)=>this.setState({filterBrand: data.value})} />
					<Dropdown placeholder="Filter Category" options={[{text: "None", value: null, key: "filtercategorynull"}].concat(this.state.categories.filter((c)=>c.parentCategory).map((category)=>{
						return {
							key: "filterkey-"+category._id,
							value: category._id,
							text: category.nameEn + " - " + category.nameAr
						}
					}))} onChange={(event, data)=>this.setState({filterCategory: data.value})} />
					<Dropdown placeholder="Featured" options={[
						{
							key: 'filterfeatured-null',
							value: null,
							text: "Not specified"
						},
						{
							key: 'filterfeatured-yes',
							value: true,
							text: "Featured"
						},
						{
							key: 'filterfeatured-no',
							value: false,
							text: "Not Featured"
						}
					]} onChange={(event, data)=>this.setState({filterFeatured: data.value})}/>
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
							<Table.HeaderCell textAlign='center'>Color English</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Color Arabic</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Discount</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Quantity</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Number of photos</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Rating</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Brand</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Category</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Details</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Views</Table.HeaderCell>
							{/* <Table.HeaderCell textAlign='center'>Reviews</Table.HeaderCell> */}
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.products.map((product, productIndex)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)} error={product.quantity < 6}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, categoryId, brandId, productDetailsEn, productDetailsAr, views, reviews */}
									<Table.Cell collapsing textAlign='center'>{/* <Icon name='folder' /> */} {product.nameEn}</Table.Cell>
									<Table.Cell collapsing textAlign='center'>{product.nameAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionEn}</Table.Cell>
									<Table.Cell textAlign='center'>{product.descriptionAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.price}</Table.Cell>
									<Table.Cell textAlign='center'>{product.color}</Table.Cell>
									<Table.Cell textAlign='center'>{product.colorAr}</Table.Cell>
									<Table.Cell textAlign='center'>{product.discount}</Table.Cell>
									<Table.Cell textAlign='center'>{product.quantity}</Table.Cell>
									<Table.Cell textAlign='center'>{product.photos.length}</Table.Cell>
									<Table.Cell textAlign='center'>{product.ratingTotal/product.ratingCount || 0}</Table.Cell>
									<Table.Cell textAlign='center'>{product.brand? product.brand.nameEn + " - "+ product.brand.nameAr : "Brand Not Found"}</Table.Cell>
									<Table.Cell textAlign='center'>{product.category ? product.category.nameEn + " - "+ product.category.nameAr : "Category Not Found"}</Table.Cell>
									<Table.Cell textAlign='center'>{JSON.stringify(product.details)}</Table.Cell>
									<Table.Cell textAlign='center'>{product.views.length}</Table.Cell>
									{/* <Table.Cell textAlign='center'>{product.reviews.length}</Table.Cell> */}
									<Table.Cell textAlign='center'>
										<Button style={actionBtnStyle} onClick={()=>this.setState({targetProduct: product, editOpen: true})} >
											Edit
										</Button>
										<Button style={actionBtnStyle} onClick={()=>this.setState({targetProductId: product._id, deleteOpen: true})}>
											Delete
										</Button>
										<Button style={actionBtnStyle} onClick={
											() => {
												const { products } = this.state;
												this.createProduct.call(product)
													.then(() => {
														products.insert(productIndex + 1, product);
														this.setState({
															products,
														});
													})
													.catch((error) => {
														console.error(error);
														this.setState({
															error,
														})
													});
											}
										}>
											Duplicate
										</Button>
									</Table.Cell>
								</Table.Row>
								)
							})
						}
					</Table.Body>
				</Table>
			</div>
		)
	}


	createProduct() {

		return new Promise((resolve, reject) => {

			const product = cloneDeep(this);

			product.details = JSON.stringify(product.details);
			product.colors = JSON.stringify([product.color + '$' + product.colorAr]);


			const axiosOptions = {
				headers: {
					'x-auth-token': localStorage.getItem('auth')
				},
				validateStatus: function(status){
					return status < 500
				}
			};
			if (!product) {
				return reject('Product is reuqired');
			}

			axios.post('/api/products', {
				...product
			}, axiosOptions)
			.then(resolve, reject);

		});

	}

}

class ProductForm extends Component {
	constructor(){
		super();
		this.state = {
			error: "",
			brands: [],
			categories: [],
			details: [{}],
			colors: [null]
		}
	}

	componentDidMount(){
		const categories = this.props.context.state.categories.filter((c)=>c.parentCategory).map((category)=>Object.assign({},{key: category._id, value: category._id, text: category.nameEn+" - "+category.nameAr + " | " + category.parentCategory.nameEn + " - " + category.parentCategory.nameAr }));
		this.setState({brands: this.props.context.state.brands.map((brand)=>Object.assign({},{key: brand._id, value: brand._id, text: brand.nameEn+" - "+brand.nameAr})),
									categories})
	}

	handleSubmit = ()=>{
		this.setState({error: ""})
		let { nameEn, nameAr, descriptionEn, descriptionAr, price, discount, /* color */ colors, details, photos, brand, category, featured } = this.state;
		details = details.filter((entry)=>{
			return entry.quantity
		})
		if(!(nameEn && nameAr && descriptionEn && descriptionAr && price && /* discount && */ /* color */ colors.length > 0 && details.length > 0 && photos && brand && category && featured)){
			console.log([nameEn , nameAr , descriptionEn , descriptionAr , price , /* discount , */ /* color */ colors.length > 0 , details.length > 0 , photos , brand , category , featured])
			return this.setState({error: "Form is incomplete"})
		}
		console.log(nameEn, nameAr, descriptionEn, descriptionAr, price, discount, /* color */colors, details, photos, brand, category, featured);
		let data = new FormData();
		data.append('nameEn', nameEn)
		data.append('nameAr', nameAr)
		data.append('descriptionEn', descriptionEn)
		data.append('descriptionAr', descriptionAr)
		data.append('price', price)
		if(discount){
			data.append('discount', discount)
		}
		// data.append('color', color)
		data.append('colors', JSON.stringify(colors))
		data.append('details', JSON.stringify(details))
		console.log(typeof photos);
		if(photos){
			Object.keys(photos).forEach((photoKey)=>{
				data.append('photos', photos[photoKey], photos[photoKey].name);
			})
			data.append('photos', photos)
		} else {
			return this.setState({error: "You must upload at least 1 image"});
		}
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
						{/* <input type="text" onChange={(event)=>this.setState({ color: event.currentTarget.value})} /> */}
						{
							this.state.colors.map((color, index)=>{
								return <input type="text" onChange={(event)=>{
									let theColors = this.state.colors;
									theColors[index] = event.currentTarget.value;
									// this.setState({ colors: event.currentTarget.value})
									this.setState({ colors: theColors })
								}} />
							})
						}
						<Button onClick={()=>this.setState({colors: this.state.colors.concat([null])})}>Add Color</Button>
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
					<Button onClick={()=>this.props.context.setState({createOpen: false})}>Cancel</Button>
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

		console.log(JSON.stringify(this.props.context.state.categories, null, 2));
		this.setState({...this.props.context.state.targetProduct, 
			brands: this.props.context.state.brands.map((brand)=>Object.assign({},{key: brand._id, value: brand._id, text: brand.nameEn+" - "+brand.nameAr})),
			categories: this.props.context.state.categories.filter((c)=>c.parentCategory).map((category)=>Object.assign({},{key: category._id, value: category._id, text: category.nameEn+" - "+category.nameAr + " | " + category.parentCategory.nameEn + " - " + category.parentCategory.nameAr }))
		})
	}

	handleSubmit = ()=>{
		this.setState({error: ""})
		let { _id, nameEn, nameAr, descriptionEn, descriptionAr, price, discount, color, colorAr, details, photos, brand, category, featured } = this.state;
		if(!(_id && nameEn && nameAr && descriptionEn && descriptionAr && price && /* discount && */ /* color && */ details.length > 0 && photos && brand && category && typeof featured === 'boolean')){
			console.log([!!_id , !!nameEn , !!nameAr , !!descriptionEn , !!descriptionAr , !!price , !!/* discount , !!*/ color , !!details.length > 0 , !!photos , !!brand , !!category , !!(typeof featured === 'boolean')]);
			return this.setState({error: "Form is incomplete"})
		}
		details = details.filter((entry)=>{
			return entry.quantity
		})
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
		data.append('colorAr', colorAr);
		data.append('details', JSON.stringify(details))
		if(photos){
			console.log(typeof photos, photos);
			Object.keys(photos).forEach((photoKey)=>{
				if (photos[photoKey].name) {
					data.append('photos', photos[photoKey], photos[photoKey].name);
				}
			})
			data.append('photos', photos)
		}
		data.append('brand', (typeof brand === 'object')? brand._id: brand)
		data.append('category', (typeof category === 'object')? category._id : category)
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
				return this.props.context.setState({editOpen: false});
			}
			this.setState({error: response.data.error});
		})
		.catch((err)=>{
			console.error(err);
			this.setState({error: "Something went wrong"});
		})
	}

	removeImage = (productId, image)=>{
		axios.delete(`/api/image/${productId}?image=${image}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			let updated = this.state.photos;
			updated.splice(this.state.photos.indexOf(image), 1)
			this.setState({photos: updated})
		})
		.catch((err)=>{
			console.log(err);
			this.setState({error: "Couldn't remove image"});
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
						<label>Color English</label>
						<input type="text" value={this.state.color} onChange={(event)=>this.setState({ color: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Color Arabic</label>
						<input type="text" value={this.state.colorAr} onChange={(event)=>this.setState({ colorAr: event.currentTarget.value})} />
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
						<div>{this.state.photos? Object.values(this.state.photos).map((photo, index)=>
									<span><a href={"/api/file?url="+photo} style={{margin: '5px 15px'}} target="_blank" key={"p-"+index}>Photo {index}</a><span style={{cursor: 'pointer'}} onClick={()=>this.removeImage(this.state._id, photo)}>x</span></span>
								) : null}</div>
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
					<Button onClick={this.handleSubmit}>Edit Product</Button>
					<Button onClick={()=>this.props.context.setState({editOpen: false})}>Cancel</Button>
				</Form>
			</div>
		)
	}
}
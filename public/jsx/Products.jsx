import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table } from 'semantic-ui-react'

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
		return(
			<div>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='12'>Products ({this.state.products.length})</Table.HeaderCell>
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

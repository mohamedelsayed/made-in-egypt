import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader } from 'semantic-ui-react'

import axios from 'axios';

export default class Brands extends Component {
	constructor(){
		super();
		this.state = {
			brands: [],
		}
	}
	componentDidMount(){
		axios.get('http://localhost:3000/api/admin/brands', {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({brands: response.data});
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
				<h1 style={{textAlign: 'center'}}>Brands</h1>
				<Modal
					trigger={<Button>Create New Brand</Button>}
					header="New Brand"
					content={<BrandForm context={this} />}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='3'>Brands ({this.state.brands.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>English Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.brands.map((brand)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, brandId, brandId, brandDetailsEn, brandDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing>{/* <Icon name='folder' /> */} {brand.nameEn}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{brand.nameAr}</Table.Cell>
									<Table.Cell width="1" textAlign='center'><Button style={actionBtnStyle}>Edit</Button><Button style={actionBtnStyle}>Delete</Button></Table.Cell>
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

class BrandForm extends Component {
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
					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.creating} /></Button>
				</Form>
			</div>
		)
	}
}
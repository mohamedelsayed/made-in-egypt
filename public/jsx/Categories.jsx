import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader } from 'semantic-ui-react'

import axios from 'axios';

export default class Categories extends Component {
	constructor(){
		super();
		this.state = {
			categories: [],
		}
	}
	componentDidMount(){
		axios.get(`/api/admin/categories`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({categories: response.data});
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
				<h1 style={{textAlign: 'center'}}>Categories</h1>
				<Modal
					trigger={<Button>Create New Category</Button>}
					header="New Category"
					content={<CategoryForm context={this} />}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='4'>Categories ({this.state.categories.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>English Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Arabic Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Parent Category</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Actions</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.categories.map((category)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, categoryId, brandId, categoryDetailsEn, categoryDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing>{/* <Icon name='folder' /> */} {category.nameEn}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{category.nameAr}</Table.Cell>
									<Table.Cell width="1" textAlign='center'>{category.parentCategory? category.parentCategory.nameEn : ""}</Table.Cell>
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

class CategoryForm extends Component {
	constructor(){
		super();
		this.state = {
			creating: false,
			error: null
		}
		this.newCategory = {

		}
	}
	handleSubmit = ()=>{
		console.log(this.newCategory);
		this.setState({creating: true});
		// setTimeout(()=>{
		// 	this.setState({creating: false})
		// }, 1000)
		axios.post(`/api/categories`, this.newCategory, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: function(status){
				return status < 500
			}
		})
		.then((reponse)=>{
			if(response.status < 300){
				this.props.context.componentDidMount();
			} else {
				// response code 409 with a conflict
				this.setState({error: "This category has children. Delete the children before deleting this category"})
			}
		})
		.catch((err)=>{
			console.error(err);
			// TODO: display error
		})
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
						<label>Parent Category</label>
						<Select options={
							this.props.context.state.categories.reduce((accumilator, category)=>{
								if(!category.parentCategory){
									accumilator.push({
										key: category.nameEn,
										value: category._id,
										text: category.nameEn + " " + category.nameAr
									})
									return accumilator
								}
								return accumilator;
							}, [{
								key: "None",
								value: null,
								text: "None"
							}])
						}
						onChange={(event, extract)=>this.newCategory.parentCategory = extract.value}
						/>
					</Form.Field>
					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.creating} /></Button>
				</Form>
			</div>
		)
	}
}
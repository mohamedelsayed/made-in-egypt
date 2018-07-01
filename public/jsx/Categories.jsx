import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader, Dropdown } from 'semantic-ui-react'

import axios from 'axios';

export default class Categories extends Component {
	constructor(){
		super();
		this.state = {
			categories: [],
			editOpen: false,
			deleteOpen: false,
			createOpen: false
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
	handleDelete = ()=>{
		axios.delete(`/api/categories/${this.state.targetCategoryId}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.componentDidMount();
			this.setState({deleteOpen: false, targetCategoryId: undefined});
		})
		.catch((err)=>{
			console.error(err);
			this.setState({error: "Couldn't delete category"});
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
					open={this.state.createOpen}
				/>
				<Modal
					header="Edit Category"
					content={<CategoryFormEdit context={this} category={this.state.category} />}
					open={this.state.editOpen}
					onClose={()=>this.setState({editOpen: false})}
				/>
				<Modal
					header={"Delete Category?"}
					actions={[
						<Button style={actionBtnStyle} key={"deleteCategoryNo"} onClick={()=>this.setState({deleteOpen: false, targetCategoryId: undefined})} >No</Button>,
						<Button style={actionBtnStyle} key={"deleteCategoryYes"} onClick={this.handleDelete}>Yes</Button>
					]}
					onClose={()=>this.setState({deleteOpen: false, targetCategoryId: undefined})}
					open={this.state.deleteOpen}
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
									<Table.Cell width="1" textAlign='center'><Button style={actionBtnStyle} onClick={()=>this.setState({editOpen: true, category})}>Edit</Button><Button style={actionBtnStyle} onClick={()=>this.setState({deleteOpen: true, targetCategoryId: category._id})}>Delete</Button></Table.Cell>
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
		.then((response)=>{
			if(response.status < 300){
				this.props.context.componentDidMount();
				this.props.context.setState({createOpen: false});
			} else {
				// response code 409 with a conflict
				this.setState({error: "This category has children. Delete the children before deleting this category"})
			}
		})
		.catch((err)=>{
			console.error(err);
			this.setState({error: "Something went wrong"});
		})
	}
	render(){
		return(
			<div style={{padding: '20px'}}>
				{
					this.state.error?
					<div>
						{this.state.error}
					</div>
					:
					null
				}
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

class CategoryFormEdit extends Component {
	constructor(){
		super();
		this.state = {
			editing: false,
			error: null
		}
	}

	componentDidMount(){
		if(!this.props.category){
			throw Error("Category is undefined");
		}
		let { _id, nameEn, nameAr, parentCategory } = this.props.category;
		this.setState({
			_id, nameEn, nameAr, parentCategory
		})
	}

	handleSubmit = ()=>{
		this.setState({editing: true});
		// setTimeout(()=>{
		// 	this.setState({editing: false})
		// }, 1000)
		let { nameEn, nameAr, parentCategory, _id } = this.state;
		if(!_id){
			throw Error("Category ID is undefined")
		}
		console.log({nameEn, nameAr, parentCategory: parentCategory._id})
		axios.put(`/api/categories/${_id}`, {
			nameEn, nameAr, parentCategory: parentCategory._id
		}, {
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
				this.props.context.setState({editOpen: false})
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
						<input value={this.state.nameEn} type="text" onChange={(event)=>this.setState({nameEn: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input value={this.state.nameAr} type="text" onChange={(event)=>this.setState({nameAr: event.currentTarget.value})} />
					</Form.Field>
					<Form.Field>
						<label>Parent Category</label>
						<Dropdown options={
							this.props.context.state.categories.reduce((accumilator, category)=>{
								if(!category.parentCategory){
									accumilator.push({
										key: category.nameEn,
										value: category,
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
						value={(this.state.parentCategory)? this.state.parentCategory : null}
						fluid
						selection
						onChange={(event, data)=>{console.log(data.value);this.setState({parentCategory: data.value})}}
						/>
					</Form.Field>
					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.editing} /></Button>
				</Form>
			</div>
		)
	}
}
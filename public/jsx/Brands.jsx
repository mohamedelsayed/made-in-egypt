import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Icon, Table, Modal, Button, Form, Select, Radio, Loader } from 'semantic-ui-react'

import axios from 'axios';

export default class Brands extends Component {
	constructor(){
		super();
		this.state = {
			brands: [],
			formOpen: false,
			deleteOpen: false,
			errorOpen: false,
			targetBrandId: undefined
		}
	}
	componentDidMount(){
		axios.get(`${process.env.URL || "http://localhost:3000"}/api/admin/brands`, {
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
	handleDelete = ()=>{
		if(!this.state.targetBrandId){
			return console.error("Brand ID undefined");
		}
		axios.delete(`${process.env.URL || "http://localhost:3000"}/api/brands/${this.state.targetBrandId}`, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: function(status){
				return status < 500
			}
		})
		.then((response)=>{
			switch(response.status){
				case 200: this.setState({deleteOpen: false, targetBrandId: undefined}, ()=>this.componentDidMount());
					break;
				case 409: this.setState({deleteOpen: false, targetBrandId: undefined, errorOpen: true});
					break;
				default:
					this.setState({deleteOpen: false, targetBrandId: undefined});
					console.error("Response code not handled. Code:", response.status);
			}
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
					trigger={<Button onClick={()=>this.setState({formOpen: true})}>Create New Brand</Button>}
					header="New Brand"
					content={<BrandForm context={this} />}
					open={this.state.formOpen}
					onClose={()=>this.setState({formOpen: false})}
				/>
				<Modal
					// trigger={<Button style={actionBtnStyle} onClick={()=>this.setState({deleteOpen: true})}>Delete</Button>}
					header={"Delete Brand?"}
					actions={[
						<Button style={actionBtnStyle} key={"deleteBrandNo"} onClick={()=>this.setState({deleteOpen: false, targetBrandId: undefined})} >No</Button>,
						<Button style={actionBtnStyle} key={"deleteBrandYes"} onClick={this.handleDelete}>Yes</Button>
					]}
					onClose={()=>this.setState({deleteOpen: false, targetBrandId: undefined})}
					open={this.state.deleteOpen}
				/>
				<Modal
					actions={[<Button style={actionBtnStyle} key={"deleteError"} onClick={()=>this.setState({errorOpen: false})} >Ok</Button>,]}
					content={"Some orders are pending that contain products of this brand"}
					open={this.state.errorOpen}
					onClose={()=>this.setState({errorOpen: false})}
				/>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='3'>Brands ({this.state.brands.length})</Table.HeaderCell>
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
							this.state.brands.map((brand)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, brandId, brandId, brandDetailsEn, brandDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing>{/* <Icon name='folder' /> */} {brand.nameEn}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{brand.nameAr}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{brand.logo? <img src={brand.logo} style={{width: 200}} /> : null}</Table.Cell>
									<Table.Cell width="1" textAlign='center'>
										<Button style={actionBtnStyle}>Edit</Button>
										<Button style={actionBtnStyle} onClick={()=>this.setState({deleteOpen: true, targetBrandId: brand._id})} >Delete</Button>
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
}

class BrandForm extends Component {
	constructor(){
		super();
		this.state = {
			creating: false,
			error: null
		}
		this.newBrand = {}
	}
	handleSubmit = ()=>{
		console.log(this.newBrand);
		this.setState({creating: true});
		// setTimeout(()=>{
		// 	this.setState({creating: false})
		// }, 1000)
		let formData = new FormData();
		formData.append('nameEn', this.newBrand.nameEn)
		formData.append('nameAr', this.newBrand.nameAr)
		formData.append('logo', this.newBrand.logo)
		axios.post(`${process.env.URL || "http://localhost:3000"}/api/brands`, formData, {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			},
			validateStatus: function(status){
				return status < 500
			}
		})
		.then((response)=>{
			if(response.status < 300){
				return this.props.context.setState({formOpen: false}, ()=>{
					this.props.context.componentDidMount();
				})
			}
			this.setState({error: "Invalid Input"})
		})
		.catch((err)=>{
			this.setState({error: "Something went wrong"})
		})
	}
	render(){
		return(
			<div style={{padding: '20px'}}>
				<Form>
					{
						this.state.error?
						<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							{this.state.error}
						</div>
						:
						null
					}
					<Form.Field>
						<label>English Name</label>
						<input type="text" onChange={(event)=>this.newBrand.nameEn = event.currentTarget.value} />
					</Form.Field>
					<Form.Field>
						<label>Arabic Name</label>
						<input type="text" onChange={(event)=>this.newBrand.nameAr = event.currentTarget.value} />
					</Form.Field>
					<Form.Field>
						<label>Logo</label>
						<input type="file" onChange={(event)=>this.newBrand.logo = event.currentTarget.files[0]} />
					</Form.Field>
					<Button onClick={this.handleSubmit}>Submit <Loader active={this.state.creating} /></Button>
				</Form>
			</div>
		)
	}
}
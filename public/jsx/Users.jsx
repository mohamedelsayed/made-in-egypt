import React, { Component } from 'react'

export default class Users extends Component {
	constructor(){
		super();
		this.state = {
			users: []
		}
	}
	componentDidMount(){
		axios.get('http://localhost:3000/api/admin/users', {
			headers: {
				'x-auth-token': localStorage.getItem('auth')
			}
		})
		.then((response)=>{
			this.setState({users: response.data});
		})
		.catch((err)=>{
			console.error(err);
		})
	}
	render() {
		return (
			<div>
				<Table celled striped>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='3'>Brands ({this.state.brands.length})</Table.HeaderCell>
						</Table.Row>
						<Table.Row>
							<Table.HeaderCell textAlign='center'>Name</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Phone</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Email</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Address</Table.HeaderCell>
							<Table.HeaderCell textAlign='center'>Verified</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{
							this.state.users.map((user)=>{
								return(
								<Table.Row key={Math.random().toFixed(5)}>
									{/* nameEn, nameAr, description, price, quantity, photos, ratingTotal, brandId, brandId, brandDetailsEn, brandDetailsAr, views, reviews */}
									<Table.Cell width="1" collapsing>{/* <Icon name='folder' /> */} {user.firstName} {user.lastName}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{user.email}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{user.phone}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{user.address}</Table.Cell>
									<Table.Cell width="1" collapsing textAlign='center'>{user.verified? "Yes": "No"}</Table.Cell>
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

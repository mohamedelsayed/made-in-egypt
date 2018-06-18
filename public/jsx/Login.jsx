import React from 'react'
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import axios from 'axios';


export default class Login extends React.Component {
	constructor(){
		super();

		let username = "";
		let password = "";
	}

	handleSubmit = (event)=>{
		event.preventDefault();
		axios.post(`/api/admin/login`, {
			username: this.username,
			password: this.password
		},{
			validateStatus: function (status) {
				return status < 500; // Reject only if the status code is greater than or equal to 500
			}
		})
		.then((response)=>{
			console.log(response.status, response.data);
			if(response.status === 200){
				localStorage.setItem('auth', response.data.token);
			}
			this.props.changeView('products');
		})
		.catch((err)=>{
			console.error(err);
		})
	}

	render(){
		return (
			<div className='login-form'>
				{/*
					Heads up! The styles below are necessary for the correct render of this example.
					You can do same with CSS, the main idea is that all the elements up to the `Grid`
					below must have a height of 100%.
				*/}
				<style>{`
					body > div,
					body > div > div,
					body > div > div > div.login-form {
						height: 100%;
					}
				`}</style>
				<Grid
					textAlign='center'
					style={{ height: '100%' }}
					verticalAlign='middle'
				>
					<Grid.Column style={{ maxWidth: 450 }}>
						<Header as='h2' color='teal' textAlign='center'>
							<Image src='/logo.png' />
							{' '}Log-in to your account
						</Header>
						<Form size='large'>
							<Segment stacked>
								<Form.Input
									fluid
									icon='user'
									iconPosition='left'
									placeholder='Username'
									onChange={(event, input)=>this.username = input.value}
								/>
								<Form.Input
									fluid
									icon='lock'
									iconPosition='left'
									placeholder='Password'
									type='password'
									onChange={(event, input)=>this.password = input.value}
								/>
	
								<Button color='teal' fluid size='large' onClick={this.handleSubmit}>Login</Button>
							</Segment>
						</Form>
						{/* <Message>
							New to us? <a href='#'>Sign Up</a>
						</Message> */}
					</Grid.Column>
				</Grid>
			</div>
		)
	}
}

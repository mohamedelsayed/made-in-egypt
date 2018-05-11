import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Container, Button } from 'semantic-ui-react';
// import 'semantic-ui-css/semantic.min.css';
import axios from 'axios';

import Login from './Login.jsx';
import Products from './Products.jsx';

export default class App extends Component {
	constructor(){
		super();
		this.state = {
			currentView: <div></div>
		}
	}

	changeView = (view)=>{
		let componentShortCut = (ViewComponent)=>{
			return this.setState({currentView: <ViewComponent changeView={this.changeView} />})
		}
		switch(view){
			case 'login': componentShortCut(Login); break;
			case 'products': componentShortCut(Products); break;
			default: <div />
		}
	}

	componentDidMount(){
		let auth = localStorage.getItem('auth');
		if(auth){
			axios.get('http://localhost:3000/api/admin/auth', {
				headers: {
					'x-auth-token': auth
				}
			})
			.then((response)=>{
				if(response.status == 200){
					this.changeView('products');
				} else {
					console.warn('Something is wrong');
					this.changeView('login');
				}
			})
			.catch((err)=>{
				console.warn(err);
				this.changeView('login')
			})
		} else {
			this.changeView('login');
		}
	}

	render(){
		const navBarButtonStyle = {
			flex: 1
		}
		return(
			<div>
				<div style={{border: '1px solid #eee', borderRadius: '2px', display: 'flex', justifyContent: 'space-evenly', padding: '5px 20px'}}>
					<Button style={navBarButtonStyle}>Products</Button>
					<Button style={navBarButtonStyle}>Orders</Button>
					<Button style={navBarButtonStyle}>Brands</Button>
					<Button style={navBarButtonStyle}>Categories</Button>
				</div>
				{
					this.state.currentView
				}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'));


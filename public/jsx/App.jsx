import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Container } from 'semantic-ui-react';
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
		return(
			<div>
				{
					this.state.currentView
				}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'));


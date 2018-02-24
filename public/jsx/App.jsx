import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Container } from 'semantic-ui-react';
import axios from 'axios';

import Login from './Login.jsx';

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
			case 'login': componentShortCut(Login);
			default: <div />
		}
	}

	componentDidMount(){
		let auth = localStorage.getItem('auth');
		if(auth){
			axios.get('localhost:3000/api/admin/auth', {
				headers: {
					'x-auth-token': auth
				}
			})
			.then((response)=>{
				if(response.status == 200){
					this.changeView('dashboard');
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
			<Container>
				{
					this.state.currentView
				}
			</Container>
		)
	}
}


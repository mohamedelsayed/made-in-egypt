import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Container, Button } from 'semantic-ui-react';
// import 'semantic-ui-css/semantic.min.css';
import axios from 'axios';

import Login from './Login.jsx';
import Products from './Products.jsx';
import Categories from './Categories.jsx';
import Brands from './Brands.jsx';
import Users from './Users.jsx';
import Orders from './Orders.jsx';
import Admins from './Admin.jsx';

export default class App extends Component {
	constructor(){
		super();
		this.state = {
			currentView: <div></div>,
			master: undefined
		}
	}

	changeView = (view)=>{
		let componentShortCut = (ViewComponent)=>{
			return this.setState({currentView: <ViewComponent changeView={this.changeView} context={this} />})
		}
		switch(view){
			case 'login': componentShortCut(Login); break;
			case 'products': componentShortCut(Products); break;
			case 'categories': componentShortCut(Categories); break;
			case 'brands': componentShortCut(Brands); break;
			case 'users': componentShortCut(Users); break;
			case 'orders': componentShortCut(Orders); break;
			case 'admins': componentShortCut(Admins); break;
			default: <div />
		}
	}

	componentDidMount(){
		let auth = localStorage.getItem('auth');
		if(auth){
			axios.get(`/api/admin/auth`, {
				headers: {
					'x-auth-token': auth
				}
			})
			.then((response)=>{
				if(response.status == 200){
					this.setState({master: response.data.master});
					if(response.data.master){
						this.changeView('products');
					} else {
						this.changeView('orders');
					}
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
				{
					this.state.currentView.type.name !== undefined && this.state.currentView.type.name !== 'Login'?
					<div>
						{
							this.state.master?
							<div style={{border: '1px solid #eee', borderRadius: '2px', display: 'flex', justifyContent: 'space-evenly', padding: '5px 20px'}}>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('products')}>Products</Button>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('orders')}>Orders</Button>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('brands')}>Brands</Button>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('categories')}>Categories</Button>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('users')}>Users</Button>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('admins')}>Admins</Button>
								<Button style={navBarButtonStyle} onClick={()=>{
									localStorage.removeItem('auth');
									this.setState({master: undefined})
									this.componentDidMount();
								}}>Log Out</Button>
							</div>
							:
							<div style={{border: '1px solid #eee', borderRadius: '2px', display: 'flex', justifyContent: 'space-evenly', padding: '5px 20px'}}>
								<Button style={navBarButtonStyle} onClick={()=>this.changeView('orders')}>Orders</Button>
								<Button style={navBarButtonStyle} onClick={()=>{
									localStorage.removeItem('auth');
									this.setState({master: undefined})
									this.componentDidMount();
								}}>Log Out</Button>
							</div>
						}
					</div>
					:
					null
				}
				{
					this.state.currentView
				}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'));


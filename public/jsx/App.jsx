import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { LocaleProvider } from 'antd';
import en_US from 'antd/lib/locale-provider/en_US';

export default class App extends Component {
	constructor(){
		super();
		this.state = {

		}
	}

	render(){
		return(
			<LocaleProvider locale={en_US}>
				
			</LocaleProvider>
		)
	}
}


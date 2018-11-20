import React, { Component } from 'react';
import Table from 'rc-table';
import keys from 'lodash/keys';
import find from 'lodash/find';
import { Select } from 'rc-inputs';
import "rc-inputs/styles/select.css"

const validGovernorates = [
  'Giza',
  'Qalyubia',
  'Alexandria',
  'Aswan',
  'Asyut',
  'Beheira',
  'BeniSuef',
  'Dakahlia',
  'Damietta',
  'Faiyum',
  'Gharbia',
  'Ismailia',
  'KafrElSheikh',
  'Luxor',
  'Matruh',
  'Minya',
  'Monufia',
  'NewValley',
  'NorthSinai',
  'SouthSinai',
  'PortSaid',
  'Qena',
  'RedSea',
  'Sharqia',
  'Sohag',
  'Suez'
];


const parseToSelectOption = (element) => {
  return { option: element, style: { width: 'auto' } };
}

export default class freeShippingMinimumOrderTable extends Component {


  constructor(props) {
    super(props);
    this.state = {
      columns: [
        { title: 'Governorate', dataIndex: 'governorate', key: 'governorate', width: 100 },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 100 }
      ],
      data: [],
      governorate: validGovernorates.map(parseToSelectOption),
      dataObject: {
      }
    };
  }

  fetchfreeShippingMinimumOrder() {

    return new Promise((resolve, reject) => {

      fetch('http://localhost:3000/api/config')
        .then((res) => {
          return res.json();
        })
        .then(res => res.freeShippingMinimumOrder)
        .then(resolve, reject);
        
    });

  }

  componentDidMount() {
    this.fetchfreeShippingMinimumOrder()
      .then((freeShippingMinimumOrder) => {

        const governorates = keys(freeShippingMinimumOrder);
        const data = governorates.map((element, index) => {
          return { governorate: element, price: freeShippingMinimumOrder[element], key: index + 1 }
        });
        this.setState({
          data: [
            ...this.state.data,
            ...data
          ]
        });

      })
      .catch(console.error);
  }

  addItem(e) {
    if (e) {
      e.preventDefault();
    }
    const { governorate, price } = this.state.dataObject;
    if(governorate && price) {
      const { data } = this.state;
      const found = find(data, obj => obj.governorate === governorate);
      console.log(found);
      if (!found) {
        data.push({ governorate, price })
      }
      else {
        const index = data.indexOf(found);
        data[index] = { governorate, price };
      }
      this.setState({
        data
      });
      this.props.getData(data);
    }
    return;
  }


  enterPrice(e) {
    const selectedPrice = e.target.value;
    this.setState({
      dataObject: {
        ...this.state.dataObject,
        price: selectedPrice,
      }
    })
  }


  selectGovernorate(e) {
    const selectedGovernorate = e.option;
    this.setState({
      dataObject: {
        ...this.state.dataObject,
        governorate: selectedGovernorate,
      }
    })
  }

  render() {
    return (
      <div>
        <Table columns={this.state.columns} data={this.state.data}></Table>
        <input type="number" placeholder="Enter price" id="price" name="price" min="0" onChange={this.enterPrice.bind(this)}></input>
        <Select
          options={this.state.governorate} placeholder={"Select a governorate"}
          onChange={this.selectGovernorate.bind(this)}
        >
        </Select>
        <br/>
        <button onClick={this.addItem.bind(this)}>Add</button>
      </div>
    );
  }
}

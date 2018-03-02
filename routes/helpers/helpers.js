module.exports = {
	removeEmptyObjectKeys: (givenObject)=>{
		let theObject = {};
		Object.keys(givenObject).map((key)=>{
			if(givenObject[key]){
				theObject[key] = givenObject[key];
			}
		})
		return theObject;
	}
}
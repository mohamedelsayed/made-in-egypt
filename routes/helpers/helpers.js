module.exports = {
	removeEmptyObjectKeys: (givenObject)=>{
		let theObject = {};
		Object.keys(theObject).map((key)=>{
			if(givenObject[key]){
				theObject[key] = givenObject[key];
			}
		})
		return theObject;
	}
}
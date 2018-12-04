const myClassObj = function(name) {
	this.name = name
};

myClassObj.prototype = {
	orderlist: function() {
		console.log('Hello')
	}
};
module.exports = new myClassObj('orderlist');

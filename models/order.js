const _order_title = Symbol('title');
const _order_desc = Symbol('desc');

module.exports = class Order {
    constructor(title,desc) {
        this[_order_title] = title;
        this[_order_desc] = desc;
    }
    get title() {
        return this[_order_title];
    }
    set title(newTitle) {
        this[_order_title] = newTitle;
    }
    get desc() {
        return this[_order_desc]; 
    }
    set desc(newDesc) {
        this[_order_desc] = newDesc;
    }
}
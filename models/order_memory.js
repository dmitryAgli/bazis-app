const Order = require('./order');
let orders = [];

exports.create = async function (key,title,desc) {
    const order = new Order(key,title,desc);
    orders[order.key] = order;
    return orders[order.key]  
};

exports.keylist = async function () {
    return Object.keys(orders);
};

exports.read = async function (key) {
    if (orders[key]) return orders[key];
    else throw new Error(`Order ${key} does not exist`);
};

exports.update = async function (key,title,desc) {
    const order = new Order(key,title,desc);
    orders[key] = order;
};

exports.destroy = async function (key) {
    if (orders[key]) delete orders[key];
    else throw new Error(`Order ${key} does not exist`);
};


const util = require('util');
const Order = require('./order');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const createObjectId = function(id) {
    const ObjectId = mongodb.ObjectId; 
    const o_id = new ObjectId(id);
    return o_id;
}

let client;

async function connectDB() {
    if (!client) client = await MongoClient.connect('mongodb://localhost:27017',{useNewUrlParser:true});
    return {
        db: client.db('bazis'),
        client: client
    };
}

exports.create = async function (title, desc) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    await collection.insertOne({
        orderTitle: title,
        orderDesc: desc
    });
}

exports.update = async function (id, title, desc) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    await collection.updateOne({
        _id: id
    }, {
        $set: {
            orderTitle: title,
            orderDesc: desc
        }
    });
}

exports.read = async function (key) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    const doc = await collection.findOne({
        orderKey: key
    });
    if (doc) {
        const order = new Order(doc.orderKey, doc.orderTitle, doc.orderDesc);
        return order;
    } else throw new Error(`Order ${key} does not exist`);
}

exports.readById = async function (id) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    const ord = await collection.findOne({
        _id: id
    });
    if (ord) {
        return ord;
    } else throw new Error(`Order ${id} does not exist`);
}

exports.destroy = async function (id) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    await collection.findOneAndDelete({
        _id: id
    });
}

exports.idlist = async function() {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    const keyz = await new Promise((resolve, reject) => {
        var keyz = [];
        collection.find().forEach(
            order => {
                keyz.push(order._id);
            },
            err => {
                if (err) reject(err);
                else resolve(keyz);
            }
        );
    });
    return keyz;
}

exports.count = async function() {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    const count = await collection.count();
    return count;
}

exports.close = async function() {
    if (client) client.close();
    client = undefined;
}
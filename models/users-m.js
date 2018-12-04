const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const createObjectId = function (id) {
    const o_id = new ObjectId(id);
    return o_id;
}

let client;

async function connectDB() {
    if (!client) client = await MongoClient.connect('mongodb://localhost:27017', {
        useNewUrlParser: true
    });
    return {
        db: client.db('bazis'),
        client: client
    };
}

exports.create = async function (name, desc, pass, role, org) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    await collection.insertOne({
        userName: name,
        userDescription: desc,
        userPassword: pass,
        userRole: role,
        userOrgUnity: org,
        userBushs: []
    });
}

exports.userPasswordCheck = async function (name, password) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    const user = await collection.findOne({
        userName: name
    });
    if (!user) {
        return {
            check: false,
            username: name,
            message: "Пользователь не найден"
        };
    } else if (user.userName === name && user.userPassword === password) {
        return {
            check: true,
            username: user.userName,
            userId: user._id
        };
    } else {
        return {
            check: false,
            username: user.userName,
            message: "Пароль указан неверно"
        };
    }
}

exports.find = async function (id) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    const user = await collection.findOne({
        _id: id
    });
    if (user) {
        return user;
    } else throw new Error(`User ${id} does not exist`);
}

exports.idlist = async function() {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    const keyz = await new Promise((resolve, reject) => {
        var keyz = [];
        collection.find().forEach(
            user => {
                keyz.push(user._id);
            },
            err => {
                if (err) reject(err);
                else resolve(keyz);
            }
        );
    });
    return keyz;
}

exports.update = async function (id, name, desc, pass, role, org) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    await collection.updateOne({
        _id: id
    }, {
        $set: {
            userName: name,
            userDescription: desc,
            userPassword: pass,
            userRole: role,
            userOrgUnity: org
        }
    });
}

exports.destroy = async function (id) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    await collection.findOneAndDelete({
        _id: id
    });
}
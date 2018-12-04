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

exports.rigsList = async function() {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('rigs');

    const rigsList = await new Promise((resolve, reject) => {
        var rigsList = [];
        collection.find().forEach(
            rig => {
                rigsList.push(rig);
            },
            err => {
                if (err) reject(err);
                else resolve(rigsList);
            }
        );
    });
    return rigsList;
}

exports.addRig = async function (num, type) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('rigs');
    await collection.insertOne({
        rig_num: num,
        rig_type: type
    });
}

exports.deleteRig = async function (id) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('rigs');
    await collection.findOneAndDelete({
        _id: id
    });
}
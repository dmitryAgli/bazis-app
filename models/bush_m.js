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

exports.addBush = async function (id, bush, oilfield, rig_num, rig_type) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    await collection.updateOne({
        _id: id
    }, 
    { $push: 
        {userBushs: {
            bush_id: new ObjectId(),
            userBush: bush,
            userOilField: oilfield,
            userRigNum: rig_num,
            userRigType: rig_type
        } } 
    });
}

exports.deleteBush = async function (userId, bushId) {
    userId = createObjectId(userId);
    bushId = createObjectId(bushId);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    await collection.updateOne({
        _id: userId
    }, 
    { $pull: 
        {userBushs: {
            bush_id: bushId
        } } 
    });
}

exports.findBush = async function (bush_id_str) {
    const bush_id_obj = createObjectId(bush_id_str);
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('users');
    const user = await collection.findOne({
            'userBushs.bush_id': bush_id_obj
        });
    if (user) {
        return user.userBushs.filter((obj) => obj.bush_id.toString() === bush_id_str )[0];
    } else throw new Error(`Bush ${bush_id_str} does not exist`);
}

exports.getRigType = async function (num) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('rigs');
    const rig = await collection.findOne({
            rig_num: num
        });
    if (rig) {
        return rig.rig_type;
    }
}
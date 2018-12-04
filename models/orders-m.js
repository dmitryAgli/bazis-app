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

exports.create = async function (user_desc,
                                user_org,
                                order_req,
                                bush,
                                order_quantity,
                                order_unit,
                                order_desc) {
    const {
        db,
        client
    } = await connectDB();
    const collection = db.collection('orders');
    await collection.insertOne({
        date: new Date(),
        user: user_desc,
        userOrgUnity: user_org,
        bush: bush.userBush,
        oilfield: bush.userOilField,
        rig_num: bush.userRigNum,
        rig_type: bush.userRigType, 
        orderRequest: order_req,
        orderQuantity: order_quantity,
        orderUnit: order_unit,
        orderStatus: 'Новая',
        statusHistory: [{
            statusTimeStamp: new Date(),
            user: user_desc,
            orderStatus: "Новая"
        }],
        curator: " ",
        shop: " ",
        messages: [{
            messageTimeStamp: new Date(),
            user: user_desc,
            message: order_desc
        }]
    });
}

exports.update = async function (id, curator, status, shop, message, user) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();

    if(!shop) shop = " ";

    const collection = db.collection('orders');
    let ord = await collection.updateOne({
        _id: id
    }, {
        $set: {
            orderStatus: status,
            curator: curator,
            shop: shop
        },
        $push: {
            statusHistory: {
                statusTimeStamp: new Date(),
                user: user,
                orderStatus: status
            },
            messages: {
                messageTimeStamp: new Date(),
                user: user,
                message: message
            }
        }
    });
    if (ord) {
        return ord.result;
    }
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

exports.readById = async function (id,proj) {
    if(typeof(id)==='string') id = createObjectId(id);
    const {
        db,
        client
    } = await connectDB();

    if(!proj) proj = {};

    const collection = db.collection('orders');
    const ord = await collection.find({_id: id}).project(proj);
    if (ord) {
        return ord.next();
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

// exports.idlist = async function(sortBy, sortMod) {
//     const {
//         db,
//         client
//     } = await connectDB();

//     console.log(sortMod);

//     const collection = db.collection('orders');
//     const keyz = await new Promise((resolve, reject) => {
//         var keyz = [];
//         collection.find().sort({[sortBy]: parseInt(sortMod)}).forEach(
//             order => {
//                 keyz.push(order._id);
//             },
//             err => {
//                 if (err) reject(err);
//                 else resolve(keyz);
//             }
//         );
//     });
//     return keyz;
// }

exports.idlist = async function(sortBy,sortOrd,filter) {
    const {
        db,
        client
    } = await connectDB();

    //Filter the close orders
    if(!filter) {
        filter = { orderStatus: { $ne: "Выполнено" } };
    } else {
        if(!filter.orderStatus) {
            filter.orderStatus = { $ne: "Выполнено" } ;
        } else {
            let filterValue = filter.orderStatus;
            if(filterValue !== "Выполнено") {
                filter.orderStatus = { $ne: "Выполнено", $eq: filterValue };
            }
        }
    }

    const collection = db.collection('orders');
    const keyz = await new Promise((resolve, reject) => {
        var keyz = [];
        collection.find(filter).sort({[sortBy]: parseInt(sortOrd)}).forEach(
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

exports.distinct = async function(orderslist) {
    // const {
    //     db,
    //     client
    // } = await connectDB();

    // const collection = db.collection('orders');

    // const ordKeys = ['user','userOrgUnity','oilfield','curator','shop'];

    // let keysPromises = ordKeys.map((key)=> {
    //     return collection.distinct(key);
    // });

    // let uniqValObj = Promise.all(keysPromises).then(values => {
    //     let o = {};
    //     values.forEach((v,i) => {
    //         o[ordKeys[i]] = v
    //     })
    //     return o
    // });

    // return uniqValObj;

// >>> Set the parametrs to distinct <<<
    const ordKeys = ['user','userOrgUnity','oilfield','curator','orderStatus','shop'];

    let disObj = ordKeys.map((d,i) => {
        return {
            [d] : new Array()
        }
    })

    ordKeys.forEach((key,j)=> {

        orderslist.forEach((ord) => {
                disObj[j][key].push(ord[key]);
        })

    })

    let uniqVal = disObj.map(obj=>{
        let key = Object.keys(obj)[0];
        return {
            [key] : [...new Set(obj[key])]
        }
    })

    let obj = uniqVal.map((d,i)=> {
        let key = Object.keys(d)[0];
        let arr = d[key];
        let arrWithKeys = arr.map(d=> {
            return {
                [key] : d
            }
        })
        return {
            [key]: arrWithKeys
        }
    })

    let o = {};

    obj.forEach((d,i)=>{
        let key = Object.keys(d)[0];
        o[key] = d[key];
    })

    return o
    
}

exports.allidlist = async function() {
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
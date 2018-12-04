var express = require('express');
var router = express.Router();
const orderObj = require('../models/orders-m');
const usersObj = require('../models/users-m');
const bushObj = require('../models/bush_m');
const moment = require('moment');

/* Add a new order */
router.get('/add', async function(req, res, next) {
  const user = await usersObj.find(req.cookies.userId);
  res.render('Order/newOrder',{
        userBushs: user.userBushs.reverse(),
        title: 'Добавить новую заявку'
  })
});

/* Add a new order */
router.post('/save', async function(req, res, next) {
  const bush = await bushObj.findBush(req.body.order_bush_id);

  const order = await orderObj.create(req.body.user_desc,
                                      req.body.user_orgUnity,
                                      req.body.order_req,
                                      bush,
                                      req.body.order_quantity,
                                      req.body.order_unit,
                                      req.body.order_desc)
        .then(()=> console.log('The order added successfully'))
        .catch((err)=> console.log(err));
  res.redirect('../')
});

/* View an order item*/
router.get('/view', async function(req, res, next){
  const order = await orderObj.readById(req.query.id);
  
  order.statusHistory.forEach((d)=>{
    d.statusTimeStamp = moment(d.statusTimeStamp).format("DD.MM.YY HH:mm");
  });

  order.messages.forEach((d)=>{
    d.messageTimeStamp = moment(d.messageTimeStamp).format("DD.MM.YY HH:mm");
  });
  
  res.render('Order/viewOrder',{
        order: order,
        statusHistory: order.statusHistory,
        messages: order.messages,
        orderStatus: order.statusHistory[order.statusHistory.length-1].orderStatus,
        sidebar: 'view order',
        title: "Просмотр заявки"
  })
});

/* Update order*/
router.get('/update', async function(req, res, next){
  const order = await orderObj.readById(req.query.id);
  
  order.statusHistory.forEach((d)=>{
    d.statusTimeStamp = moment(d.statusTimeStamp).format("DD.MM.YY HH:mm");
  });

  order.messages.forEach((d)=>{
    d.messageTimeStamp = moment(d.messageTimeStamp).format("DD.MM.YY HH:mm");
  });
  
  res.render('Order/updateOrder',{
        order: order,
        statusHistory: order.statusHistory,
        messages: order.messages,
        // orderStatus: order.statusHistory[order.statusHistory.length-1].orderStatus,
        sidebar: 'update order',
        title: "Обработать заявку"
  })
});

router.post('/update', async function(req, res, next){
  const order = await orderObj.update(req.body.id,
                                      req.body.curator,
                                      req.body.status,
                                      req.body.shop,
                                      req.body.message,
                                      req.body.user)
          .then(()=> console.log('The order update successfully'))
          .catch((err)=> console.log(err));;  
  res.redirect('../')
});

/* Delete order*/
router.get('/delete', async function(req, res, next) {
  const order = await orderObj.destroy(req.query.id)
      .then(()=> console.log('The order delete successfully'))
      .catch((err)=> console.log(err));;  
  res.redirect('/')
})

router.post('/delete/confirm', async function(req, res, next) {
  const order = await orderObj.destroy(req.query.id)
      .then(()=> console.log('The order delete successfully'))
      .catch((err)=> console.log(err));;  
  res.redirect('../../')
})

/* Packed Update Orders*/
router.get('/updatepack', async function(req, res, next){

  if (req.app.locals.idlist.ordersId.length) {

    const idlist = req.app.locals.idlist.ordersId.match(/\w+/g);
    
    let idPromises = idlist.map(id => {
      return orderObj.readById(id, projDBParam)
    });
    let orderslist = await Promise.all(idPromises);
  
    //Handle the orderlist date keys
    orderslist.forEach((d) => {
      if (d.date) d.date = moment(d.date).format("DD.MM.YY HH:mm");
    })
  
    res.render('Order/packedUpdate', {
        title: 'Пакетная обработка заявок',
        orderlist: orderslist,
        sidebar: 'packedupdate order'
      });
  
  } else {

    res.cookie('alert','Для обработки заявок, Вам необходимо выбрать одну или более заявок в Листе заявок',{maxAge:99999});
    res.redirect('/')

  }
  
});

router.post('/updatepack', async function(req, res, next) {
    res.app.locals.idlist = req.body;
    res.render('Order/packedUpdate');
});

router.get('/updatepack/save', async function(req, res, next){
  let packlist = JSON.parse(req.app.locals.packlist.orders);
  
  //Filter orders with status " "
  packlist = packlist.filter(ord=> {return ord.status !== " "});

  //Update orders in DB
  let updatePromises = packlist.map(ord => {
    return orderObj.update(ord.id,
                          ord.curator,
                          ord.status,
                          ord.shop,
                          ord.message,
                          ord.user)
  });
  let updatelist = await Promise.all(updatePromises);

    let idlist = [];

    packlist.forEach(ord=> idlist.push(ord.id));
    
    let idPromises = idlist.map(id => {
      return orderObj.readById(id, projDBParam)
    });
    let orderslist = await Promise.all(idPromises);
  
    //Handle the orderlist date keys
    orderslist.forEach((d) => {
      if (d.date) d.date = moment(d.date).format("DD.MM.YY HH:mm");
    })

    updatelist = updatelist.filter((d)=> {return d.ok === 1});

    let alert = `В системе обновлено документов: ${updatelist.length}`;
  
    res.render('Order/packedUpdate', {
        title: 'Пакетная обработка заявок',
        orderlist: orderslist,
        sidebar: 'packedupdate order',
        alert: alert
      });
  
});

router.post('/updatepack/save', async function(req, res, next) {
  res.app.locals.packlist = req.body;
  res.render('Order/packedUpdate');
});

module.exports = router;
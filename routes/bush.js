var express = require('express');
var router = express.Router();
const bushObj = require('../models/bush_m');
const userObj = require('../models/users-m');

/* View Bush List*/
router.get('/', async function(req, res, next){
    const user = await userObj.find(req.cookies.userId);
    res.render('Order/Bush/viewBushs',{
          userBushs: user.userBushs.reverse(),
          title: "Список кустов пользователя"
    })
  });
  
  /* Add the new Bush*/
  router.get('/add', async function(req, res, next){
    res.render('Order/Bush/addBush',{
          title: "Добавить куст"
    })
  });
  
  router.post('/save', async function(req, res, next){
    const rig_type = await bushObj.getRigType(req.body.rig_num);
  
    const user = await bushObj.addBush(req.cookies.userId, req.body.bush, req.body.oilfield, req.body.rig_num, rig_type)
            .then(()=> console.log('The users bush add successfully'))
            .catch((err)=> console.log(err));  
    res.cookie('alert','Новый куст добавлен успешно');
    res.redirect('/bushList')
  });
  
  router.get('/delete', async function(req, res, next) {
    const user = await bushObj.deleteBush(req.cookies.userId, req.query.bushId)
         .then(()=> console.log('The bush delete successfully'))
         .catch((err)=> console.log(err));
    res.cookie('alert','Новый куст успешно удален');
    res.redirect('/bushList');
  })

  module.exports = router;
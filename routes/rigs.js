var express = require('express');
var router = express.Router();
const rigObj = require('../models/rigs_m');

/* View Bush List*/
router.get('/', async function(req, res, next){
    const rigsList = await rigObj.rigsList();
    res.render('Rigs/viewRigs',{
          rigsList: rigsList,
          title: "View the Rigs"
    })
  });
  
  /* Add the new Bush*/
  router.get('/add', async function(req, res, next){
    res.render('Rigs/addRig',{
          title: "Add the new Rig"
    })
  });
  
  router.post('/save', async function(req, res, next){
    const rig = await rigObj.addRig(req.body.rig_num, req.body.rig_type)
            .then(()=> res.cookie('alert','The new rig add successfully'))
            .catch((err)=> console.log(err));  
    res.redirect('/rigs')
  });
  
  router.get('/delete', async function(req, res, next) {
    const rig = await rigObj.deleteRig(req.query.rigId)
         .then(()=> console.log('The rig delete successfully'))
         .catch((err)=> console.log(err));
    res.cookie('alert','The rig delete successfully');
    res.redirect('/rigs')
  })

  module.exports = router;
var express = require('express');
var router = express.Router();
const usersObj = require('../models/users-m');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET users list */
router.get('/usersList', async function(req, res, next) {
  let idlist = await usersObj.idlist();
  let idPromises = idlist.reverse().map(id => {
    return usersObj.find(id)
  });
  let userslist = await Promise.all(idPromises);

  res.render('User/usersList', {
    title: 'Users List',
    sidebar: 'user',
    userslist: userslist
  });
});

/* Add a new user */
router.get('/add', async function(req, res, next) {
  res.render('User/newUser', { title: 'Create a new user'});
});

/* Add a new user */
router.post('/save', async function(req, res, next) {
    const order = await usersObj.create(req.body.name, req.body.userDesc, req.body.password, req.body.role, req.body.orgUnity)
          .then(()=> console.log('The user added successfully'))
          .catch((err)=> console.log(err));
    res.redirect('/users/usersList')
});

/* Edit a user*/
router.get('/edit', async function(req, res, next){
  const user = await usersObj.find(req.query.id);
  res.render('User/editUser',{
        user: user,
        title: "Edit the user"
  })
});

/* Edit a user*/
router.get('/update', async function(req, res, next){
  const user = await usersObj.find(req.query.id);
  res.render('User/updateUser',{
        user: user,
        title: "Update the user"
  })
});

/* Update the user*/
router.post('/update', async function(req, res, next){
  const user = await usersObj.update(req.body.id,req.body.name, req.body.userDesc, req.body.password, req.body.role, req.body.orgUnity)
          .then(()=> console.log('The order update successfully'))
          .catch((err)=> console.log(err));  
  res.redirect('/users/usersList')
});

router.get('/delete', async function(req, res, next) {
  const user = await usersObj.destroy(req.query.id)
       .then(()=> console.log('The user delete successfully'))
       .catch((err)=> console.log(err));
  res.cookie('alert','The user delete successfully',{maxAge:99999});
  res.redirect('/users/usersList')
})

/* User search*/
router.get('/search', async function(req, res, next){
  let idlist = await usersObj.idlist();
  let idPromises = idlist.reverse().map(id => {
    return usersObj.find(id)
  });
  let userslist = await Promise.all(idPromises);

  //Users filter
  function filter(query) {
    console.log(query);
    return userslist.filter((user) => {
      return user.userDescription.match(new RegExp(query,'i'));
    });
  }
  userslist = filter(req.query.name);

  res.render('User/usersList',{
        userslist: userslist,
        sidebar: 'user',
        title: 'Search result(s)'
  })
});

module.exports = router;

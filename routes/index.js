var express = require('express');
var router = express.Router();
const moment = require('moment');
const ordList = require('../routes/orderslist');
const orders = require('../models/orders-m');
const usersObj = require('../models/users-m');

/* GET home page. */
router.get('/', async function (req, res, next) {

  //Retrive and handle projection param
  queryArr = Object.keys(req.query);

  let projQueryArr = [];
  let sortQueryArr = [];

  queryArr.forEach(function (d) {
    if (d == 'sortBy' || d == 'sortOrd') {
      sortQueryArr.push(d)
    } else {
      projQueryArr.push(d)
    }
  })

  projDBParam = {};
  projQueryArr.forEach((d) => projDBParam[d] = 1);
  //end

  //Saving Users Projection Params in Cookies
  if (Object.keys(projDBParam).length > 0) {
    res.cookie('projQ', projDBParam, {
      maxAge: 999999999999999999
    });
  } else {
    projDBParam = req.cookies.projQ;
  }

  //Sorting mode by default
  let sortBy, sortOrd;
  if (!req.query.sortBy) {
    sortBy = 'date';
    sortOrd = -1;
  } else {
    sortBy = req.query.sortBy;
    sortOrd = req.query.sortOrd;
  }

  //Filters
  let cookieFilterObj = req.cookies.filterQ;
  let filterQueryObj = {};

  // >>> HANDLE WITH PART for each filter>>>
  let filterParams = ['filter_user', 'filter_userOrgUnity', 'filter_oilfield', 'filter_curator', 'filter_orderStatus', 'filter_shop'];
  let filterDBParams = ['user', 'userOrgUnity', 'oilfield', 'curator', 'orderStatus', 'shop'];
  // <<<                  >>>

  filterParams.forEach((param, i) => {

    if (req.query[param]) {
      if (req.query[param] !== "Show All") {
        filterQueryObj[filterDBParams[i]] = req.query[param]
      } else if (cookieFilterObj) {
        delete cookieFilterObj[filterDBParams[i]]
        res.cookie('filterQ', cookieFilterObj, {
          maxAge: 999999999999999999
        });
      }
    }

  })

  //Saving Users FILTER Params in Cookies
  if (Object.keys(filterQueryObj).length !== 0) {
    res.cookie('filterQ', filterQueryObj, {
      maxAge: 999999999999999999
    });
  } else {
    filterQueryObj = cookieFilterObj;
  }

  //Retriving orders from DB
  let idlist = await orders.idlist(sortBy, sortOrd, filterQueryObj);
  let idPromises = idlist.map(id => {
    return orders.readById(id, projDBParam)
  });
  let orderslist = await Promise.all(idPromises);

  //Filter by dates
  if (req.query.date) {
    let dateFrom = req.query.date_from;
    let dateTo = req.query.date_to;

    if (dateFrom && !dateTo) {
      orderslist = orderslist.filter(d => {
        return moment(d.date).format("YYYY-MM-DD") >= dateFrom
      })
    }

    if (!dateFrom && dateTo) {
      orderslist = orderslist.filter(d => {
        return moment(d.date).format("YYYY-MM-DD") <= dateTo
      })
    }

    if (dateFrom && dateTo) {
      orderslist = orderslist.filter(d => {
        return ((moment(d.date).format("YYYY-MM-DD") >= dateFrom) && (moment(d.date).format("YYYY-MM-DD") <= dateTo))
      })
    }
  }
  
  //Handle the orderlist date keys
  orderslist.forEach((d) => {
    if (d.orderStatus !== "Close") d.daysOn = moment(new Date()).diff(d.date,'days').toString();
    if (d.date) d.date = moment(d.date).format("DD.MM.YY HH:mm");
  })



  //Filter by DaysOn and set cookies
  let daysOn = req.query.filter_daysOn;
  if(!daysOn) {
    daysOn = req.cookies.daysQ;
    if(daysOn) {
      orderslist = orderslist.filter(d => {
        return parseInt(d.daysOn) >= daysOn
      })
    }
  } else {
    res.cookie('daysQ', daysOn, {
      maxAge: 999999999999999999
    });
    orderslist = orderslist.filter(d => {
      return parseInt(d.daysOn) >= req.query.filter_daysOn
    })
  }

  // let projKeys = Object.keys(req.cookies.projQ);
  let datenow = moment((new Date()).now).format("DD.MM.YY HH:mm");

  //Finds the distinct values for a specified field across
  let distinctObj = await orders.distinct(orderslist);

  //Set local orderlist
  res.app.locals.orderlist = orderslist;

  let emptyOrdlist = false;

  if (orderslist.length === 0) {
    emptyOrdlist = "Лист заявок пуст. (Выберете: Показать Фильтры -> Сброс, чтобы отобразить все активные заявки в системе)"
  }

    res.render('index', {
      title: 'Лист заявок',
      sidebar: 'filter',
      datenow: datenow,
      daysOn: daysOn,
      orderlist: orderslist,
      distinct: distinctObj,
      filter: filterQueryObj,
      emptyOrdlist: emptyOrdlist
    });

});

/* GET user login */
router.get('/reset', async function (req, res, next) {
  res.clearCookie('projQ');
  res.clearCookie('filterQ');
  res.clearCookie('daysQ');
  res.redirect('/')
});

/* GET user login */
router.get('/login', async function (req, res, next) {
  res.render('userLogin', {
    title: 'User login page'
  });
});

/* GET user logout */
router.get('/logout', async function (req, res, next) {
  res.clearCookie('userId');
  res.redirect('/')
});

/* Checkout user login */
router.post('/passwordCheck', async function (req, res, next) {
  const check = await usersObj.userPasswordCheck(req.body.userName, req.body.userPassword);
  if (check.check) {
    res.cookie('userId', check.userId, {
      maxAge: 999999999999999999
    });
    return res.redirect('/');
  }
  res.render('userLogin', {
    title: 'User login page',
    message: check.message
  });
});

module.exports = router;
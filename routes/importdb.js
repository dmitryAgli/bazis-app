var express = require('express');
var router = express.Router();
const moment = require('moment');
const orders = require('../models/orders-m');
const excel = require('node-excel-export');

// Get Excel Import DB report
router.get('/', async function (req, res, next) {

    //Retriving orders from DB
    let idlist = await orders.allidlist();
    let idPromises = idlist.map(id => {
        return orders.readById(id)
    });
    let orderslist = await Promise.all(idPromises);

    //Handle the orders
    orderslist.forEach((d, i) => {

        //Handle time from Unix
        d.date = moment(d.date).format("DD.MM.YY HH:mm");

        //Delete id
        if (d._id) {
            delete d._id
        }

        // Handle the statusHistory
        if (d.statusHistory) {
            d.statusHistory.forEach((st_d, st_i) => {
                if (st_d.orderStatus === "Perform to") st_d.orderStatus = "Perform_to";
                if (st_d.orderStatus === "In Process") st_d.orderStatus = "In_Process";
                d['orderStatus_' + st_d.orderStatus] = moment(st_d.statusTimeStamp).format("DD.MM.YY HH:mm");
            })
            delete d.statusHistory;
        };

        //// Handle the message
        if (d.messages) {
            d.message = d.messages[0].message;
            delete d.messages
        };

        //add №n/n
        d.n = (i + 1).toString();

        ['orderStatus_new', 'orderStatus_In_Process', 'orderStatus_Perform_to', 'orderStatus_Done', 'orderStatus_Close'].forEach(q => {
            if (!d[q]) d[q] = " ";
        })
    });

    // You can define styles as json object
    const styles = {
        tableHeader: {
            font: {
                bold: true,
            },
            border: {
                top: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                bottom: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                left: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                right: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                }
            },
            alignment: {
                horizontal: "center"
            }
        },
        tableCell: {
            border: {
                top: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                bottom: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                left: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                },
                right: {
                    style: 'thin',
                    color: {
                        rgb: "00000000"
                    }
                }
            }
        },
        reportHeader: {
            font: {
                bold: true,
                sz: 13
            },
            alignment: {
                horizontal: "center"
            }
        }
    };

    const heading = [
        [{
            value: 'Система учета текущих производственных потребностей BAZIS (полная выгрузка из базы)',
            style: styles.reportHeader
        }],
        [{
            value: 'выгрузка от ' + moment((new Date()).now).format("DD.MM.YY HH:mm"),
            style: styles.reportHeader
        }],
        [" "]
    ];

    const orderModel = {
        n: "№",
        date: "Дата",
        user: "Бригада",
        userOrgUnity: "Орг.единица",
        bush: "Куст",
        oilfield: "Месторождение",
        rig_num: "зав.№ БУ",
        rig_type: "тип БУ",
        orderRequest: "Заявка (запрос)",
        message: "Основание для выдачи",
        orderQuantity: "Кол-во",
        orderUnit: "Ед.изм",
        orderStatus: "Статус",
        curator: "Куратор",
        shop: "Цех",
        orderStatus_new: "Дата подачи",
        orderStatus_In_Process: "Дата принятия (спец)",
        orderStatus_Perform_to: "Дата распределения (спец)",
        orderStatus_Done: "Дата выполнения (цех)",
        orderStatus_Close: "Дата закрытия (бр)"
    };

    let orderKeys = Object.keys(orderModel);

    // let lastElement = orderKeys.pop();
    // orderKeys.unshift(lastElement);

    let specification = {};

    orderKeys.forEach((d) => {

        //Calculate the cell width
        //Find all values in the column
        arr = [];
        orderslist.forEach(j => {
            if (j[d]) arr.push(j[d]);
        });

        // Find the longest word
        let cellWidth = findTheLongestWord(arr);
        if (cellWidth < orderModel[d].length) cellWidth = orderModel[d].length;

        specification[d] = {
            displayName: orderModel[d],
            headerStyle: styles.tableHeader,
            cellStyle: styles.tableCell,
            width: cellWidth.toString()
        }
    })

    function findTheLongestWord(arr) {
        arr.sort((a, b) => {
            return a.length - b.length
        })
        return arr[arr.length - 1].length + 2;
    }

    const dataset = orderslist;

    const merges = [{
            start: {
                row: 1,
                column: 1
            },
            end: {
                row: 1,
                column: orderKeys.length
            }
        },
        {
            start: {
                row: 2,
                column: 1
            },
            end: {
                row: 2,
                column: orderKeys.length
            }
        },
        {
            start: {
                row: 3,
                column: 1
            },
            end: {
                row: 3,
                column: 1
            }
        }
    ]

    const report = excel.buildExport(
        [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
            {
                name: 'Importdb', // <- Specify sheet name (optional)
                heading: heading, // <- Raw heading array (optional)
                merges: merges, // <- Merge cell ranges
                specification: specification, // <- Report specification
                data: dataset // <-- Report data
            }
        ]
    );

    // You can then return this straight
    res.attachment('importdb.xlsx'); // This is sails.js specific (in general you need to set headers)
    return res.send(report);

});

module.exports = router;
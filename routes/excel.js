var express = require('express');
var router = express.Router();
const moment = require('moment');
const excel = require('node-excel-export');

/* GET Excel report */
router.get('/', async function (req, res, next) {

    const globalorderlist = req.app.locals.orderlist;

    if (!globalorderlist) {
        res.redirect('/')
    }

    //Delete statusHistory and messages
    globalorderlist.forEach((d, i) => {
        d.n = (i + 1).toString();
        if (d.statusHistory) {
            delete d.statusHistory
        };
        if (d.messages) {
            delete d.messages
        };
        if (d._id) {
            delete d._id
        }
    });

    // You can define styles as json object
    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF000000'
                }
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 14,
                bold: true,
                underline: true
            }
        },
        cellPink: {
            fill: {
                fgColor: {
                    rgb: 'FFFFCCFF'
                }
            }
        },
        cellGreen: {
            fill: {
                fgColor: {
                    rgb: 'FF00FF00'
                }
            }
        },
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
            value: 'Система учета текущих производственных потребностей BAZIS',
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
        orderQuantity: "Кол-во",
        orderUnit: "Ед.изм",
        orderStatus: "Статус",
        curator: "Куратор",
        shop: "Цех / Участок",
        daysOn: "Дней в системе"
    };

    let orderKeys = Object.keys(globalorderlist[0]);

    let lastElement = orderKeys.pop();
    orderKeys.unshift(lastElement);

    let specification = {};


    orderKeys.forEach((d) => {

        //Calculate the cell width
        //Find all values in the column
        arr = [];
        globalorderlist.forEach(j => {
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

    const dataset = globalorderlist;

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

    // Create the excel report.
    // This function will return Buffer
    const report = excel.buildExport(
        [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
            {
                name: 'Report', // <- Specify sheet name (optional)
                heading: heading, // <- Raw heading array (optional)
                merges: merges, // <- Merge cell ranges
                specification: specification, // <- Report specification
                data: dataset // <-- Report data
            }
        ]
    );

    // You can then return this straight
    res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers)
    return res.send(report);

});

module.exports = router;
const rp = require('request-promise');
const $ = require('cheerio');
const departmentList = 'http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx';

const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Unofficial ACRD API'))

app.get('/departments', (req, res) => {
    rp(departmentList)
    .then((html) => {
        let array = []
        $('#wb-main-in > ul:nth-child(352)', html).children().each((i, item) => {
            array.push(item.children[0].data)
        });
        res.send(JSON.stringify(array));
    })
    .catch((err) => {
        //handle error
        res.send({ "error": err });
    })
});

app.listen(port, () => console.log(`listening on port ${port}!`))
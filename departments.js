const rp = require('request-promise');
const $ = require('cheerio');
const url = 'http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx';

rp(url)
    .then((html) => {
        let array = []
        $('#wb-main-in > ul:nth-child(352)', html).children().each((i, item) => {
            array.push(item.children[0].data)
        });
        console.log(JSON.stringify(array))
    })
    .catch((err) => {
        //handle error
        console.log(err);
    })
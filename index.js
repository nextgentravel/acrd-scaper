var util = require('util')

const rp = require('request-promise');
const cheerio = require('cheerio');
const osmosis = require('osmosis');
const departmentList = 'http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx';

const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

let provinces = {
    "AB": "Alberta",
    "BC": "British Columbia",
    "MB": "Manitoba",
    "NB": "New Brunswick",
    "NL": "Newfoundland and Labrador",
    "NS": "Nova Scotia",
    "NT": "Northwest Territories",
    "NU": "Nunavut",
    "ON": "Ontario",
    "PE": "Prince Edward Island",
    "QC": "Québec",
    "SK": "Saskatchewan",
    "YT": "Yukon"
}

app.get('/', (req, res) => res.send('Unofficial ACRD API'))

app.get('/departments', (req, res) => {
    rp(departmentList)
        .then((html) => {
            const $ = cheerio.load(html)
            let array = []
            $('#wb-main-in > ul:nth-child(352)', html).children().each((i, item) => {
                array.push(item.children[0].data)
            });
            res.send(JSON.stringify(array));
        })
        .catch((err) => {
            //handle error
            res.send({
                "error": err
            });
        })
});

app.get('/province/:provinceCode/cities', (req, res) => {
    let provinceCode = req.params.provinceCode.toUpperCase();
    let province = provinces[provinceCode]

    function getHomePageTrending() {
        return new Promise((resolve, reject) => {
            let response = [];
    
            osmosis
                // Load steemit.com
                .get('http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx')
                // Find all posts in postslist__summaries list
                .find(':contains("Québec") + ul > li')
                // Create an object with title and summary
                .set({
                    'result': '.',
                    // summary: '.PostSummary__body'
                })
                // Push post into an array
                .data(res => {response.push(res)})
                .error(err => reject(err))
                .done(() => {
                    let output = []
                    response.forEach((item) => {
                        let list = item.result.split(', ');
                        let splitCity = list[0].split(': ');
                        list.splice(0,1)
                        let suburb = splitCity.concat(list);
                        suburb.sort();
                        let city = "";
                        // console.log("##### ", splitCity);
                        if (splitCity[1] === "See Ottawa ON") {
                            city = 'Ottawa ON'
                            suburb.splice(1,1)
                        } else {
                            city = splitCity[0]
                        }
                        let result = {
                            city: city,
                            suburb: suburb,
                        }
                        output.push(result)
                    })
                    res.send(JSON.stringify(output));
                    resolve(output)
                });
        });
    }
    
    getHomePageTrending().then(res => {
        console.log(res);
    });




    // console.log(province);

    // function scrapePopulations() {
    //     return new Promise((resolve, reject) => {
    //       let results = [];
    //       osmosis
    //       .get('http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx')
    //       .find(':contains("Québec") + ul')
    //       .set({
    //         set: 'li',
    //       })
    //       .data(item => results.push(item))
    //       .done(() => resolve(results));
    //     });
    //   }
      
    //   scrapePopulations().then(data => console.log(data));


    // osmosis
    //     .get('http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx')
    //     .set([
    //         osmosis
    //         .find(':contains("British Columbia") + ul > li.item')
    //         .set({
    //             state: 'td[3]',
    //             population: 'td[4]'
    //         })
    //     ])
    //     .data(items => console.log(items));

    // let results = [];
    // osmosis
    //     .get('http://rehelv-acrd.tpsgc-pwgsc.gc.ca/acrds/preface-eng.aspx')
    //     .find(`:contains("${province}") + ul`)
    //     .set({
    //         state: 'li'
    //     })
    //     .data(item => {
    //         results.push(item)
    //         console.log(results)
    //     })


    // .data(function (data) {
    //     console.log(data);
    //     let list = data.province.split(', ');
    //     let splitCity = list[0].split(': ');
    //     list.splice(0,1)
    //     let suburb = splitCity.concat(list);
    //     suburb.sort();
    //     let result = {
    //         city: splitCity[0],
    //         suburb: suburb,
    //     }
    //     res.send(JSON.stringify(result));
    // })
    // .error(function (err) {
    //     console.log(err)
    // })
});

app.listen(port, () => console.log(`listening on port ${port}!`))
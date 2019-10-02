var util = require('util')

const rp = require('request-promise');
const cheerio = require('cheerio');
const osmosis = require('osmosis');
const departmentList = 'source';
var cors = require('cors')
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())

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

app.use('/source', express.static('source'))

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

    function getCities() {
        return new Promise((resolve, reject) => {
            let response = [];
            osmosis
                .get('http://localhost:5000/source/acrd.html')
                .find(`:contains("${province}") + ul > li`)
                .set({
                    'result': '.',
                })
                .data(res => {response.push(res)})
                .error(err => reject(err))
                .done(() => {
                    if (response.length === 0) {
                        res.send({'error': 'no data found'});
                    }
                    let output = []
                    response.forEach((item) => {
                        let list = item.result.split(', ');
                        let splitCity = list[0].split(': ');
                        list.splice(0,1)
                        let suburb = splitCity.concat(list);
                        suburb.sort();
                        suburb = suburb.map(e => e.trim());
                        let city = "";
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
                    resolve(output)
                });
        });
    }
    getCities().then(result => {
        res.send(JSON.stringify(result));
    });
});

app.get('/cities', (req, res) => {
    let provinceCodes = Object.keys(provinces);

    function getCities(provinceCode) {
        return new Promise((resolve, reject) => {
            try {
                let response = [];
                let province = provinces[provinceCode];
                    osmosis
                        .get('http://localhost:5000/source/acrd.html')
                        .find(`:contains("${province}") + ul > li`)
                        .set({
                            'result': '.' || "",
                        })
                        .data(result => {
                            response.push(result)
                        })
                        .error(err => resolve(err))
                        .done(() => {
                            console.log(province)
                            if (response.length === 0) {
                                resolve('no results')
                            }
                            let output = []
                            response.forEach((item) => {
                                let list = item.result.split(', ');
                                let splitCity = list[0].split(': ');
                                list.splice(0,1)
                                let suburb = splitCity.concat(list);
                                suburb.sort();
                                suburb = suburb.map(e => e.trim());
                                suburb = suburb.map(e => e + " " + provinceCode)
                                let city = "";
                                if (splitCity[1] === "See Ottawa ON") {
                                    city = 'Ottawa ON'
                                    suburb.splice(1,1)
                                } else {
                                    city = splitCity[0] + " " + provinceCode
                                }
                                let result = {
                                    city: city,
                                    suburb: suburb,
                                }
                                output.push(result)
                            })
                            resolve(output)
                        });
            } catch {
                resolve('no results')
            }
        }).catch((err) => {
            resolve(err)
        });
    }



    function getOtherCities(provinceCode) {
        return new Promise((resolve, reject) => {
            try {
                let response = [];
                let province = provinces[provinceCode];
                    osmosis
                        .get('http://localhost:5000/source/acrd.html')
                        .find(`table > caption:contains("(Canada)") !> table > tbody > tr`)
                        .set({
                            'result': 'td[1]' || "",
                        })
                        .data(result => {
                            console.log(result)
                            response.push(result)
                        })
                        .error(err => resolve(err))
                        .done(() => {
                            resolve(response);
                        });
            } catch {
                resolve([])
            }
        }).catch((err) => {
            resolve([])
        });
    }

    let queries = [];

    provinceCodes.forEach((provinceCode) => {
        queries.push(getCities(provinceCode));
    })

    console.log(queries);

    Promise.all(queries)
        .then(function(values) {
            let citiesList = []
            let suburbCityList = {}

            getOtherCities()
            .then(result => {
                console.log(result)
                result.forEach(city => {
                    citiesList.push(city.result);
                })

                values.forEach((value => {
                    if (Array.isArray(value)) {
                        value.forEach((item) => {
                            item.suburb.forEach((suburb) => {
                                citiesList.push(suburb)
                                suburbCityList[suburb] = item.city
                            })
                        })
                    }
                }))
                let uniqueCityList = [...new Set(citiesList)];
                uniqueCityList.sort()
                res.send(JSON.stringify({
                    citiesList: uniqueCityList,
                    suburbCityList
                }));
            })
            .catch(err => {
                console.log(err)
            })


        })
        .catch(error => { 
            console.error(error.message)
        });
});

app.get('/:city/rules', (req, res) => {
    let cityName = req.params.city.replace('sss','/')
    console.log("City Rules Requested: ", cityName)
    function getRules() {
        return new Promise((resolve, reject) => {
            let response = [];
            osmosis
                .get('http://localhost:5000/source/acrd.html')
                .find(`tr:contains("${cityName}")`)
                .set({
                    '01-04': 'td[2]',
                    '05-08': 'td[3]',
                    '09-12': 'td[4]',
                })
                .error(err => reject(err))
                .then(async (context, data) => {
                    resolve(data);
                })
        });
    }

    getRules()
        .then(result => {
            res.send(JSON.stringify(result));
        })
        .catch(err => {
            res.send(JSON.stringify({ error: 'no results' }));
        });
});

app.listen(port, () => console.log(`listening on port ${port}!`))
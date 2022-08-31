const fs = require('fs');
// const yargs = require('yargs');
const Poverty = require('./poverty.js');
const yup = require('yup');
const express = require('express');
const PORT = 80;

let DEV = {
    TEST_JSON: './test/test.json'
};

function save(poverty = pv, path = DEV.TEST_JSON) {
    let data = poverty.data;
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

let pv = new Poverty(fs.readFileSync(DEV.TEST_JSON, 'utf-8'));

let server = express();

server.get('/', (req, res) => {
    res.send(pv.data);
});

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}.`);
});

console.log('');

save()
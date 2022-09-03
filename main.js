const fs = require('fs');
const yargs = require('yargs');
const Poverty = require('./poverty.js');
const yup = require('yup');
const express = require('express');
const bodyParser = require('body-parser');
const PORT = 80;

let DEV = {
    TEST_JSON: './test/test.json'
};

const argv = yargs.command(['serve <path> [port] [blackbody]', '$0'], 'Start a Poverty server.', () => {
    return yargs.positional('path', {
        desc: 'Path to the Poverty JSON.'
    }).option('port', {
        alias: 'p',
        desc: 'Port for Poverty server to listen to.',
        default: 80
    }).option('blackbody', {
        alias: 'b',
        desc: 'Poverty server receives commands and runs but returns nothing.',
        type: 'boolean',
        default: false
    });
}).help().alias('help', 'h').argv;

function save(poverty = pv, path = DEV.TEST_JSON) {
    let data = poverty.data;
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

function blackbody(res, response, code) {
    let returning = argv.blackbody ? code : response;
    if (typeof returning === 'number') {
        res.sendStatus(returning);
    } else {
        res.send(returning);
    }
}

let pv = new Poverty(fs.readFileSync(DEV.TEST_JSON, 'utf-8'));

let server = express();

// server.use(bodyParser.json());

server.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET', 'POST');
    next();
});

server.get('/', (req, res) => {
    blackbody(res, pv.data, 403);
});

server.post('/transaction/insert', (req, res) => {
    let transaction = req.body;
    let id;
    try {
        id = pv.insertTransaction(transaction);
    } catch (error) {
        return blackbody(res, error, 500);
    }
    return blackbody(res, id, 200);
});

server.listen(PORT, () => {
    console.log(`Listening on localhost:${PORT}.`);
});

save()
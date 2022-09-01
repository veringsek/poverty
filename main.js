const fs = require('fs');
const yargs = require('yargs');
const Poverty = require('./poverty.js');
const yup = require('yup');
const express = require('express');
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
        desc: 'Poverty server receive commands and run but returns nothing.',
        type: 'boolean',
        default: false
    });
}).help().alias('help', 'h').argv;

function save(poverty = pv, path = DEV.TEST_JSON) {
    let data = poverty.data;
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

let pv = new Poverty(fs.readFileSync(DEV.TEST_JSON, 'utf-8'));

let server = express();

server.get('/', (req, res) => {
    if (argv.blackbody) {
        res.sendStatus(403);
    } else {
        res.send(pv.data);
    }
});

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}.`);
});

console.log('');

save()
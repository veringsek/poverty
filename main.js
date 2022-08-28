const fs = require('fs');
const yargs = require('yargs');
const Poverty = require('./poverty.js');
const yup = require('yup');

let DEV = {
    TEST_JSON: './test/test.json'
};

function save(poverty = poverty, path = DEV.TEST_JSON) {
    let data = poverty.data;
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

let pv = new Poverty(fs.readFileSync(DEV.TEST_JSON, 'utf-8'));

console.log(''); // console.log(pv.data);

save(pv, DEV.TEST_JSON);

// const argv = yargs
//     .command('create <path>', 'Create a Poverty JSON.')
//     .command('show', 'Show the content of a Poverty JSON.')
//     .command(['record <path> [item]', 'r <path>'], 'New record.', yargs => {
//         return yargs.positional('path', {
//             desc: 'Path to the Poverty JSON.'
//         }).positional('item', {
//             desc: 'The items in this transaction.',
//             default: ''
//         }).option('id', {
//             desc: 'Specify an ID to modify existing transaction.',
//             default: Poverty.ID_AUTO_ASSIGN
//         }).option('item', {
//             desc: 'The items in this transaction.',
//             default: ''
//         }).option('type', {
//             desc: 'The type of transaction.',
//             default: 'transfer'
//         }).option('price', {
//             alias: 'p',
//             desc: 'The income of this transaction.',
//             type: 'number'
//         }).option('currency', {
//             desc: 'The currency of the price.'
//         }).option('time', {
//             desc: 'The time when the transaction is complete.'
//         }).option('note', {
//             desc: 'Something to note about this transaction.'
//         }).option('source', {
//             alias: 's',
//             desc: 'The ID of the pool where the money comes from.'
//         }).option('target', {
//             alias: 't',
//             desc: 'The ID of the pool where the money goes to.'
//         }).option('tag', {
//             desc: 'Tags to categorize this transaction.'
//         }).option('parent', {
//             desc: 'If this is a sub-transaction, specify its main transaction.'
//         });
//     }).help().alias('help', 'h').argv;

// function record(args) {
//     let poverty = new Poverty(fs.readFileSync(args.path, 'utf-8'));
//     let id = args.id;
//     let item = args.item;
//     let type = args.type;
//     let price = args.price;
//     let currency = args.currency ?? poverty.getCurrency();
//     console.log(currency);
//     // console.log(args);
// }

// let funcs = {
//     create: function (args) {
//         let data = new Poverty().data;
//         console.log(args.path)

//         fs.writeFileSync(args.path, JSON.stringify(data));
//     },
//     show: function (args) {
//         let poverty = new Poverty(fs.readFileSync(args.path, 'utf-8'));
//         console.log(poverty);
//     },
//     record, r: record
// };

// funcs[argv._[0]](argv);
const { v4: uuidV4 } = require('uuid');
const yup = require('yup');

class Poverty {
    constructor(data = null) {
        if (!data) {
            this.data = {
                meta: {
                    // format: "Poverty JSON",
                    // version: Poverty.POVERTY_JSON_VERSION
                    format: Poverty.JSON.FORMAT,
                    VERSION: Poverty.JSON.VERSION
                },
                transactions: [],
                templates: [],
                currencies: [],
                pools: [],
                budgets: []
            };
        } else if (typeof data === 'string') {
            this.data = JSON.parse(data);
        } else {
            this.data = data;
        }
        if (!this.validate()) {
            console.warn(`WTF`)
        }
    }

    static JSON = {
        FORMAT: 'Poverty JSON',
        VERSION: '0.0.1'
    };

    // static POVERTY_JSON_VERSION = '0.0.1';
    static ID_AUTO_ASSIGN = '+';

    static TRANSACTION = {
        TYPE: {
            TRANSFER: 'transfer',
            BALANCE: 'balance'
        }
    };

    static CURRENCY = {
        DEFAULT: '<CURRENCY_DEFAULT>',
        FORMAT: {
            AMERICA: 'America',
            EUROPE: 'Europe',
            SINOSPHERE: 'Sinosphere',
            INDIA: 'India'
        }
    };

    static BUDGET = {
        PERIOD: {
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            ANNUAL: 'annual'
        },
        OVER: {
            RETURN: 'return',
            KEEP: 'keep'
        }
    };

    static TIME = {
        NOW: '<TIME.NOW>'
    };

    static uuid(existings = []) {
        let id;
        do {
            id = uuidV4();
        } while (existings.includes(id));
        return id;
    }

    static findUnique(array, value, key = 'id', returnDefault = null, returnDuplicates = undefined) {
        let predicate = element => element[key] === value;
        let founds = array.filter(predicate);
        if (founds.length < 1) return returnDefault;
        if (founds.length > 1 && returnDuplicates !== undefined) return returnDuplicates;
        return founds[0];
    }

    static inObject(key, object) {
        return Object.keys(object).includes(key);
    }

    static ofObject(value, object) {
        return Object.values(object).includes(value);
    }

    static hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    static ids(array) {
        return array.map(element => element.id);
    }

    timeFrom(time) {
        if (time === Poverty.TIME.NOW) {
            return new Date().getTime();
        }
    }

    validate() {
        // Structure Validation
        let origin = this.data;
        try {
            this.data = this.schema.validateSync(this.data);
        } catch (error) {
            return false;
        }
        // Uniqueness Validation
        let uniques = [
            this.ts, this.cs, this.ps, this.bs, 
            // this.budget.map(budget => budget.accounts.map(account => account.id)).flat()
        ];
        for (let unique of uniques) {
            if (Poverty.hasDuplicates(unique)) return false;
        }
        // Linking Validation
        let linkings = [{
            ids: this.ts, 
            linkers: [
                this.transactions.map(transaction => transaction.source),
                this.transactions.map(transaction => transaction.target),
                this.transactions.map(transaction => transaction.children).flat(),
                this.transactions.map(transaction => transaction.parent)
            ]
        }, {
            ids: this.cs,
            linkers: [
                this.transactions.map(transaction => transaction.currency),
                this.pools.map(pool => pool.currency),
                this.budgets.map(budget => budget.currency)
            ]
        }, {
            ids: this.bs,
            linkers: [
                this.transactions.map(transaction => transaction.budget),
                this.budgets.map(budget => budget.accounts.map(account => account.budget)).flat()
            ]
        }];
        for (let { ids, linkers } of linkings) {
            for (let linker of linkers) {
                if (!linker.every(id => ids.includes(id))) {
                    return false;
                }
            }
        }
        return true;

        // let arrays = [
        //     this.transactions,
        //     this.templates,
        //     this.currencies,
        //     this.pools,
        //     this.budgets
        // ];
        // for (let array of arrays) {
        //     if (Poverty.hasDuplicates(Poverty.ids(array))) return false;
        // }
        // return true;
    }

    schema = yup.object({
        meta: yup.object({
            format: yup.string().required().test({
                name: 'string(Poverty JSON)',
                test: format => format === Poverty.JSON.FORMAT
            }),
            version: yup.string().required().test({
                name: 'string(M.N.P)',
                test: version => version === Poverty.JSON.VERSION
            })
        }),
        transactions: yup.array().of(yup.object({
            id: yup.string().uuid(),
            item: yup.string().ensure(),
            type: yup.string().default(() => Poverty.TRANSACTION.TYPE.TRANSFER),
            price: yup.number().nullable(),
            currency: yup.string().uuid().nullable(),
            time: yup.date(),
            logtime: yup.date(),
            note: yup.string().ensure(),
            source: yup.string().nullable(),
            target: yup.string().nullable(),
            budget: yup.string().nullable(),
            tags: yup.array().of(yup.string()).required().ensure(),
            children: yup.array().of(yup.string().uuid()).required().ensure(),
            parent: yup.string().uuid().nullable()
        })).required(),
        templates: yup.array().required(),
        currencies: yup.array().of(yup.object({
            id: yup.string().uuid(),
            name: yup.string().ensure(),
            note: yup.string().ensure(),
            exchange: yup.array().required().ensure(),
            format: yup.string().nullable(),
            visible: yup.bool().nullable(),
            default: yup.bool().nullable()
        })).required(),
        pools: yup.array().of(yup.object({
            id: yup.string().uuid(),
            name: yup.string(),
            currency: yup.string().uuid(),
            balance: yup.number().default(0),
            total: yup.bool().nullable(),
            note: yup.string().ensure()
        })).required(),
        budgets: yup.array().of(yup.object({
            id: yup.string().uuid(),
            name: yup.string(),
            currency: yup.string().nullable(),
            automation: yup.object({
                period: yup.string().nullable(),
                start: yup.date(),
                end: yup.date().nullable(),
                over: yup.string().nullable()
            }),
            accounts: yup.array().of(yup.object({
                id: yup.string().uuid(),
                name: yup.string().nullable(),
                budget: yup.string().uuid(),
                start: yup.date(),
                end: yup.date(),
                balance: yup.number().default(0),
                visible: yup.bool().nullable()
            })).required().ensure()
        })).required()
    });

    currencyOf(pool) {
        if (pool) {
            return pool.currency.name;
        } else {
            return this.defaultCurrency;
        }
    }

    currencyFrom(currency) {
        if (currency === Poverty.CURRENCY.DEFAULT) return this.defaultCurrency;
        return currency;
    }

    /* Structure */

    get transactions() {
        return this.data.transactions;
    }

    get ts() {
        return this.transactions.map(transaction => transaction.id);
    }

    validateTransaction(transaction) {
        if (!transaction) return false;
        if (!Poverty.findUnique(this.transactions, transaction.id)) return false;
    }

    // createTransaction(item = '', type = Poverty.TRANSACTION.TYPE.TRANSFER, price = null, currency = Poverty.CURRENCY.DEFAULT,
    //     time = Poverty.TIME.NOW, note = '', source = null, target = null, budget = null, tags = []) {
    //     let transaction = {
    //         id: Poverty.autoId(this.transactions),
    //         item, type, price, note, tags,
    //         currency: this.currencyFrom(currency),
    //         time: this.timeFrom(time),
    //         logtime: this.timeFrom(Poverty.TIME.NOW),
    //         source: this.pool(source)?.id,
    //         target: this.pool(target)?.id,
    //         budget: this.budget(budget)?.id,
    //     };
    //     this.transactions.push(transaction);
    // }

    get templates() {
        return this.data.templates;
    }

    get currencies() {
        return this.data.currencies;
    }

    get cs() {
        return this.currencies.map(currency => currency.id);
    }

    get defaultCurrency() {
        return Poverty.findUnique(this.currencies, true, 'default').id;
    }

    validateCurrency(currency) {
        if (!currency) return false;
        if (!Poverty.findUnique(this.currencies, currency.id)) return false;
        if (currency.default && currency.id !== this.defaultCurrency) return false;
    }

    // createCurrency(name, note = '', format = Poverty.CURRENCY.FORMAT.AMERICA, visible = true, def = false) {
    //     let currency = {
    //         id: Poverty.autoId(Poverty.ids(this.currencies)),
    //         name, note, format, visible, default: def
    //     };
    //     this.currencies.push(currency);
    // }

    get pools() {
        return this.data.pools;
    }

    get ps() {
        return this.pools.map(pool => pool.id);
    }

    pool(poolId) {
        return Poverty.findUnique(this.pools, poolId);
    }

    validatePool(pool) {
        if (!pool) return false;
        if (!Poverty.findUnique(this.pools, pool.id)) return false;
    }

    // createPool(name, currency = Poverty.CURRENCY.DEFAULT, total = true, note = '') {
    //     let pool = {
    //         id: Poverty.autoId(Poverty.ids(this.pools)),
    //         name, total, balance: 0, note,
    //         currency: this.currencyFrom(currency)
    //     };
    //     this.pools.push(pool);
    //     return pool;
    // }

    get budgets() {
        return this.data.budgets;
    }

    get bs() {
        return this.budgets.map(budget => budget.id);
    }

    budget(budgetId) {
        return Poverty.findUnique(this.budgets, budgetId);
    }

    validateBudget(budget) {
        if (!budget) return false;
        if (!Poverty.findUnique(this.budgets, budget.id)) return false;
        if (Poverty.hasDuplicates(budget.accounts.map(account => account.id))) return false;
    }

    validateAccount(account) {
        if (!account) return false;
        if (!Poverty.findUnique(account.budget.accounts, account.id)) return false;
    }

    // createBudget(name, currency = Poverty.CURRENCY.DEFAULT, period = Poverty.BUDGET.PERIOD.MONTHLY, 
    //     start = Poverty.TIME.NOW, end = null, over = Poverty.BUDGET.OVER.RETURN) {
    //     let budget = {
    //         id: Poverty.autoId(Poverty.ids(this.budgets)),
    //         name,
    //         currency: this.currencyFrom(currency),
    //         automation: {
    //             period, end, over,
    //             start: this.timeFrom(start)
    //         }
    //     };
    //     this.budgets.push(budget);
    //     return budget;
    // }
}
module.exports = Poverty;
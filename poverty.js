const { v4: uuidV4 } = require('uuid');
const yup = require('yup');

class Poverty {
    constructor(data = null) {
        if (!data) {
            this.data = {
                meta: {
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
        this.schemas = {};
        this.schemas.transaction = yup.object({
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
        });
        this.schemas.currency = yup.object({
            id: yup.string().uuid(),
            name: yup.string().ensure(),
            note: yup.string().ensure(),
            exchange: yup.array().required().ensure(),
            format: yup.string().nullable(),
            visible: yup.bool().nullable(),
            default: yup.bool().nullable()
        });
        this.schemas.pool = yup.object({
            id: yup.string().uuid(),
            name: yup.string(),
            currency: yup.string().uuid(),
            balance: yup.number().default(0),
            total: yup.bool().nullable(),
            note: yup.string().ensure()
        });
        this.schemas.account = yup.object({
            id: yup.string().uuid(),
            name: yup.string().nullable(),
            budget: yup.string().uuid(),
            start: yup.date(),
            end: yup.date(),
            balance: yup.number().default(0),
            visible: yup.bool().nullable()
        });
        this.schemas.budget = yup.object({
            id: yup.string().uuid(),
            name: yup.string(),
            currency: yup.string().nullable(),
            automation: yup.object({
                period: yup.string().nullable(),
                start: yup.date(),
                end: yup.date().nullable(),
                over: yup.string().nullable()
            }),
            accounts: yup.array().of(this.schemas.account).required().ensure()
        });
        this.schemas.root = yup.object({
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
            transactions: yup.array().of(this.schemas.transaction).required(),
            templates: yup.array().required(),
            currencies: yup.array().of(this.schemas.currency).required(),
            pools: yup.array().of(this.schemas.pool).required(),
            budgets: yup.array().of(this.schemas.budget).required()
        });
        if (!this.validate()) {
            console.warn(`WTF`)
        }
    }

    static JSON = {
        FORMAT: 'Poverty JSON',
        VERSION: '0.0.1'
    };

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

    static Error = {
        Invalid: {
            Currency: () => new TypeError(`Invalid Currency.`),
            Pool: () => new TypeError(`Invalid Pool.`),
            Budget: () => new TypeError(`Invalid Budget.`),
            Account: () => new TypeError(`Invalid Account.`)
        },
        NotExist: {
            Currency: id => new ReferenceError(`Currency of ID ${id} not exists.`),
            Pool: id => new ReferenceError(`Pool of ID ${id} not exists.`),
            Budget: id => new ReferenceError(`Budget of ID ${id} not exists.`),
            Account: id => new ReferenceError(`Account of ID ${id} not exists.`)
        },
        InUse: {
            Currency: id => new ReferenceError(`Currency of ID ${id} is in use.`),
            Pool: id => new ReferenceError(`Pool of ID ${id} is in use.`),
            Budget: id => new ReferenceError(`Budget of ID ${id} is in use.`),
            Account: id => new ReferenceError(`Account of ID ${id} is in use.`)
        }
    };

    static uuid(existings = []) {
        let id;
        do {
            id = uuidV4();
        } while (existings.includes(id));
        return id;
    }

    static findUnique(array, value, key = 'id', returnDefault = null, returnDuplicates) {
        let predicate = element => element[key] === value;
        let founds = array.filter(predicate);
        if (founds.length < 1) return returnDefault;
        if (founds.length > 1 && returnDuplicates !== undefined) return returnDuplicates;
        return founds[0];
    }

    static setDefaults(object, defaults) {
        for (let key in defaults) {
            if (!(key in object)) {
                try {
                    object[key] = defaults[key]();
                } catch (error) {
                    if (error instanceof TypeError) {
                        object[key] = defaults[key];
                    }
                }
            }
        }
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
        try {
            this.data = this.schemas.root.validateSync(this.data);
        } catch (error) {
            return false;
        }
        // Uniqueness Validation
        let uniques = [
            this.ts, this.cs, this.ps, this.bs,
            // this.budget.map(budget => budget.accounts.map(account => account.id)).flat()
        ];
        for (let unique of uniques) {
            if ((new Set(unique)).size !== unique.length) return false;
        }
        // Linking Validation
        let linkings = [{
            ids: this.ts, linkers: [
                this.transactions.map(transaction => transaction.source),
                this.transactions.map(transaction => transaction.target),
                this.transactions.map(transaction => transaction.children).flat(),
                this.transactions.map(transaction => transaction.parent)
            ]
        }, {
            ids: this.cs, linkers: [
                this.transactions.map(transaction => transaction.currency),
                this.pools.map(pool => pool.currency),
                this.budgets.map(budget => budget.currency)
            ]
        }, {
            ids: this.bs, linkers: [
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
    }

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

    currency(currencyId) {
        return Poverty.findUnique(this.currencies, currencyId);
    }

    validateCurrency(currency) {
        if (!currency) return false;
        currency = this.schemas.currency.validateSync(currency);
        return currency;
    }

    insertCurrency(currency) {
        Poverty.setDefaults(currency, {
            id: () => Poverty.uuid(this.cs)
        });
        currency = this.validateCurrency(currency);
        if (!currency) return false;
        if (this.cs.includes(currency.id)) return false;
        this.currencies.push(currency);
    }

    updateCurrency(currency) {
        currency = this.validateCurrency(currency);
        if (!currency) return false;
        let existing = this.currency(currency.id);
        if (!existing) return false;
        for (let key in currency) {
            existing[key] = currency[key];
        }
    }

    deleteCurrency(currencyId) {
        let currency = this.currency(currencyId);
        if (!currency) throw Poverty.Error.NotExist.Currency(currencyId);
        let linkers = [this.transactions, this.templates, this.pools, this.budgets];
        for (let linker of linkers) {
            if (linker.some(link => link.currency === currencyId)) {
                throw Poverty.Error.InUse.Currency(currencyId);
            }
        }
        let c = this.currencies.indexOf(currency);
        return this.currencies.splice(c, 1);
    }

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

    insertPool(pool) {
        Poverty.setDefaults(pool, {
            id: () => Poverty.uuid(this.ps),
            currency: () => this.defaultCurrency,
            balance: 0
        });
        pool = this.validatePool(pool);
        if (!pool) return false;
        if (this.ps.includes(pool.id)) return false;
        this.pools.push(pool);
    }

    updatePool(pool) {
        pool = this.validatePool(pool);
        if (!pool) return false;
        let existing = this.pool(pool.id);
        if (!existing) return false;
        for (let key in pool) {
            existing[key] = pool[key];
        }
    }

    deletePool(poolId) {
        let pool = this.pool(poolId);
        if (!pool) throw Poverty.Error.NotExist.Pool(poolId);
        let linkers = [this.transactions, this.templates, this.budgets];
        for (let linker of linkers) {
            if (linker.some(link => link.pool === poolId)) {
                throw Poverty.Error.InUse.Pool(poolId);
            }
        }
        let p = this.pools.indexOf(pool);
        return this.pools.splice(p, 1);
    }

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

    insertBudget(budget) {
        Poverty.setDefaults(budget, {
            id: () => Poverty.uuid(this.bs),
            currency: () => this.defaultCurrency,
            automation: () => ({
                start: Poverty.timeFrom(Poverty.TIME.NOW)
            }),
            accounts: []
        });
        budget = this.validateBudget(budget);
        if (!budget) return false;
        if (this.bs.includes(budget.id)) return false;
        this.budgets.push(budget);
    }

    updateBudget(budget) {
        budget = this.validateBudget(budget);
        if (!budget) return false;
        let existing = this.budget(budget.id);
        if (!existing) return false;
        for (let key in budget) {
            existing[key] = budget[key];
        }
    }

    deleteBudget(budgetId) {
        let budget = this.budget(budgetId);
        if (!budget) throw Poverty.Error.NotExist.Pool(budgetId);
        for (let account of budget.accounts) {
            if (this.transactions.some(transaction => transaction.budget === account.id)) {
                throw Poverty.Error.InUse.Account(account.id);
            }
        }
        let b = this.budgets.indexOf(budget);
        return this.budgets.splice(b, 1);
    }

    validateAccount(account) {
        if (!account) return false;
        if (!Poverty.findUnique(account.budget.accounts, account.id)) return false;
    }

    // Dev

    u(id = 0) {
        return `00000000-0000-0000-0000-${id.toString().padStart(12, '0')}`
    }
}
module.exports = Poverty;
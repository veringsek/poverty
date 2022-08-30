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
            name: yup.string().ensure(),
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
            id: yup.string(),
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
        Poverty: {
            HasDuplicates: ids => new ReferenceError(`There are some duplicates in ID sets: ${ids}`)
        },
        Transaction: {
            Invalid: () => new TypeError(`Invalid Transaction.`),
            NotExist: id => new ReferenceError(`Transaction of ID ${id} not exists.`),
            InUse: id => new ReferenceError(`Transaction of ID ${id} is in use as a parent.`),
            Duplicate: id => new ReferenceError(`ID of ${id} in Transactions is duplicated.`),
            Duplicates: () => new ReferenceError(`Some IDs in Transactions are duplicated.`),
            ParentOfSelf: id => new ReferenceError(`The parent of a transaction cannot be itself: ${id}`)
        },
        Currency: {
            Invalid: () => new TypeError(`Invalid Currency.`),
            NotExist: id => new ReferenceError(`Currency of ID ${id} not exists.`),
            InUse: id => new ReferenceError(`Currency of ID ${id} is in use.`),
            Duplicate: id => new ReferenceError(`ID of ${id} in Currencies is duplicated.`),
            Duplicates: () => new ReferenceError(`Some IDs in Currencies are duplicated.`)
        },
        Pool: {
            Invalid: () => new TypeError(`Invalid Pool.`),
            NotExist: id => new ReferenceError(`Pool of ID ${id} not exists.`),
            InUse: id => new ReferenceError(`Pool of ID ${id} is in use.`),
            Duplicate: id => new ReferenceError(`ID of ${id} in Pools is duplicated.`),
            Duplicates: () => new ReferenceError(`Some IDs in Pools are duplicated.`)
        },
        Budget: {
            Invalid: () => new TypeError(`Invalid Budget.`),
            NotExist: id => new ReferenceError(`Budget of ID ${id} not exists.`),
            InUse: id => new ReferenceError(`Budget of ID ${id} is in use.`),
            Duplicate: id => new ReferenceError(`ID of ${id} in Budgets is duplicated.`),
            Duplicates: () => new ReferenceError(`Some IDs in Budgets are duplicated.`)
        },
        Account: {
            Invalid: () => new TypeError(`Invalid Account.`),
            NotExist: id => new ReferenceError(`Account of ID ${id} not exists.`),
            InUse: id => new ReferenceError(`Account of ID ${id} is in use.`),
            Duplicate: id => new ReferenceError(`ID of ${id} in Accounts is duplicated.`),
            Duplicates: () => new ReferenceError(`Some IDs in Accounts are duplicated.`)
        },
    };

    static uuid(existings = []) {
        let id;
        do {
            id = uuidV4();
        } while (existings.includes(id));
        return id;
    }

    static hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
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
            throw error;
        }
        // Uniqueness Validation
        let uniques = [{
            error: Poverty.Error.Transaction.Duplicates, unique: this.ts
        }, {
            error: Poverty.Error.Currency.Duplicates, unique: this.cs
        }, {
            error: Poverty.Error.Pool.Duplicates, unique: this.ps
        }, {
            error: Poverty.Error.Budget.Duplicates, unique: this.bs
        }, {
            error: Poverty.Error.Account.Duplicates,
            unique: this.budgets.map(budget => budget.accounts).flat().map(account => account.id)
        }];
        for (let { error, unique } of uniques) {
            if (Poverty.hasDuplicates(unique)) throw error();
        }
        // Linking Validation
        let linkings = [{
            error: Poverty.Error.Transaction.NotExist, ids: this.ts, linkers: [
                this.transactions.map(transaction => transaction.source),
                this.transactions.map(transaction => transaction.target),
                this.transactions.map(transaction => transaction.children).flat(),
                this.transactions.map(transaction => transaction.parent)
            ]
        }, {
            error: Poverty.Error.Currency.NotExist, ids: this.cs, linkers: [
                this.transactions.map(transaction => transaction.currency),
                this.pools.map(pool => pool.currency),
                this.budgets.map(budget => budget.currency)
            ]
        }, {
            error: Poverty.Error.Budget.NotExist, ids: this.bs, linkers: [
                this.transactions.map(transaction => transaction.budget),
                this.budgets.map(budget => budget.accounts.map(account => account.budget)).flat()
            ]
        }];
        for (let { error, ids, linkers } of linkings) {
            for (let linker of linkers) {
                for (let id of linker) {
                    if (!ids.includes(id)) {
                        throw error(id);
                    }
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

    transaction(transactionId) {
        return Poverty.findUnique(this.transactions, transactionId);
    }

    validateTransaction(transaction) {
        if (!transaction) throw Poverty.Error.Transaction.Invalid();
        if (!Poverty.findUnique(this.transactions, transaction.id)) {
            throw Poverty.Error.Transaction.Duplicate(transaction.id);
        }
        for (let child of transaction.children) {
            if (!this.ts.includes(child)) {
                throw Poverty.Error.Transaction.NotExist(child);
            }
        }
        if (transaction.parent) {
            if (!this.ts.includes(transaction.parent)) {
                throw Poverty.Error.Transaction.NotExist(transaction.parent);
            } else if (transaction.parent === transaction.id) {
                throw Poverty.Error.Transaction.ParentOfSelf(transaction.parent);
            }
        }
    }

    insertTransaction(transaction) {
        Poverty.setDefaults(transaction, {
            id: () => Poverty.uuid(this.ts),
            name: '',
            type: Poverty.TRANSACTION.TYPE.TRANSFER,
            currency: () => this.defaultCurrency,
            time: () => Poverty.timeFrom(Poverty.TIME.NOW),
            logtime: () => Poverty.timeFrom(Poverty.TIME.NOW),
            children: []
        });
        transaction = this.validateTransaction(transaction);
        if (!transaction) throw Poverty.Error.Transaction.Invalid();
        if (this.ts.includes(transaction.id)) {
            throw Poverty.Error.Transaction.Duplicate(transaction.id);
        }
        this.transactions.push(transaction);
    }

    updateTransaction(transaction) {
        transaction = this.validateTransaction(transaction);
        if (!transaction) throw Poverty.Error.Transaction.Invalid();
        let existing = this.transaction(transaction.id);
        if (!existing) throw Poverty.Error.Transaction.NotExist(transaction.id);
        for (let key in transaction) {
            existing[key] = transaction[key];
        }
    }

    deleteTransaction(transactionId) {
        let transaction = this.transaction(transactionId);
        if (!transaction) throw Poverty.Error.Transaction.NotExist(transaction.id);
        if (this.transactions.some(transaction => transaction.parent === transaction.id)) {
            throw Poverty.Error.Transaction.InUse(transaction.id);
        }
        for (let link of this.transactions) {
            link.children = link.children.filter(child => child !== transaction.id);
        }
        let t = this.transactions.indexOf(transaction);
        return this.transactions.splice(t, 1);
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
        if (!currency) throw Poverty.Error.Currency.Invalid();
        currency = this.schemas.currency.validateSync(currency);
        return currency;
    }

    insertCurrency(currency) {
        Poverty.setDefaults(currency, {
            id: () => Poverty.uuid(this.cs)
        });
        currency = this.validateCurrency(currency);
        if (!currency) throw Poverty.Error.Currency.Invalid();
        if (this.cs.includes(currency.id)) {
            throw Poverty.Error.Currency.Duplicate(currency.id);
        }
        this.currencies.push(currency);
    }

    updateCurrency(currency) {
        currency = this.validateCurrency(currency);
        if (!currency) throw Poverty.Error.Currency.Invalid();
        let existing = this.currency(currency.id);
        if (!existing) throw Poverty.Error.Currency.NotExist();
        for (let key in currency) {
            existing[key] = currency[key];
        }
    }

    deleteCurrency(currencyId) {
        let currency = this.currency(currencyId);
        if (!currency) throw Poverty.Error.Currency.NotExist(currencyId);
        let linkers = [this.transactions, this.templates, this.pools, this.budgets];
        for (let linker of linkers) {
            if (linker.some(link => link.currency === currencyId)) {
                throw Poverty.Error.Currency.InUse(currencyId);
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
        if (!pool) throw Poverty.Error.Pool.Invalid();
        if (!Poverty.findUnique(this.pools, pool.id)) {
            throw Poverty.Error.Pool.Duplicate(pool.id);
        }
    }

    insertPool(pool) {
        Poverty.setDefaults(pool, {
            id: () => Poverty.uuid(this.ps),
            currency: () => this.defaultCurrency,
            balance: 0
        });
        pool = this.validatePool(pool);
        if (!pool) throw Poverty.Error.Pool.Invalid();
        if (this.ps.includes(pool.id)) {
            throw Poverty.Error.Pool.Duplicate(pool.id);
        }
        this.pools.push(pool);
    }

    updatePool(pool) {
        pool = this.validatePool(pool);
        if (!pool) throw Poverty.Error.Pool.Invalid();
        let existing = this.pool(pool.id);
        if (!existing) throw Poverty.Error.Pool.NotExist();
        for (let key in pool) {
            existing[key] = pool[key];
        }
    }

    deletePool(poolId) {
        let pool = this.pool(poolId);
        if (!pool) throw Poverty.Error.Pool.NotExist(poolId);
        let linkers = [this.transactions, this.templates, this.budgets];
        for (let linker of linkers) {
            if (linker.some(link => link.pool === poolId)) {
                throw Poverty.Error.Pool.InUse(poolId);
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
        if (!budget) throw Poverty.Error.Budget.Invalid();
        if (!Poverty.findUnique(this.budgets, budget.id)) {
            throw Poverty.Error.Budget.Duplicate(budget.id);
        }
        if (Poverty.hasDuplicates(budget.accounts.map(account => account.id))) {
            throw Poverty.Error.Account.Duplicates();
        }
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
        if (!budget) throw Poverty.Error.Budget.Invalid();
        if (this.bs.includes(budget.id)) {
            throw Poverty.Error.Budget.Duplicate(budget.id);
        }
        this.budgets.push(budget);
    }

    updateBudget(budget) {
        budget = this.validateBudget(budget);
        if (!budget) throw Poverty.Error.Budget.Invalid();
        let existing = this.budget(budget.id);
        if (!existing) throw Poverty.Error.Budget.NotExist();
        for (let key in budget) {
            existing[key] = budget[key];
        }
    }

    deleteBudget(budgetId) {
        let budget = this.budget(budgetId);
        if (!budget) throw Poverty.Error.Pool.NotExist(budgetId);
        for (let account of budget.accounts) {
            if (this.transactions.some(transaction => transaction.budget === account.id)) {
                throw Poverty.Error.Account.InUse(account.id);
            }
        }
        let b = this.budgets.indexOf(budget);
        return this.budgets.splice(b, 1);
    }

    validateAccount(account) {
        if (!account) throw Poverty.Error.Account.Invalid();
        if (!Poverty.findUnique(account.budget.accounts, account.id)) {
            throw Poverty.Error.Account.Duplicate(account.id);
        }
    }

    // Dev

    u(id = 0) {
        return `67d2c9ca-1111-468a-b8f7-${id.toString().padStart(12, '0')}`
    }
}
module.exports = Poverty;
const { v4: UUID } = require('uuid');

class Poverty {
    constructor(data = null) {
        if (!data) {
            this.data = {
                meta: {
                    format: "Poverty JSON",
                    version: Poverty.POVERTY_JSON_VERSION
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

    static POVERTY_JSON_VERSION = '0.0.1';
    static ID_AUTO_ASSIGN = '+';
    static CURRENCY = {
        DEFAULT: '<CURRENCY_DEFAULT', 
        DEFAULT_FORMAT: 'America'
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

    static autoId(existings = [], length = Poverty.ID_AUTO_LENGTH) {
        let id;
        do {
            id = UUID();
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

    static hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    static ids(array) {
        return array.map(element => element.id);
    }

    timeAs(time) {
        if (time === Poverty.TIME.NOW) {
            return new Date().getTime();
        }
    }

    validate() {
        let arrays = [
            this.transactions,
            this.templates,
            this.currencies,
            this.pools,
            this.budgets
        ];
        for (let array of arrays) {
            if (Poverty.hasDuplicates(Poverty.ids(array))) return false;
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

    currencyAs(currency) {
        if (currency === Poverty.CURRENCY.DEFAULT) return this.defaultCurrency;
        return currency;
    }

    /* Structure */

    get transactions() {
        return this.data.transactions;
    }

    get templates() {
        return this.data.templates;
    }

    get currencies() {
        return this.data.currencies;
    }

    get defaultCurrency() {
        return Poverty.findUnique(this.currencies, true, 'default');
    }

    createCurrency(name, note = '', format = Poverty.CURRENCY.DEFAULT_FORMAT, visible = true, def = false) {
        let currency = {
            id: Poverty.autoId(Poverty.ids(this.currencies)),
            name, note, format, visible, default: def
        };
        this.currencies.push(currency);
    }

    get pools() {
        return this.data.pools;
    }

    pool(poolId) {
        return Poverty.findUnique(this.pools, poolId);
    }

    createPool(name, currency = Poverty.CURRENCY.DEFAULT, total = true, note = '') {
        let pool = {
            id: Poverty.autoId(Poverty.ids(this.pools)),
            name, total, balance: 0, note,
            currency: this.currencyAs(currency)
        };
        this.pools.push(pool);
        return pool;
    }

    get budgets() {
        return this.data.budgets;
    }

    budget(budgetId) {
        return Poverty.findUnique(this.budgets, budgetId);
    }

    createBudget(name, currency = Poverty.CURRENCY.DEFAULT, period = Poverty.BUDGET.PERIOD.MONTHLY, 
        start = Poverty.TIME.NOW, end = null, over = Poverty.BUDGET.OVER.RETURN) {
        let budget = {
            id: Poverty.autoId(Poverty.ids(this.budgets)),
            name,
            currency: this.currencyAs(currency),
            automation: {
                period, end, over,
                start: this.timeAs(start)
            }
        };
        this.budgets.push(budget);
        return budget;
    }
}
module.exports = Poverty;
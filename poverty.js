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
    static CURRENCY_DEFAULT = '<CURRENCY_DEFAULT>';

    static autoId(existings = [], length = Poverty.ID_AUTO_LENGTH) {
        let id;
        do {
            id = UUID();
        } while (existings.includes(id));
        return id;
    }

    static findUnique(array, key, value, returnDefault = null, returnDuplicates = undefined) {
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
        return Poverty.findUnique(this.currencies, 'default', true);
    }

    get pools() {
        return this.data.pools;
    }

    pool(poolId) {
        let matches = this.data.pools.filter(pool => pool.id === poolId);
        if (matches.length === 1) {
            return matches[0];
        } else {
            return null;
        }
    }

    createPool(name, currency = Poverty.CURRENCY_DEFAULT, total = true, note = '') {
        let pool = {
            id: Poverty.autoId(this.pools.map(pool => pool.id)),
            name, total, balance: 0, note,
            currency: currency === Poverty.CURRENCY_DEFAULT ? this.defaultCurrency : currency
        };
        this.pools.push(pool);
        return pool;
    }

    get budgets() {
        return this.data.budgets;
    }

    budget(id) {

    }
}
module.exports = Poverty;
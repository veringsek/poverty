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

    static hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    static ids(array) {
        return array.map(element => element.id);
    }

    validate() {
        let arrays = [
            this.data.transactions,
            this.data.templates,
            this.data.currencies,
            this.data.pools,
            this.data.budgets
        ];
        for (let array of arrays) {
            if (Poverty.hasDuplicates(Poverty.ids(array))) return false;
        }
        return true;
    }

    getCurrency(pool) {
        if (pool) {
            return pool.currency.name;
        } else {
            let matches = this.data.currencies.filter(currency => currency.default);
            if (matches.length === 1) {
                return matches[0].name;
            } else {
                return null;
            }
        }
    }

    get defaultCurrency() {
        let defaults = this.data.currencies.filter(currency => currency.default);
        if (defaults.length < 1) {
            return null;
        }
        if (defaults.length > 1) {
            console.warn(`More than one default currency.`);
        }
        return defaults[0];
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
            id: Poverty.autoId(this.data.pools.map(pool => pool.id)),
            name, total, balance: 0, note,
            currency: currency === Poverty.CURRENCY_DEFAULT ? this.defaultCurrency() : currency
        };
        this.data.pool.push(pool);
        return pool;
    }
}
module.exports = Poverty;
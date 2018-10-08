const _         = require('lodash');
const Stock     = require('../stock/index.js');
const Service   = require('./service.js');

const get = (name) => {
  return Service.get(name)
    .then((portfolio) => {
      return Service.getStocksBy(portfolio)
        .then((stocks) => {
          return {
            portfolio,
            stocks
          };
        })
    })
};

module.exports = {
  get,
}

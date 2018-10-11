const _         = require('lodash');
const Stock     = require('../stock/index.js');
const Service   = require('./service.js');

const assignWeightsBy = (portfolio, getMeasure = 'value') => {
  const total = _.sumBy(portfolio, getMeasure);

  return _
    .chain(portfolio)
    .map((stock) => {
      stock.weight = _.get(stock, getMeasure) / total;
      return stock;
    })
    .value();
};

const get = (name, getWeightMeasure) => {
  return Service.get(name)
    .then(portfolio => assignWeightsBy(portfolio, getWeightMeasure))
    .then((portfolio) => {
      return Service.getStocksBy(portfolio)
        .then((stocks) => {
          return _.map(portfolio, (stock) => {
            stock.data = _.find(stocks, { symbol: stock.ticker });
            return stock;
          });
        })
    })
};

module.exports = {
  get,
}

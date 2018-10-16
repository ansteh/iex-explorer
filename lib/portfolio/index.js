const _         = require('lodash');
const Stock     = require('../stock/index.js');
const Service   = require('./service.js');

const assignWeightsBy = (portfolio, getMeasure = 'amount') => {
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
    // .then(portfolio => _.filter(portfolio, stock => stock.ticker !== 'LUK' && _.includes(['AAPL', 'AFSI'], stock.ticker)))
    .then(portfolio => _.filter(portfolio, stock => stock.ticker && stock.ticker !== 'LUK'))
    .then(portfolio => assignWeightsBy(portfolio, getWeightMeasure))
};

module.exports = {
  get,
}

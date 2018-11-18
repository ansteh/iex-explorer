const _         = require('lodash');
const Stock     = require('../stock/index.js');
const Service   = require('./service.js');

const get = (name, getWeightMeasure) => {
  return Service.get(name)
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

const getLastClosePrice = (stock) => {
  const close = _.get(_.last(_.get(stock, 'data.historicals')), 'close');
  const amount = _.get(stock, 'amount');

  // console.log('close', close);
  // console.log('amount', amount);
  // console.log('close * amount', close * amount);

  return close * amount;
};

const assignWeightsBy = (portfolio, getMeasure = getLastClosePrice) => {
  const total = _.sumBy(portfolio, getMeasure);
  // console.log('total', total);

  return _
    .chain(portfolio)
    .map((stock) => {
      const value = _.isFunction(getMeasure) ? getMeasure(stock) : _.get(stock, getMeasure);
      stock.weight = value / total;

      return stock;
    })
    .value();
};

module.exports = {
  get,
}

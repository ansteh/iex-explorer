const _         = require('lodash');
const Decimal   = require('decimal.js');

const Stock     = require('../stock/index.js');
const Service   = require('./service.js');

const get = (name, getWeightMeasure) => {
  return Service.get(name)
    .then(portfolio => prepare(portfolio, getWeightMeasure))
};

const prepare = (portfolio, getWeightMeasure) => {
  return Service.getStocksBy(portfolio)
    .then((stocks) => {
      return _.map(portfolio, (stock) => {
        stock.data = _.find(stocks, { symbol: stock.ticker });
        return stock;
      });
    })
    // .then(portfolio => _.filter(portfolio, stock => stock.ticker !== 'LUK' && _.includes(['AAPL', 'AFSI'], stock.ticker)))
    .then(portfolio => _.filter(portfolio, stock => stock.ticker && stock.ticker !== 'LUK'))
    .then(portfolio => assignWeightsBy(portfolio, getWeightMeasure))
}

const getLastClosePrice = (stock) => {
  const close = _.get(_.last(_.get(stock, 'data.historicals')), 'close') || 0;
  const amount = _.get(stock, 'amount') || 0;

  // console.log('close', close);
  // console.log('amount', amount);
  // console.log('close * amount', close * amount);

  return Decimal.mul(close, amount).toNumber();
};

const assignWeightsBy = (portfolio, getMeasure = getLastClosePrice) => {
  const total = (portfolio || [])
    .reduce((sum, stock) => {
      return sum.add(getMeasure(stock));
    }, Decimal(0))
    .toNumber();

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
  prepare,
}

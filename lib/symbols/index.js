const _         = require('lodash');
const Promise   = require('bluebird');

const Service   = require('./service.js');
const Filters   = require('./filters.js');

const Stock     = require('../stock');

const Types = {
  ad: 'ADR',
  re: 'REIT',
  ce: 'Closed end fund',
  si: 'Secondary Issue',
  lp: 'Limited Partnerships',
  cs: 'Common Stock',
  et: 'ETF',
};

//[ 'cs', 'N/A', 'et', 'ps', 'bo', 'su', 'crypto' ]

const TypeKeys = _.keys(Types);

const query = (options) => {
  return Service.getAll()
    .then(symbols => options ? Filters.query(symbols, options) : symbols)
};

const getStats = (symbols) => {
  return {
    items: symbols,
    count: _.get(symbols, 'length'),
  };
};

const getStocks = (options) => {
  return query(options)
    .then(getAllStocks);
};

const getAllStocks = (symbols) => {
  const types = ['financials.annual', 'stats'];
  const symbol = _.head(symbols);

  if(symbol) {
    return Stock.request(symbol.symbol, types)
      .then(() => {
        console.log(`${_.tail(symbols).length} stocks left.`);
        return getAllStocks(_.tail(symbols));
      })
  }

  return Promise.resolve();
};

const requestStocksWithoutHistoricals = () => {
  return Service.getStocksByFilesWithoutHistoricals()
    .then(_.shuffle)
    .then(requestStocks)
};

const requestStocks = (tickers) => {
  return (tickers ? Promise.resolve(tickers) : Service.getCachedsByFiles())
    .then((tickers) => {
      const ticker = _.first(tickers);

      if(ticker) {
        return Stock.request(ticker)
          .then(() => { return requestStocks(_.tail(tickers)); })
      }
    })
};

module.exports = {
  getAll: Service.getAll,
  getStats,
  getStocks,
  query,

  requestStocksWithoutHistoricals,
};

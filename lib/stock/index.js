const _         = require('lodash');

const Service     = require('./service.js');
const Historicals = require('./historicals');

const get = (ticker) => {
  return Service.get(ticker)
    .then((stock) => {
      return Historicals.Service.getCached(ticker)
        .then((historicals) => {
          stock.historicals = historicals;
          return stock;
        });
    })
};

const TYPES = [
  'dividends',
  'earnings',
  'financials.annual',
  'financials.quarter',
  'stats',
  'historicals',
];

const request = (ticker, types = TYPES) => {
  return Service.get(ticker)
    .then(() => { if(_.includes(types, 'dividends')) return Service.getDividends(ticker); })
    .then(() => { if(_.includes(types, 'earnings')) return Service.getRecentEarnings(ticker); })
    .then(() => { if(_.includes(types, 'financials.annual')) return Service.getFinancials(ticker, 'annual'); })
    .then(() => { if(_.includes(types, 'financials.quarter')) return Service.getFinancials(ticker, 'quarter'); })
    .then(() => { if(_.includes(types, 'stats')) return Service.getKeyStats(ticker); })
    .then(() => { if(_.includes(types, 'historicals')) return Historicals.getTimeseries(ticker); })
};

module.exports = {
  get,
  request,
}

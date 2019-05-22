const _         = require('lodash');

const Service   = require('./service.js');
const Requests  = require('./requests.js');
const Symbols   = require('../../symbols/index.js');

const ticker = 'GM';

// Requests.getTimeseries({ symbol: 'AAPL' })
// Service.getTimeseries(ticker)
//   // .then(series => series.length)
//   // .then(_.first)
//   .then(series => _.takeRight(series, 10))
//   .then(console.log)
//   .catch(console.log)

// console.log('range', getRange({ from: '2006-01-01'}))

// Service.updateTimeseries(ticker)
//   // .then(series => series.length)
//   // .then(_.first)
//   // .then(series => _.takeRight(series, 5))
//   .then(console.log)
//   .catch(console.log)

const updateAll = () => {
  const options = {
    type: 'cs',
    isEnabled: true,
  };

  // return Symbols.getAll()
  return Symbols.query(options)
    .then(symbols => _.filter(_.map(symbols, 'symbol'), _.isString))
    .then(updateAllBy)
};

const updateAllBy = (tickers = []) => {
  const ticker = _.first(tickers);

  if(_.isUndefined(ticker)) {
    return Promise.resolve();
  }

  return Service.updateTimeseries(ticker)
    .then(() => { return updateAllBy(_.tail(tickers)); })
};

updateAll()
  .then(console.log)
  .catch(console.log);

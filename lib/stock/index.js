const Service     = require('./service.js');
const Historicals = require('./historicals');

const get = (ticker) => {
  return Service.get(ticker)
    .then((stock) => {
      return Historicals.getTimeseries(ticker)
        .then((historicals) => {
          stock.historicals = historicals;
          return stock;
        });
    })
};

const request = (ticker) => {
  return Service.get(ticker)
    .then(() => { return Service.getDividends(ticker); })
    .then(() => { return Service.getRecentEarnings(ticker); })
    .then(() => { return Service.getFinancials(ticker, 'annual'); })
    .then(() => { return Service.getFinancials(ticker, 'quarter'); })
    .then(() => { return Service.getKeyStats(ticker); })
    .then(() => { return Historicals.getTimeseries(ticker); })
};

module.exports = {
  get,
  request,
}

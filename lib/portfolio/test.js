const _         = require('lodash');
const Service   = require('./service.js');
const Portfolio = require('./index.js');

// Service.save('test')
//   .then(console.log)
//   .catch(console.log);

// Service.importPortfolio('test')
//   .then(console.log)
//   .catch(console.log);

// Service.get('test')
//   .then(console.log)
//   .catch(console.log);

// Service.requestStocks('test')
//   .then(console.log)
//   .catch(console.log);

Portfolio.get('test')
  .then(({ stocks }) => {
    return _
      .chain(stocks)
      .map((stock) => {
        return {
          sharesOutstanding: _.get(stock, 'stats.sharesOutstanding'),
          latestEPS: _.get(stock, 'stats.latestEPS'),
          latestQuote: _.last(stock.historicals),
        };
      })
      .reduce((accu, stats) => {
        accu.sharesOutstanding += stats.sharesOutstanding;
        accu.latestEPS += stats.latestEPS;
        accu.close += stats.latestQuote.close;
        return accu;
      }, { sharesOutstanding: 0, latestEPS: 0, close: 0 })
      .value();
  })
  .then((stats) => {
    return _.assign({}, stats, { pe: stats.close / stats.latestEPS });
  })
  .then(console.log)
  .catch(console.log);

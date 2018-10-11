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

const aggregatePricePerEarnings = (portfolio) => {
  const stats = _
    .chain(portfolio)
    .filter(stock => stock.data)
    .map((stock) => {
      return {
        sharesOutstanding: _.get(stock, 'data.stats.sharesOutstanding'),
        latestEPS: _.get(stock, 'data.stats.latestEPS'),
        latestQuote: _.last(_.get(stock, 'data.historicals')),
      };
    })
    .reduce((accu, stats) => {
      accu.sharesOutstanding += stats.sharesOutstanding;
      accu.latestEPS += stats.latestEPS;
      accu.close += stats.latestQuote.close;

      return accu;
    }, { sharesOutstanding: 0, latestEPS: 0, close: 0 })
    .value();

  return _.assign({}, stats, { pe: stats.close / stats.latestEPS });
};

// Portfolio.get('test')
//   .then((portfolio) => {
//     return aggregatePricePerEarnings(portfolio);
//   })
//   .then(console.log)
//   .catch(console.log);

const weightAveragePricePerEarnings = (stocks) => {
  const f = _.sumBy(stocks, ({ weight, price, earnings }) => {
    return weight * ((price - earnings)/price);
  });

  return 1/(1-f);
};

const aggregatePricePerEarningsByWeightedAverage = (portfolio) => {
  const data = _
    .chain(portfolio)
    .filter(stock => stock.data)
    .map((stock) => {
      return {
        weight: stock.weight,
        earnings: _.get(stock, 'data.stats.latestEPS'),
        price: _.get(_.last(stock.data.historicals), 'close'),
      };
    })
    .value();

  return weightAveragePricePerEarnings(data);
};

// const testdata = [
//   { weight: 0.4, price: 153.61, earnings: 8.52 },
//   { weight: 0.4, price: 69.96, earnings: 2.27 },
//   { weight: 0.2, price: 18.23, earnings: -0.62 },
// ];
//
// console.log('weightAveragePricePerEarnings', weightAveragePricePerEarnings(testdata)); // = 35.25

Portfolio.get('test')
  .then((portfolio) => {
    return aggregatePricePerEarningsByWeightedAverage(portfolio);
  })
  .then(console.log)
  .catch(console.log);

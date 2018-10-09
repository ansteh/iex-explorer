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

const aggregatePricePerEarnings = (stocks) => {
  const stats = _
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

  return _.assign({}, stats, { pe: stats.close / stats.latestEPS });
};

// Portfolio.get('test')
//   .then(({ stocks }) => {
//     return aggregatePricePerEarnings(stocks);
//   })
//   .then(console.log)
//   .catch(console.log);

const getWeights = (portfolio) => {
  const total = _.sumBy(portfolio, 'value');

  return _
    .chain(portfolio)
    .map((stock) => {
      stock.weight = stock.value / total;
      return stock;
    })
    .value();
};

const weightAveragePricePerEarnings = (stocks) => {
  const f = _.sumBy(stocks, ({ weight, price, earnings }) => {
    return weight * ((price - earnings)/price);
  });

  return 1/(1-f);
};

const aggregatePricePerEarningsByWeightedAverage = ({ portfolio, stocks }) => {
  getWeights(portfolio);

  const data = _.map(stocks, (stock) => {
    const weight = _.find(portfolio, { ticker: stock.symbol }).weight;

    return {
      weight,
      earnings: _.get(stock, 'stats.latestEPS'),
      price: _.get(_.last(stock.historicals), 'close'),
    };
  });

  return weightAveragePricePerEarnings(data);
};

// const testdata = [
//   { weight: 0.4, price: 153.61, earnings: 8.52 },
//   { weight: 0.4, price: 69.96, earnings: 2.27 },
//   { weight: 0.2, price: 18.23, earnings: -0.62 },
// ];
//
// console.log('weightAveragePricePerEarnings', weightAveragePricePerEarnings(testdata)); // = 35.25

// Portfolio.get('test')
//   .then(({ portfolio, stocks }) => {
//     return getWeights(portfolio);
//   })
//   // .then((stocks) => {
//   //   return _.sumBy(stocks, 'weight');
//   // })
//   .then(console.log)
//   .catch(console.log);

Portfolio.get('test')
  .then(({ portfolio, stocks }) => {
    return aggregatePricePerEarningsByWeightedAverage({ portfolio, stocks });
  })
  .then(console.log)
  .catch(console.log);

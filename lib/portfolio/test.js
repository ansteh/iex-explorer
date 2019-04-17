const _         = require('lodash');
const Service   = require('./service.js');
const Portfolio = require('./index.js');
const Decimal   = require('decimal.js');

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

// Portfolio.get('test')
//   .then((portfolio) => {
//     return aggregatePricePerEarningsByWeightedAverage(portfolio);
//   })
//   .then(console.log)
//   .catch(console.log);


const createStats = _.curry((options, portfolio) => {
  const composition = _
    .chain(portfolio)
    .map(stock => _.pick(stock, ['ticker', 'weight']))
    .sortBy('weight')
    .reverse()
    .value();

  const content = _.reduce(options, (accu, { property }) => {
    // accu[property] = 0;
    _.set(accu, property, 0);
    return accu;
  }, {});

  const stats = _.reduce(portfolio, (stats, stock) => {
    _.forEach(options, ({ property, aggreagte }) => {
      // console.log(property, stats[property], aggreagte(stock));
      // stats[property] += aggreagte(stock)
      const currentValue = _.get(stats, property); //stats[property]
      _.set(stats, property, (new Decimal(currentValue)).add(aggreagte(stock)).toNumber());
    });

    return stats;
  }, content);

  const price = _.get(stats, 'share.price');
  const earnings = _.get(stats, 'share.ttmEPS');
  if(price && earnings != 0) {
    _.set(stats, 'share.PE', price/earnings);
  }

  return {
    stats,
    composition,
  }
});

const getDividendRate = (stock) => {
  // console.log(stock.ticker, _.get(stock, 'data.stats.dividendRate') || 0, stock.weight * (_.get(stock, 'data.stats.dividendRate') || 0));
  return stock.weight * (_.get(stock, 'data.stats.dividendRate') || 0);
};

const getDividendYield = (stock) => {
  // const dividendRate = _.get(stock, 'data.stats.dividendRate') || 0;
  // const dividendYield = _.get(stock, 'data.stats.dividendYield') || 0;
  // const historicals = _.get(stock, 'data.historicals');
  // const close = _.get(_.last(historicals), 'close') || 0;
  // console.log(stock.ticker, dividendRate, close, dividendYield, dividendRate/close*100);

  // console.log(stock.weight, _.get(stock, 'data.stats.dividendYield') || 0);
  // return stock.weight * (_.get(stock, 'data.stats.dividendYield') || 0);
  return (new Decimal(stock.weight)).mul(_.get(stock, 'data.stats.dividendYield') || 0).toNumber();
};

const getPrice = (stock) => {
  const historicals = _.get(stock, 'data.historicals');
  return stock.weight * (_.get(_.last(historicals), 'close') || 0);
};

const getPerShareOutstanding = _.curry((path, stock) => {
  const value = _.includes(path, 'financials') ? getFinancialValue(path, stock) : _.get(stock, path) || 0;
  const sharesOutstanding = _.get(stock, 'data.stats.sharesOutstanding') || 0;

  // if(stock.ticker === 'AAPL') {
  //   console.log(path, (value / sharesOutstanding));
  // }

  return sharesOutstanding === 0 ? 0 : stock.weight * (value / sharesOutstanding);
});

const getFinancialValue = (path, stock) => {
  return _
    .chain(_.get(stock, 'data.financials.annual'))
    .last()
    .get(_.replace(path, 'financials.', ''))
    .value() || 0;
};

const getWeightedValue = _.curry((path, stock) => {
  return stock.weight * (_.get(stock, path) || 0);
});

const getTotalDividendRate = (stock) => {
  const dividendRate = _.get(stock, 'data.stats.dividendRate') || 0;
  return stock.amount * dividendRate;
};

const getTotalDividendRateByYield = (stock) => {
  const historicals = _.get(stock, 'data.historicals');
  const close = _.get(_.last(historicals), 'close') || 0;
  const dividendYield =  _.get(stock, 'data.stats.dividendYield') || 0;
  return stock.amount * close * dividendYield/100;
};

const createOverview = createStats([
  // test price by total value
  { property: 'amount', aggreagte: stock => stock.amount || 0 },
  { property: 'value', aggreagte: stock => stock.amount * (_.get(_.last(_.get(stock, 'data.historicals')), 'close') || 0) },
  // { property: 'totalDividendRate', aggreagte: getTotalDividendRate },
  // { property: 'totalDividendRateByYield', aggreagte: getTotalDividendRateByYield },

  { property: 'share.price', aggreagte: getPrice },
  { property: 'share.ttmEPS', aggreagte: getWeightedValue('data.stats.ttmEPS') },

  { property: 'share.dividendRate', aggreagte: getDividendRate },
  { property: 'share.dividendYield', aggreagte: getDividendYield },

  { property: 'share.totalRevenue', aggreagte: getPerShareOutstanding('financials.totalRevenue') },
  { property: 'share.grossProfit', aggreagte: getPerShareOutstanding('financials.grossProfit') },
  { property: 'share.netIncome', aggreagte: getPerShareOutstanding('financials.netIncome') },

  { property: 'share.currentCash', aggreagte: getPerShareOutstanding('financials.currentCash') },
  { property: 'share.currentDebt', aggreagte: getPerShareOutstanding('financials.currentDebt') },

  { property: 'share.totalAssets', aggreagte: getPerShareOutstanding('financials.totalAssets') },
  { property: 'share.totalLiabilities', aggreagte: getPerShareOutstanding('financials.totalLiabilities') },
  { property: 'share.shareholderEquity', aggreagte: getPerShareOutstanding('financials.shareholderEquity') },

  { property: 'share.totalCash', aggreagte: getPerShareOutstanding('financials.totalCash') },
  { property: 'share.totalDebt', aggreagte: getPerShareOutstanding('financials.totalDebt') },


  // { property: 'share.cash', aggreagte: getPerShareOutstanding('data.stats.cash') },
  // { property: 'share.debt', aggreagte: getPerShareOutstanding('data.stats.debt') },

  // { property: 'share.grossProfit', aggreagte: getPerShareOutstanding('data.stats.grossProfit') },
  // { property: 'share.revenue', aggreagte: getPerShareOutstanding('data.stats.revenue') },
]);

const assignShareRatios = (overview = {}) => {
  const properties = _.filter(_.keys(overview.share), key => key != 'price');
  const price = _.get(overview, `share.price`, 0);

  if(price > 0) {
    _.forEach(properties, (key) => {
      const value = _.get(overview, `share.${key}`, 0);
      _.set(overview, `shareRatios.${key}`, value/price);
    });
  }

  return overview;
};

const comparePortfolios = (names) => {
  const portfolios = _.map(names, name => Portfolio.get(name).then(createOverview))
  return Promise.all(portfolios)
    .then((portfolios) => {
      return _
        .chain(portfolios)
        .map('stats')
        .forEach((stats, index) => {
          stats.name = names[index];
        })
        .value();
    });
};

const getFrequentStocksFrom = (names, count) => {
  const portfolios = _.map(names, name => Portfolio.get(name).then(createOverview));

  return Promise.all(portfolios)
    .then((portfolios) => {
      return _
        .chain(portfolios)
        .map('composition')
        .flatten()
        .groupBy('ticker')
        .map((matches, ticker) => {
          if(matches.length === (count || names.length)) {
            return ticker;
          }
        })
        .filter(x => x)
        .value();
    })
    .then((tickers) => {
      return _.map(tickers, (ticker) => {
        return { ticker, amount: 1 };
      });
    })
    .then(Portfolio.prepare)
    .then(createOverview)
};

// Portfolio.get('test')
//   .then(stocks => _.map(stocks, stock => _.pick(stock, ['ticker', 'weight', 'value'])))
//   .then(stocks => _.sortBy(stocks, 'weight'))
//   .then(_.reverse)
//   // .then(stocks => _.sumBy(stocks, 'weight'))
//   .then(console.log)
//   .catch(console.log);

// Service.importJsonExport('icahn')
//   .then(console.log)
//   .catch(console.log);

// Portfolio.get('test')
//   .then(createOverview)
//   // .then(assignShareRatios)
//   .then(console.log)
//   .catch(console.log);

const importPortfolio = (name) => {
  return Service.importJsonExport(name)
    .then(() => Portfolio.get(name))
    .then(createOverview)
    .then(console.log)
    .catch(console.log);
};

// importPortfolio('buffet');

comparePortfolios(['buffet', 'dalio', 'greenblatt', 'icahn', 'seth', 'andre'])
  .then(console.log)
  .catch(console.log);

// getFrequentStocksFrom(['dalio', 'greenblatt', 'icahn', 'seth'], 3)
//   .then(console.log)
//   .catch(console.log);

const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');

const Metrics = require('./metrics.js');
const { PREFIX } = require('../shared/globals.js');

const basePath = `${__dirname}/../../resources/stocks`;

const get = (ticker) => {
  return getCached(ticker)
    .catch((err) => {
      if(_.get(err, 'code') === 'ENOENT') {
        return request(ticker)
          .then(stock => save(ticker, stock))
      }

      throw err;
    })
};

const getCached = (ticker) => {
  return fs.readJson(getFilepathStock(ticker));
};

const getFilepathStock = (ticker) => {
  return `${basePath}/${ticker}/stock.json`
};

const request = (ticker) => {
  console.log(`Request company for ${ticker}`);
  return got(`${PREFIX}/stock/${ticker}/company`, { json: true })
    .then(response => response.body);
};

const save = (ticker, stock) => {
  return ensureDirectories(ticker)
    .then(() => { return fs.writeJson(getFilepathStock(ticker), stock); })
    .then(() => { return stock; });
};

const update = (ticker, content) => {
  return get(ticker)
    .then(stock => save(ticker, _.merge(stock, content)))
};

const ensureDirectories = (ticker) => {
  const dirpath = `${basePath}/${ticker}`;

  return fs.pathExists(dirpath)
    .then((exists) => {
      if(exists === false) {
        return fs.ensureDir(dirpath)
      }
    });
};

const getDividends = (ticker) => {
  return get(ticker)
    .then((stock) => {
      const dividends = _.get(stock, 'dividends');

      if(dividends) {
        return dividends;
      }

      return requestDividends(ticker);
    })
};

const requestDividends = (ticker) => {
  console.log(`Request dividends for ${ticker}`);

  return got(`${PREFIX}/stock/${ticker}/dividends/5y`, { json: true })
    .then(response => response.body)
    .then(dividends => _.reverse(dividends))
    .then(dividends => update(ticker, { dividends }))
    .then(stock => _.get(stock, 'dividends'))
};

const getRecentEarnings = (ticker, period = 'quarter') => {
  return get(ticker)
    .then((stock) => {
      const earnings = _.get(stock, `earnings.${period}`);

      if(earnings) {
        return earnings;
      }

      return requestRecentEarnings(ticker, period);
    })
};

const requestRecentEarnings = (ticker, period = 'quarter') => {
  console.log(`Request earnings for ${ticker} and period ${period}`);

  return got(`${PREFIX}/stock/${ticker}/earnings`, { json: true })
    .then(response => response.body)
    .then(data => _.get(data, 'earnings'))
    .then(earnings => _.reverse(earnings))
    .then((earnings) => {
      const content = {};
      _.set(content, `earnings.${period}`, earnings);

      return update(ticker, content);
    })
    .then(stock => _.get(stock, `earnings.${period}`))
};

const getFinancials = (ticker, period = 'annual') => {
  return get(ticker)
    .then((stock) => {
      const financials = _.get(stock, `financials.${period}`);

      if(financials) {
        return financials;
      }

      if(_.has(stock, `financials.${period}`)) {
        return;
      }

      return requestFinancials(ticker, period);
    })
};

const requestFinancials = (ticker, period = 'annual') => {
  console.log(`Request financials for ${ticker} and period ${period}`);

  return got(`${PREFIX}/stock/${ticker}/financials?period=${period}`, { json: true })
    .then(response => response.body)
    .then(data => _.get(data, 'financials'))
    .then(financials => _.reverse(financials))
    .then((financials) => {
      const content = {};
      _.set(content, `financials.${period}`, financials);

      return update(ticker, content);
    })
    .then(stock => _.get(stock, `financials.${period}`))
};

const getKeyStats = (ticker) => {
  console.log(`Request stats for ${ticker}.`);

  return get(ticker)
    .then((stock) => {
      const keyStats = _.get(stock, `stats`);

      if(keyStats) {
        return keyStats;
      }

      return requestKeyStats(ticker);
    })
};

const requestKeyStats = (ticker) => {
  console.log(`Request stats for ${ticker}`);

  return got(`${PREFIX}/stock/${ticker}/stats`, { json: true })
    .then(response => response.body)
    .then((stats) => {
      const content = {};
      _.set(content, `stats`, stats);

      return update(ticker, content);
    })
    .then(stock => _.get(stock, `stats`))
};

const getMetrics = (ticker) => {
  return get(ticker)
    .then((stock) => {
      console.log(`Get metrics for ${ticker}`);

      const metrics = _.get(stock, `metrics`);

      if(metrics) {
        return metrics;
      }

      return update(ticker, Metrics.getAnnualFinancialStatistics(stock));
    })
};

const updateMetrics = (ticker) => {
  return get(ticker)
    .then((stock) => {
      console.log(`Update metrics for ${ticker}`);
      return update(ticker, Metrics.getAnnualFinancialStatistics(stock));
    })
};

module.exports = {
  get,
  getCached,
  getDividends,
  getFinancials,
  getKeyStats,
  getMetrics,
  getRecentEarnings,
  request,

  updateMetrics,
};

const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');

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

      return requestFinancials(ticker, period);
    })
};

const requestFinancials = (ticker, period = 'annual') => {
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

module.exports = {
  get,
  getCached,
  getDividends,
  getFinancials,
  getRecentEarnings,
  request,
};

const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');
const moment    = require('moment');

const Requests = require('./requests.js');

const { PREFIX } = require('../../shared/globals.js');

const basePath = `${__dirname}/../../../resources/stocks`;

const getTimeseries = (ticker) => {
  return getCached(ticker)
    .catch((err) => {
      if(_.get(err, 'code') === 'ENOENT') {
        return Requests.getTimeseries({ symbol: ticker })
          .then(historicals => save(ticker, historicals))
      }

      throw err;
    })
};

const getCached = (ticker) => {
  return fs.readJson(getFilepath(ticker));
};

const getFilepath = (ticker) => {
  return `${basePath}/${ticker}/historicals.json`;
};

const save = (ticker, historicals) => {
  return ensureDirectories(ticker)
    .then(() => { return fs.writeJson(getFilepath(ticker), historicals); })
    .then(() => { return historicals; });
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

const exists = (ticker) => {
  return getCached(ticker)
    .then(() => { return true; })
    .catch(() => { return false; })
};

const updateTimeseries = (ticker) => {
  return getTimeseries(ticker)
    .then((historicals) => {
      const date = _.get(_.last(historicals), 'date');

      if(date) {
        const from = moment(date).add(1, 'days').toDate();
        // console.log(from, moment().utc().startOf('day').toDate());

        if(from >= moment().utc().startOf('day').toDate()) {
          return `No update required for ${ticker}. Last update: ${moment(date).format('YYYY-MM-DD')}`;
        }

        return Requests.getTimeseries({ symbol: ticker, from })
          .then(quotes => [...historicals, ...quotes])
          .then(historicals => save(ticker, historicals))
      } else {
        // empty historicals, so request all quotes
        return Requests.getTimeseries({ symbol: ticker })
          .then(historicals => save(ticker, historicals))
      }
    })
};

module.exports = {
  exists,
  getCached,

  getTimeseries,
  updateTimeseries,
};

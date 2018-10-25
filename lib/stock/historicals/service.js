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

module.exports = {
  getTimeseries,
  getCached,
};

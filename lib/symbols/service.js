const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');

const Historicals = require('../stock/historicals/service.js');
const Stock       = require('../stock/service.js');

const { PREFIX } = require('../shared/globals.js');

const basePath = `${__dirname}/../../resources/symbols`;
const filepath = `${basePath}/all.json`;

const getAll = () => {
  return getCached()
    .catch((err) => {
      if(_.get(err, 'code') === 'ENOENT') {
        return requestAll()
          .then(save)
      }

      throw err;
    })
};

const getCached = () => {
  return fs.readJson(filepath);
};

const requestAll = () => {
  return got(`${PREFIX}/ref-data/symbols`, { json: true })
    .then(response => response.body);
};

const save = (symbols) => {
  return ensureDirectories()
    .then(() => { return fs.writeJson(filepath, symbols); })
    .then(() => { return symbols; });
};

const ensureDirectories = () => {
  return fs.pathExists(basePath)
    .then((exists) => {
      if(exists === false) {
        return fs.ensureDir(basePath)
      }
    });
};

const getSymbolsByFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(`${__dirname}/../../resources/stocks`, (err, files) => {
      if(err) {
        reject(err);
      } else {
        resolve(files);
      }
    })
  });
};

const getAllByFiles = () => {
  return getSymbolsByFiles()
    .then(symbols => Promise.all(symbols.map(Stock.get)))
};

const getMetricsByFiles = () => {
  return getSymbolsByFiles()
    // .then(symbols => [_.first(symbols)])
    .then(symbols => Promise.all(symbols.map(Stock.getMetrics)))
};

const updateMetricsByFiles = () => {
  return getSymbolsByFiles()
    // .then(symbols => [_.first(symbols)])
    .then(symbols => Promise.all(symbols.map(Stock.updateMetrics)))
};

const getCachedsByFiles = (limit) => {
  return getSymbolsByFiles()
    // .then(symbols => [_.first(symbols)])
    .then(symbols => limit ? _.take(symbols, limit) : symbols)
    .then(symbols => Promise.all(symbols.map(Stock.getCached)))
};

const getStocksByFilesWithoutHistoricals = (limit) => {
  return getSymbolsByFiles()
    .then(symbols => limit ? _.take(symbols, limit) : symbols)
    .then(symbols => Promise.all(symbols.map((ticker) => {
      return Historicals.exists(ticker)
        .then(exists => exists === false ? ticker : null)
    })))
    .then(symbols => symbols.filter(ticker => ticker))
};

module.exports = {
  getAll,
  getAllByFiles,
  getCached,
  getMetricsByFiles,
  getCachedsByFiles,
  getSymbolsByFiles,
  getStocksByFilesWithoutHistoricals,
  requestAll,

  updateMetricsByFiles,
};

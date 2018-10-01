const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');

const { PREFIX } = require('../shared/globals.js');;

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
  get,
  getCached,
  request,
};

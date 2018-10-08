const fs        = require('fs-extra');
const _         = require('lodash');
const Degiro    = require('degiro-importer');
const Promise   = require('bluebird');

const Stock     = require('../stock/index.js');

const basePath = `${__dirname}/../../resources/portfolios`;

const get = (name) => {
  return fs.readJson(getFilepath(name));
};

const getStocksBy = (portfolio) => {
  const stocks = _
    .chain(portfolio)
    .filter(stock => stock.ticker && stock.active !== false)
    .map('ticker')
    .map(Stock.get)
    .value();

  return Promise.all(stocks);
};

const requestStocks = (name) => {
  return get(name)
    .then(portfolio => _.filter(portfolio, stock => stock.ticker))
    .then(requestStocksWithDelay)
};

const requestStocksWithDelay = (stocks, delay = 500) => {
  const stock = _.head(stocks);

  if(stock) {
    console.log(`Request stock with ticker: ${stock.ticker}`);
    return Stock.request(stock.ticker)
      .then(() => { return Promise.delay(500); })
      .then(() => { return requestStocksWithDelay(_.tail(stocks)); })
  }
};

const getFilepath = (name) => {
  return `${basePath}/${name}/portfolio.json`;
};

const save = (name, portfolio) => {
  return ensureDirectories(name)
    .then(() => {
      if(portfolio) {
        return fs.writeJson(getFilepath(name), portfolio)
        .then(() => { return portfolio; });
      }
    })
};

const ensureDirectories = (name) => {
  const dirpath = `${basePath}/${name}`;

  return fs.pathExists(dirpath)
    .then((exists) => {
      if(exists === false) {
        return fs.ensureDir(dirpath)
      }
    });
};

const getCsvFilepath = (name) => {
  return `${basePath}/${name}/portfolio.csv`;
};

const importPortfolio = (name) => {
  const filepath = getCsvFilepath(name);

  return Degiro.getPortfolio(filepath)
    .then((portfolio) => {
      return getMappings()
        .then((mappings) => {
          return _.map(portfolio, (stock) => {
            stock.ticker = mappings[stock.ISIN];
            return stock;
          });
        })
        .then(portfolio => save(name, portfolio))
    });
};

const getMappings = () => {
  return fs.readJson(`${__dirname}/../../resources/degiro/isin-symbol-mappings.json`);
};

module.exports = {
  get,
  getStocksBy,
  importPortfolio,
  save,
  requestStocks,
};

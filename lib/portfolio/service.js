const fs        = require('fs-extra');
const _         = require('lodash');
const Degiro    = require('degiro-importer');

const basePath = `${__dirname}/../../resources/portfolios`;

const get = (name) => {
  return fs.readJson(getFilepath(name));
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
  importPortfolio,
  save,
};

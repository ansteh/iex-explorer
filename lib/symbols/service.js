const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');

const PREFIX = 'https://api.iextrading.com/1.0';

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

module.exports = {
  getAll,
  getCached,
  requestAll,
};

const fs        = require('fs-extra');
const _         = require('lodash');

const basePath = `${__dirname}/../../resources/portfolios`;

const save = (name) => {
  return ensureDirectories(name);
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

const importDegiroPortfolio = (name) => {

};

module.exports = {
  save,
};

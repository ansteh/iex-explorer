const fs        = require('fs-extra');

const CLOUD_KEYS = `${__dirname}/../../../resources/keys/cloud.json`;

let promisedToken;

const getToken = () => {
  promisedToken = promisedToken || fs.readJson(CLOUD_KEYS)
    .then(config => config.token);

  return promisedToken;
};

module.exports = {
  getToken,
};

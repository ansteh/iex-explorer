const VERSION = 'v1';

const CLOUD = {
  PROD: `https://cloud.iexapis.com/${VERSION}`,
  TEST: `https://sandbox.iexapis.com/${VERSION}`,
};

module.exports = {
  CLOUD,
  PREFIX: 'https://api.iextrading.com/1.0',
  VERSION,
};

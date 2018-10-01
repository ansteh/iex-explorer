const _         = require('lodash');

const Service   = require('./service.js');
const Filters   = require('./filters.js');

const Types = {
  ad: 'ADR',
  re: 'REIT',
  ce: 'Closed end fund',
  si: 'Secondary Issue',
  lp: 'Limited Partnerships',
  cs: 'Common Stock',
  et: 'ETF',
};

//[ 'cs', 'N/A', 'et', 'ps', 'bo', 'su', 'crypto' ]

const TypeKeys = _.keys(Types);

const query = (options) => {
  return Service.getAll()
    .then(symbols => options ? Filters.query(symbols, options) : symbols)
};

const getStats = (symbols) => {
  return {
    items: symbols,
    count: _.get(symbols, 'length'),
  };
};

module.exports = {
  getAll: Service.getAll,
  getStats,
  query,
};

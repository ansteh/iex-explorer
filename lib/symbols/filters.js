const _         = require('lodash');

//[ 'cs', 'N/A', 'et', 'ps', 'bo', 'su', 'crypto' ]

const query = (symbols, options) => {
  const match = _.pick(options, ['isEnabled']);

  let results = _.filter(symbols, match);

  if(_.has(options, 'type')) {
    const types = _.isArray(options.type) ? options.type : [options.type];

    results = _.filter(results, ({ type }) => {
      return _.includes(types, type);
    });
  }

  return results;
};

const extractUniqTypes = (symbols) => {
  return _
    .chain(symbols)
    .map('type')
    .uniq()
    .value();
};

module.exports = {
  query,
  extractUniqTypes,
};

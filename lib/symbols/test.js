const _ = require('lodash');

const Symbols = require('./index.js');
const Service = require('./service.js');
const Filters = require('./filters.js');
const Stock   = require('../stock');

// Symbols.getAll()
//   .then(console.log)
//   .catch(console.log);

// Symbols.getAll()
//   .then(Filters.extractUniqTypes)
//   .then(console.log)
//   .catch(console.log);

const options = {
  type: 'cs', //'et', //[ 'cs', 'N/A', 'et', 'ps', 'bo', 'su', 'crypto' ]
  isEnabled: true,
};

// Symbols.query(options)
//   .then(Symbols.getStats)
//   .then(console.log)
//   .catch(console.log);

// Symbols.getStocks(options)
//   .then(console.log)
//   .catch(console.log);

// Service.getAllByFiles()
//   .then(console.log)
//   .catch(console.log);

// Service.getMetricsByFiles()
//   // .then(content => JSON.stringify(content, null, 2))
//   .then(console.log)
//   .catch(console.log);

Service.getCachedsByFiles()
  .then((stocks) => {
    // return _.filter(stocks, Stock.Filters.filterSoundFundamentals);
    return _.filter(stocks, Stock.Filters.filterTotalRevenue);
  })
  .then(stocks => _.map(stocks, 'symbol'))
  // .then(content => JSON.stringify(content, null, 2))
  .then(console.log)
  .catch(console.log);

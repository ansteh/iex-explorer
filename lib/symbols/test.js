const Symbols = require('./index.js');
const Service = require('./service.js');
const Filters   = require('./filters.js');

// Symbols.getAll()
//   .then(console.log)
//   .catch(console.log);

// const options = {
//   type: 'et', //[ 'cs', 'N/A', 'et', 'ps', 'bo', 'su', 'crypto' ]
//   isEnabled: true,
// };
//
// Symbols.query(options)
//   .then(Symbols.getStats)
//   .then(console.log)
//   .catch(console.log);

Symbols.getAll()
  .then(Filters.extractUniqTypes)
  .then(console.log)
  .catch(console.log);

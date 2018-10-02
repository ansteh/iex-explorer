const _         = require('lodash');

const Service   = require('./service.js');
const Requests  = require('./requests.js');

// Requests.getTimeseries({ symbol: 'AAPL' })
Service.getTimeseries('AAPL')
  // .then(series => series.length)
  // .then(_.first)
  // .then(console.log)
  .catch(console.log)

// console.log('range', getRange({ from: '2006-01-01'}))

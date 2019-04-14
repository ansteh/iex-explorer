const Service = require('./service.js');
const Stock   = require('./index.js');

// Service.get('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getDividends('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getRecentEarnings('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getFinancials('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getKeyStats('AAPL')
//   .then(console.log)
//   .catch(console.log)

// const types = [
//   'dividends',
//   // 'earnings',
//   'financials.annual',
//   'financials.quarter',
//   'stats',
//   // 'historicals',
// ];

// Stock.request('AAPL', types)
//   .then(console.log)
//   .catch(console.log)

// Service.getMetrics('AAPL')
//   .then(content => JSON.stringify(content, null, 2))
//   .then(console.log)
//   .catch(console.log)

Service.get('AIT')
  .then(content => JSON.stringify(content, null, 2))
  .then(console.log)
  .catch(console.log)

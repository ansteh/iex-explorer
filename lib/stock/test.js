const Service = require('./service.js');

// Service.get('AAPL')
//   .then(console.log)
//   .catch(console.log)

// Service.getDividends('AAPL')
//   .then(console.log)
//   .catch(console.log)

Service.getRecentEarnings('AAPL')
  .then(console.log)
  .catch(console.log)

// Service.getFinancials('AAPL')
//   .then(console.log)
//   .catch(console.log)

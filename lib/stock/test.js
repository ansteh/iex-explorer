const Service = require('./service.js');

Service.get('AAPL')
  .then(console.log)
  .catch(console.log)

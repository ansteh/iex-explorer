const Service = require('./service.js');

Service.save('test')
  .then(console.log)
  .catch(console.log);

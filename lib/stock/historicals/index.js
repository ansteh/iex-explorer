const Service  = require('./service.js');
const Requests = require('./requests.js');

module.exports = {
  Service,
  Requests,

  getTimeseries: Service.getTimeseries,
};

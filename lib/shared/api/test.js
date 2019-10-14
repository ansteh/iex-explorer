const { getToken } = require('./index');

let count = 10;

do {
  getToken()
    .then(console.log)
    .catch(console.log)

  count -= 1;
} while(count > 0);

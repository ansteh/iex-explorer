const trade = (position, quote, amount) => {
  if(_.isNumber(amount) && _.isNaN(amount) == false && amount !== 0) {
    position.commitment = amount * quote.close;
    position.invested += commitment;
    position.amount += amount;

    if(amount > 0) {

    }

    if(amount < 0) {

    }
  }

  position.net = position.amount * quote.close;

  return position;
};

module.exports = {
  trade,
};

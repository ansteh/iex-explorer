const _ = require('lodash');
const moment = require('moment');

const spread = (series, path) => {
  const max = _.maxBy(series, path);

  if(max) {
    const index = _.findLastIndex(series, max);
    const items = _.slice(series, 0, index);

    const min = _.minBy(items, path);

    return { min, max };
  }
};

const getGrowthRate = (multiplier, start, end) => {
  if(start && end) {
    const pastDays = moment(end).diff(moment(start), 'days');
    return _.round(Math.pow(multiplier, 365/pastDays) - 1, 2);
  }
};

const getSpreadBy = (quotes) => {
  return spread(quotes, 'close');
};

const getTotalSpreadBy = (quotes) => {
  const start = _.first(quotes);
  const end = _.last(quotes);

  if(start) {
    const past = _.get(start, 'close');
    const present = _.get(end, 'close');

    const startDate = moment(_.get(start, 'date'));
    const endDate = moment(_.get(end, 'date'));
    const days = endDate.diff(startDate, 'days');

    const growthRate = _.round(present/past - 1, 3);

    return {
      start,
      end,
      growthRate,
      days,
      annualGrowthRate: getGrowthRate(present/past, startDate, endDate),
    };
  }
}

const getOptimalGrowthRate = (spread) => {
  if(_.has(spread, 'min')) {
    const past = _.get(spread, 'min.close');
    const present = _.get(spread, 'max.close');

    const start = moment(_.get(spread, 'min.date'));
    const end = moment(_.get(spread, 'max.date'));
    const days = end.diff(start, 'days');

    const growthRate = _.round(present/past - 1, 3);
    // console.log(days, growthRate);

    return {
      growthRate,
      days,
      annualGrowthRate: getGrowthRate(present/past, start, end),
    };
  }
};

const getSpreadGrowthRatesBy = (stock) => {
  const info = {
    total: getTotalSpreadBy(stock),
  };

  const spread = getSpreadBy(stock);
  const growth = getOptimalGrowthRate(spread);
  if(growth) {
    _.assign(info, {
      optimal: _.assign({}, spread, growth)
    });
  }

  return info;
};

const getShareMarket = (spreads) => {
  const total = {};
  total.count = spreads.length;
  total.growthRate = _.mean(_.map(spreads, 'total.growthRate'));
  total.days = _.mean(_.map(spreads, 'total.days'));
  total.annualGrowthRate = _.mean(_.map(spreads, 'total.annualGrowthRate'));

  const optimal = {};
  optimal.count = getCountBy(spreads, 'optimal.growthRate');
  optimal.growthRate = getMeanBy(spreads, 'optimal.growthRate');
  optimal.days = getMeanBy(spreads, 'optimal.days');
  optimal.annualGrowthRate = getMeanBy(spreads, 'optimal.annualGrowthRate');

  // const outlier = _
  //   .chain(spreads)
  //   .filter(stock => {
  //     const x = _.get(stock, 'optimal.annualGrowthRate');
  //     // return _.get(spread, 'optimal.days', 0) > 7 && _.isNumber(x) && _.isNaN(x) === false && x > 1;
  //     return _.isNumber(x) && _.isNaN(x) === false && x > 1000;
  //   })
  //   .value();
  //
  // console.log(JSON.stringify(outlier, null, 2));

  return { total, optimal };
};

const getMeanBy = (spreads, path) => {
  return _.mean(getPropertyBy(spreads, path));
};

const getCountBy = (spreads, path) => {
  return getPropertyBy(spreads, path).length;
};

const getPropertyBy = (spreads, path) => {
  return _
    .chain(spreads)
    .filter((spread) => {
      return _.get(spread, 'optimal.days', 0) > 7;
    })
    .map(path)
    .filter(x => _.isNumber(x) && _.isNaN(x) === false)
    .value();
};

module.exports = {
  spread,
  getGrowthRate,
  getShareMarket,
  getSpreadGrowthRatesBy,
}

// console.log(spread([{ a: 3 }, { a: 2 }, { a: 1 }], 'a'));
// console.log(spread([{ a: 1 }, { a: 2 }, { a: 3 }], 'a'));
// console.log(spread([{ a: 2 }, { a: 1 }, { a: 3 }], 'a'));

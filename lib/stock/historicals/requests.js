const got       = require('got');
const fs        = require('fs-extra');
const _         = require('lodash');
const moment    = require('moment');

const { PREFIX } = require('../../shared/globals.js');

const basePath = `${__dirname}/../../../resources/stocks`;

const RANGES = {
  '1m': (days) => {
    return days <= 30;
  },
  '3m': (days) => {
    return days <= 90;
  },
  '6m': (days) => {
    return days <= 175;
  },
  '1y': (days) => {
    return days <= 365;
  },
  '2y': (days) => {
    return days <= 750;
  },
  '5y': (days) => {
    return days <= 1825;
  },
};

const getRange = ({ from }) => {
  if(!from) return '5y';

  const start = moment(from);
  const end = moment();

  const days = end.diff(start, 'days');

  return _.findKey(RANGES, (matches) => {
    return matches(days);
  });
};

const slice = (series, startDate) => {
  if(!startDate) return series;

  const start = moment(moment(startDate).format('YYYY-MM-DD'));

  const startIndex = _.findIndex(series, ({ date }) => {
    const current = moment(moment(date).format('YYYY-MM-DD'));
    return current.isSameOrAfter(start);
  });

  return _.slice(series, startIndex, series.length);
};

const getTimeseries = (params) => {
  const range = getRange(params) || '5y';
  console.log(`Requests historical prices for ${params.symbol} for range ${range}.`);

  const url = `${PREFIX}/stock/${params.symbol}/time-series/${range}`;
  // console.log(url);

  return got(url)
    .then((res) => {
      return JSON.parse(res.body);
    })
    .then((series) => {
      return slice(series, params.from);
    })
    .then((series) => {
      // console.log('original', _.slice(series, 0, 1));
      return _.map(series, prepareEntry);
    })
};

const prepareEntry = (point) => {
  point.date = moment.utc(point.date).toDate();
  return point;
};

module.exports = {
  getTimeseries,
};

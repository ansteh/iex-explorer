const _ = require('lodash');

const Interior = require('./maxima');

const Trends = _.curry(function(getValue, series) {

  var values = _.map(series, getValue);

  var peakIndices = Interior.findAllPeaks(values);
  var peakValues = _.map(peakIndices, function(index) { return values[index]; });

  var valleyIndices = Interior.findAllValleys(values);
  var valleyValues = _.map(valleyIndices, function(index) { return values[index]; });

  var aggragetUpperTrends = function() {
    var trend = [];
    return _.reduce(valleyIndices, function(trends, valleyIndex, index) {
      if(trend.length === 0) {
        trend.push(valleyIndex);
      } else {
        if(valleyValues[index] > values[_.last(trend)]) {
          trend.push(valleyIndex);
        } else {
          trends.push(trend);
          trend = [valleyIndex];
        }
      }
      return trends;
    }, []);
  };

  var aggragetDownTrends = function() {
    var trend = [];
    return _.reduce(peakIndices, function(trends, peakIndex, index) {
      if(trend.length === 0) {
        trend.push(peakIndex);
      } else {
        if(peakValues[index] < values[_.last(trend)]) {
          trend.push(peakIndex);
        } else {
          trends.push(trend);
          trend = [peakIndex];
        }
      }
      return trends;
    }, []);
  };

  function filter(trends) {
    return _.chain(trends)
      .filter(function(trend) {
        return trend.length > 1;
      })
      .map(function(trend) {
        return _.map(trend, function(index) {
          return series[index];
        });
      })
      .value();
  };

  var maxima = {
    peaks: {},
    valleys: {}
  };

  if(peakValues.length > 0) {
    maxima.peaks.max = series[peakIndices[_.indexOf(peakValues, _.max(peakValues))]];
    maxima.peaks.min = series[peakIndices[_.indexOf(peakValues, _.min(peakValues))]];
  }

  if(valleyValues.length > 0) {
    maxima.valleys.max = series[valleyIndices[_.indexOf(valleyValues, _.max(valleyValues))]];
    maxima.valleys.min = series[valleyIndices[_.indexOf(valleyValues, _.min(valleyValues))]];
  }

  return {
    peaks: _.map(peakIndices, function(index) { return series[index]; }),
    valleys: _.map(valleyIndices, function(index) { return series[index]; }),

    upper: filter(aggragetUpperTrends()),
    down: filter(aggragetDownTrends()),

    maxima: maxima,
  };

});

module.exports = Trends;

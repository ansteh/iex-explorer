const _       = require('lodash');
const Decimal = require('decimal.js');

const Stock     = require('../index.js');
const Symbols   = require('../../symbols/index.js');

const FINANCIAL_PROPERTIES = [
  'grossProfit',
  'cashFlow',
  'currentAssets',
  'currentCash',
  'currentDebt',
  'netIncome',
  'operatingExpense',
  'operatingIncome',
  'operatingRevenue',
  'researchAndDevelopment',
  'shareholderEquity',
  'totalAssets',
  'totalCash',
  'totalDebt',
  'totalRevenue',
];


const getFinancials = (stock) => {
  return _.get(stock, 'financials.annual');
};

const getMargins = (filing) => {

  return {
    reportDate: filing.reportDate,

    incomeStatement: getIncomeStatement(filing),
    balanceSheet: getBalanceSheet(filing),
  };
};

const getIncomeStatement = (filing) => {
  // console.log(filing.grossProfit - filing.operatingExpense, filing.netIncome);
  // console.log('grossProfit - operatingExpense = operatingIncome', filing.grossProfit - filing.operatingExpense === filing.operatingIncome);
  // console.log('operatingIncome > netIncome', filing.operatingIncome > filing.netIncome, filing.operatingIncome - filing.netIncome);

  const sgaAndDeprecation = Decimal(filing.operatingExpense || 0)
    .sub(filing.researchAndDevelopment || 0)
    .toNumber();

  const totalExpenses = Decimal(filing.grossProfit || 0)
    .sub(filing.netIncome || 0)
    .toNumber();

  const interestAndOther = Decimal(totalExpenses)
    .sub(filing.operatingExpense || 0)
    .toNumber();

  return {
    grossProfitMargin: divide(filing.grossProfit || 0, filing.totalRevenue),
    totalExpensesMargin: divide(totalExpenses || 0, filing.totalRevenue),
    netIncomeMargin: divide(filing.netIncome || 0, filing.totalRevenue),

    operating: {
      expense: divide(filing.operatingExpense || 0, filing.grossProfit),
      income: divide(filing.operatingIncome || 0, filing.grossProfit),
      researchAndDevelopment: divide(filing.researchAndDevelopment || 0, filing.grossProfit),
      sgaAndDeprecation: divide(sgaAndDeprecation || 0, filing.grossProfit),
    },

    financialCosts: {
      interestAndOther: divide(interestAndOther, filing.operatingIncome),
    },

    netIncome: {
      gross: divide(filing.netIncome || 0, filing.grossProfit),
      operating: divide(filing.netIncome || 0, filing.operatingIncome),
    }
  };
};

const divide = (a, b) => {
  return b ? Decimal.div(a || 0, b).toNumber() : null;
};

const getBalanceSheet = (filing) => {

  return {

  };
};

const evaluate = (margins = []) => {
  if(margins.length < 4) {
    return false;
  }

  const netIncomeMargins =  _.map(margins, 'incomeStatement.netIncomeMargin');

  return _.every(netIncomeMargins, margin => margin >= 0.2);
};

const getShareMarket = () => {
  const options = {
    type: 'cs',
    isEnabled: true,
  };

  return Symbols.query(options)
    .then(stocks => _.map(stocks, 'symbol'))
    .then(stocks => _.filter(stocks, _.isString))
};

const findProspects = () => {
  return getShareMarket()
    // .then(tickers => _.take(tickers, 1000))
    .then((tickers) => {
      const prospects = tickers.map((ticker) => {
        return Stock.get(ticker)
          .then(stock => _.includes(['REITs', 'Banks', 'Asset Management'], _.get(stock, 'industry')) ? null : stock)
          .then((stock) => {
            if(stock) {
              const filings = getFinancials(stock);
              const stats = _.map(filings, getMargins);

              if(evaluate(stats)) {
                return stock;
              }
            }
          })

          // .then(getFinancials)
          // .then(filings => filings ? filings.map(getMargins) : [])
          // .then(evaluate)
          // .then(isProspect => isProspect ? ticker : null)
      });

      return Promise.all(prospects)
        .then(stocks => _.filter(stocks, stock => stock))
    })
};

// Stock.get('AAPL')
//   .then(getFinancials)
//   .then(filings => filings.map(getMargins))
//   .then(evaluate)
//   // .then(margins => JSON.stringify(margins, null, 2))
//   .then(console.log)
//   .catch(console.log)

findProspects()
  .then(stocks => _.map(stocks, stock => _.pick(stock, ['symbol', 'industry'])))
  .then(console.log)
  .catch(console.log)

// Stock.get('ANSS')
//   .then(stock => _.get(stock, 'industry'))
//   .then(console.log)
//   .catch(console.log)

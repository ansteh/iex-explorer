const _       = require('lodash');
const Decimal = require('decimal.js');

const Stock     = require('../index.js');

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

const getRatios = (filing) => {
  console.log(filing.grossProfit - filing.operatingExpense, filing.netIncome);
  return {
    reportDate: filing.reportDate,

    costOfRevenue: Decimal.div(filing.costOfRevenue , filing.totalRevenue).toNumber(),
    grossProfit: Decimal.div(filing.grossProfit, filing.totalRevenue).toNumber(),

    researchAndDevelopment: Decimal.div(filing.researchAndDevelopment, filing.grossProfit).toNumber(),

    netIncomeToTotalRevenue: Decimal.div(filing.netIncome, filing.totalRevenue).toNumber(),
    netIncomeToGrossProfit: Decimal.div(filing.netIncome, filing.grossProfit).toNumber(),
  };
};

Stock.get('AAPL')
  .then(getFinancials)
  // .then(filings => filings.map(getRatios))
  .then(console.log)
  .catch(console.log)

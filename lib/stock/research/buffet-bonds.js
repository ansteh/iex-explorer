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

  const sgaAndDeprecation = Decimal(filing.operatingExpense)
    .sub(filing.researchAndDevelopment)
    .toNumber();

  const totalExpenses = Decimal(filing.grossProfit)
    .sub(filing.netIncome)
    .toNumber();

  const interestAndOther = Decimal(totalExpenses)
    .sub(filing.operatingExpense)
    .toNumber();

  return {
    grossProfitMargin: Decimal.div(filing.grossProfit, filing.totalRevenue).toNumber(),
    totalExpensesMargin: Decimal.div(totalExpenses, filing.totalRevenue).toNumber(),
    netIncomeMargin: Decimal.div(filing.netIncome, filing.totalRevenue).toNumber(),

    operating: {
      expense: Decimal.div(filing.operatingExpense, filing.grossProfit).toNumber(),
      income: Decimal.div(filing.operatingIncome, filing.grossProfit).toNumber(),
      researchAndDevelopment: Decimal.div(filing.researchAndDevelopment, filing.grossProfit).toNumber(),
      sgaAndDeprecation: Decimal.div(sgaAndDeprecation, filing.grossProfit).toNumber(),
    },

    financialCosts: {
      interestAndOther: Decimal.div(interestAndOther, filing.operatingIncome).toNumber(),
    },

    netIncome: {
      gross: Decimal.div(filing.netIncome, filing.grossProfit).toNumber(),
      operating: Decimal.div(filing.netIncome, filing.operatingIncome).toNumber(),
    }
  };
};

const getBalanceSheet = (filing) => {

  return {

  };
};

Stock.get('AAPL')
  .then(getFinancials)
  .then(filings => filings.map(getMargins))
  .then(margins => JSON.stringify(margins, null, 2))
  .then(console.log)
  .catch(console.log)

// Types for our fixed income data
interface FixedIncomePosition {
  // Basic identifiers
  positionId: string;
  traderId: string;
  accountId: string;
  bookId: string;
  cusip: string;
  isin: string;
  securityId: string;
  portfolioId: string;
  
  // Trade details
  tradeDate: string;
  settlementDate: string;
  maturityDate: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  notionalAmount: number;
  marketValue: number;
  
  // Security details
  securityType: string;
  securityName: string;
  issuer: string;
  issuerCountry: string;
  currency: string;
  couponRate: number;
  couponFrequency: string;
  daysToMaturity: number;
  yieldToMaturity: number;
  
  // Risk metrics
  duration: number;
  modifiedDuration: number;
  convexity: number;
  oaSpread: number;
  zSpread: number;
  effectiveDuration: number;
  effectiveConvexity: number;
  macaulayDuration: number;
  dv01: number;
  pv01: number;

  // Credit metrics
  creditRating: string;
  creditRatingAgency: string;
  creditSpread: number;
  defaultProbability: number;
  recoveryRate: number;
  
  // Performance metrics
  dailyPnL: number;
  mtdPnL: number;
  ytdPnL: number;
  inceptionPnL: number;
  
  // Liquidity metrics
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  bidAskSpread: number;
  averageDailyVolume: number;
  marketDepth: number;
  liquidityScore: number;
  
  // Regulatory & compliance
  regulatoryBook: string;
  riskWeighting: number;
  baselClassification: string;
  sftClassification: string;
  hqlaClassification: string;
  
  // Additional columns for extended data
  [key: string]: string | number | boolean | null;
}

// Constants for data generation
const SECURITY_TYPES = ['Treasury', 'Corporate', 'MBS', 'Municipal', 'Agency', 'Sovereign', 'TIPS', 'HighYield'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'SGD', 'HKD'];
const COUPON_FREQUENCIES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'];
const CREDIT_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'];
const RATING_AGENCIES = ['S&P', 'Moody\'s', 'Fitch', 'DBRS'];
const REGULATORY_BOOKS = ['Trading', 'Banking', 'AFS', 'HTM'];
const BASEL_CLASSIFICATIONS = ['Standardized', 'IRBA', 'IRBF', 'SA-CCR', 'IMM'];
const SFT_CLASSIFICATIONS = ['Repo', 'Securities Lending', 'None'];
const HQLA_CLASSIFICATIONS = ['Level 1', 'Level 2A', 'Level 2B', 'Non-HQLA'];
const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'JP', 'CA', 'IT', 'ES', 'AU', 'CH', 'CN', 'BR', 'IN', 'RU', 'MX', 'SG', 'HK'];
const LARGE_ISSUERS = [
  'US Treasury', 'UK Gilt', 'German Bund', 'Japanese Government', 'Apple Inc', 'Microsoft Corp', 'Amazon.com Inc',
  'Google LLC', 'JPMorgan Chase', 'Bank of America', 'Citigroup', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley',
  'Fannie Mae', 'Freddie Mac', 'European Investment Bank', 'World Bank'
];

/**
 * Generates a random string of specified length
 */
function randomString(length: number, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a random date within a range from current date
 */
function randomDate(minDaysOffset: number, maxDaysOffset: number): string {
  const today = new Date();
  const offsetDays = Math.floor(Math.random() * (maxDaysOffset - minDaysOffset + 1)) + minDaysOffset;
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

/**
 * Generates random numbers within a range with specified precision
 */
function randomNumber(min: number, max: number, precision: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(precision));
}

/**
 * Returns a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Creates a single fixed income position with 320+ attributes
 */
function createPosition(index: number): FixedIncomePosition {
  // Generate basic identifiers
  const positionId = `POS-${randomString(8)}`;
  const traderId = `TR${randomString(4)}`;
  const accountId = `AC${randomString(6)}`;
  const bookId = `BK-${randomString(4)}`;
  const cusip = randomString(9);
  const isin = `US${cusip}${randomString(1)}`;
  const securityId = `SID-${randomString(6)}`;
  const portfolioId = `PF-${randomString(5)}`;
  
  // Generate security details
  const securityType = randomElement(SECURITY_TYPES);
  const issuer = randomElement(LARGE_ISSUERS);
  const issuerCountry = randomElement(COUNTRIES);
  const currency = randomElement(CURRENCIES);
  const couponRate = randomNumber(0.1, 8.5, 3);
  const couponFrequency = randomElement(COUPON_FREQUENCIES);
  
  // Generate dates
  const tradeDate = randomDate(-365, -1);
  const settlementDate = randomDate(-360, 2);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yearsToMaturity = Math.floor(Math.random() * 30) + 1;
  const maturityDate = `${currentYear + yearsToMaturity}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
  const daysToMaturity = Math.floor((new Date(maturityDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate price and quantity metrics
  const entryPrice = randomNumber(85, 115, 4);
  const currentPrice = randomNumber(entryPrice * 0.9, entryPrice * 1.1, 4);
  const quantity = Math.floor(randomNumber(10000, 10000000, 0));
  const notionalAmount = quantity * 100; // Assuming par = 100
  const marketValue = quantity * currentPrice;
  
  // Generate pricing and risk metrics
  const yieldToMaturity = randomNumber(0.5, 10, 4);
  const duration = randomNumber(0.5, yearsToMaturity * 0.9, 3);
  const modifiedDuration = duration / (1 + yieldToMaturity / 100);
  const convexity = randomNumber(0.1, duration / 2, 4);
  const oaSpread = randomNumber(1, 500, 2);
  const zSpread = randomNumber(oaSpread * 0.9, oaSpread * 1.1, 2);
  const effectiveDuration = randomNumber(duration * 0.95, duration * 1.05, 3);
  const effectiveConvexity = randomNumber(convexity * 0.95, convexity * 1.05, 4);
  const macaulayDuration = randomNumber(duration * 0.98, duration * 1.02, 3);
  const dv01 = (marketValue * modifiedDuration) / 10000;
  const pv01 = dv01 * 100;
  
  // Generate credit metrics
  const creditRating = randomElement(CREDIT_RATINGS);
  const creditRatingAgency = randomElement(RATING_AGENCIES);
  const creditSpread = randomNumber(5, 500, 2);
  const defaultProbability = randomNumber(0.01, 5, 4);
  const recoveryRate = randomNumber(30, 70, 2);
  
  // Generate performance metrics
  const dailyPnL = randomNumber(-50000, 50000, 2);
  const mtdPnL = randomNumber(-200000, 200000, 2);
  const ytdPnL = randomNumber(-500000, 500000, 2);
  const inceptionPnL = randomNumber(-1000000, 1000000, 2);
  
  // Generate liquidity metrics
  const bidPrice = randomNumber(currentPrice * 0.99, currentPrice * 0.999, 4);
  const askPrice = randomNumber(currentPrice * 1.001, currentPrice * 1.01, 4);
  const bidSize = Math.floor(randomNumber(100000, 5000000, 0));
  const askSize = Math.floor(randomNumber(100000, 5000000, 0));
  const bidAskSpread = askPrice - bidPrice;
  const averageDailyVolume = Math.floor(randomNumber(1000000, 50000000, 0));
  const marketDepth = Math.floor(randomNumber(1, 10, 0));
  const liquidityScore = randomNumber(1, 10, 2);
  
  // Generate regulatory & compliance data
  const regulatoryBook = randomElement(REGULATORY_BOOKS);
  const riskWeighting = randomNumber(0, 150, 0);
  const baselClassification = randomElement(BASEL_CLASSIFICATIONS);
  const sftClassification = randomElement(SFT_CLASSIFICATIONS);
  const hqlaClassification = randomElement(HQLA_CLASSIFICATIONS);

  // Create the initial position object with the fields we've defined
  const position: FixedIncomePosition = {
    positionId, traderId, accountId, bookId, cusip, isin, securityId, portfolioId,
    tradeDate, settlementDate, maturityDate, entryPrice, currentPrice, quantity, notionalAmount, marketValue,
    securityType, securityName: `${issuer} ${securityType} ${couponRate}% ${maturityDate.slice(0, 4)}`, 
    issuer, issuerCountry, currency, couponRate, couponFrequency, daysToMaturity, yieldToMaturity,
    duration, modifiedDuration, convexity, oaSpread, zSpread, effectiveDuration, effectiveConvexity, macaulayDuration, dv01, pv01,
    creditRating, creditRatingAgency, creditSpread, defaultProbability, recoveryRate,
    dailyPnL, mtdPnL, ytdPnL, inceptionPnL,
    bidPrice, askPrice, bidSize, askSize, bidAskSpread, averageDailyVolume, marketDepth, liquidityScore,
    regulatoryBook, riskWeighting, baselClassification, sftClassification, hqlaClassification
  };

  // Add additional columns to reach 320 total
  // Risk sensitivities
  position['riskSensitivity_1y'] = randomNumber(-0.05, 0.05, 6);
  position['riskSensitivity_2y'] = randomNumber(-0.1, 0.1, 6);
  position['riskSensitivity_3y'] = randomNumber(-0.15, 0.15, 6);
  position['riskSensitivity_5y'] = randomNumber(-0.25, 0.25, 6);
  position['riskSensitivity_7y'] = randomNumber(-0.35, 0.35, 6);
  position['riskSensitivity_10y'] = randomNumber(-0.5, 0.5, 6);
  position['riskSensitivity_15y'] = randomNumber(-0.7, 0.7, 6);
  position['riskSensitivity_20y'] = randomNumber(-0.85, 0.85, 6);
  position['riskSensitivity_30y'] = randomNumber(-1, 1, 6);
  
  // Historical volatility metrics
  position['volatility_1d'] = randomNumber(0.01, 5, 4);
  position['volatility_1w'] = randomNumber(0.05, 8, 4);
  position['volatility_1m'] = randomNumber(0.1, 12, 4);
  position['volatility_3m'] = randomNumber(0.2, 15, 4);
  position['volatility_6m'] = randomNumber(0.3, 18, 4);
  position['volatility_1y'] = randomNumber(0.5, 20, 4);
  
  // Historical performance
  position['performance_1d'] = randomNumber(-2, 2, 4);
  position['performance_1w'] = randomNumber(-5, 5, 4);
  position['performance_1m'] = randomNumber(-8, 8, 4);
  position['performance_3m'] = randomNumber(-12, 12, 4);
  position['performance_6m'] = randomNumber(-15, 15, 4);
  position['performance_ytd'] = randomNumber(-20, 20, 4);
  position['performance_1y'] = randomNumber(-25, 25, 4);
  position['performance_3y'] = randomNumber(-30, 30, 4);
  position['performance_5y'] = randomNumber(-35, 35, 4);
  
  // Credit default swap data
  position['cds_1y'] = randomNumber(1, 500, 2);
  position['cds_3y'] = randomNumber(5, 550, 2);
  position['cds_5y'] = randomNumber(10, 600, 2);
  position['cds_7y'] = randomNumber(15, 650, 2);
  position['cds_10y'] = randomNumber(20, 700, 2);
  
  // Stress test results
  position['stress_parallel_up_100bp'] = randomNumber(-10, 0, 4);
  position['stress_parallel_down_100bp'] = randomNumber(0, 10, 4);
  position['stress_steepener_100bp'] = randomNumber(-5, 5, 4);
  position['stress_flattener_100bp'] = randomNumber(-5, 5, 4);
  position['stress_short_up_100bp'] = randomNumber(-8, 2, 4);
  position['stress_short_down_100bp'] = randomNumber(-2, 8, 4);
  position['stress_long_up_100bp'] = randomNumber(-8, 2, 4);
  position['stress_long_down_100bp'] = randomNumber(-2, 8, 4);
  position['stress_credit_up_100bp'] = randomNumber(-10, 0, 4);
  position['stress_credit_down_100bp'] = randomNumber(0, 10, 4);
  position['stress_volatility_up_10pct'] = randomNumber(-5, 5, 4);
  position['stress_volatility_down_10pct'] = randomNumber(-5, 5, 4);
  position['stress_fx_up_10pct'] = randomNumber(-5, 5, 4);
  position['stress_fx_down_10pct'] = randomNumber(-5, 5, 4);
  position['stress_inflation_up_100bp'] = randomNumber(-8, 2, 4);
  position['stress_inflation_down_100bp'] = randomNumber(-2, 8, 4);
  
  // Historical spread metrics
  position['spread_vs_benchmark_1d'] = randomNumber(-50, 50, 2);
  position['spread_vs_benchmark_1w'] = randomNumber(-60, 60, 2);
  position['spread_vs_benchmark_1m'] = randomNumber(-70, 70, 2);
  position['spread_vs_benchmark_3m'] = randomNumber(-80, 80, 2);
  position['spread_vs_benchmark_6m'] = randomNumber(-90, 90, 2);
  position['spread_vs_benchmark_1y'] = randomNumber(-100, 100, 2);
  
  // Risk decomposition
  position['risk_ir'] = randomNumber(0, 100, 2);
  position['risk_credit'] = randomNumber(0, 100, 2);
  position['risk_fx'] = randomNumber(0, 50, 2);
  position['risk_inflation'] = randomNumber(0, 30, 2);
  position['risk_volatility'] = randomNumber(0, 20, 2);
  position['risk_basis'] = randomNumber(0, 15, 2);
  position['risk_other'] = randomNumber(0, 10, 2);
  
  // Benchmark data
  position['benchmark_id'] = `BM-${randomString(6)}`;
  position['benchmark_name'] = `${currency} ${securityType} ${Math.floor(yearsToMaturity)}Y Index`;
  position['benchmark_yield'] = randomNumber(0.1, 8, 4);
  position['benchmark_duration'] = randomNumber(0.5, yearsToMaturity, 3);
  position['benchmark_spread'] = randomNumber(-100, 100, 2);
  position['tracking_error'] = randomNumber(0.1, 5, 4);
  position['active_risk'] = randomNumber(0.5, 8, 4);
  position['information_ratio'] = randomNumber(-2, 2, 4);
  position['sharpe_ratio'] = randomNumber(-1, 3, 4);
  position['sortino_ratio'] = randomNumber(-1, 4, 4);
  position['treynor_ratio'] = randomNumber(-2, 5, 4);
  position['jensen_alpha'] = randomNumber(-5, 5, 4);
  
  // Counterparty information
  position['counterparty_id'] = `CP-${randomString(6)}`;
  position['counterparty_name'] = randomElement(['JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'BAML', 'Citi', 'BNP Paribas', 'HSBC', 'Deutsche Bank', 'Barclays', 'UBS', 'Credit Suisse']);
  position['counterparty_rating'] = randomElement(['A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-']);
  position['counterparty_country'] = randomElement(COUNTRIES);
  position['counterparty_exposure'] = notionalAmount;
  position['counterparty_collateral'] = randomNumber(0, notionalAmount, 0);
  position['counterparty_netting_agreement'] = Math.random() > 0.2;
  position['counterparty_csa'] = Math.random() > 0.3;
  
  // Pricing model data
  position['pricing_model'] = randomElement(['Bloomberg', 'MarkIt', 'Internal', 'Vendor A', 'Vendor B']);
  position['pricing_source'] = randomElement(['Market', 'Model', 'Desk Quote', 'Trader Input', 'External Quote']);
  position['pricing_quality'] = randomNumber(1, 5, 0);
  position['pricing_uncertainty'] = randomNumber(0.01, 5, 4);
  position['liquidity_premium'] = randomNumber(0, 50, 2);
  position['pricing_datetime'] = new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString();
  
  // FX related data
  position['fx_rate'] = randomNumber(0.5, 2, 4);
  position['fx_exposure'] = Math.random() > 0.5 ? notionalAmount : 0;
  position['fx_hedged'] = Math.random() > 0.3;
  position['fx_hedge_ratio'] = Math.random() > 0.3 ? randomNumber(0, 100, 2) : 0;
  position['fx_hedge_cost'] = Math.random() > 0.3 ? randomNumber(0, 50, 2) : 0;
  
  // Settlement & clearing data
  position['settlement_type'] = randomElement(['DVP', 'FOP', 'DFP']);
  position['clearing_house'] = randomElement(['DTCC', 'Euroclear', 'Clearstream', 'OCC', 'LCH', 'None']);
  position['custodian'] = randomElement(['BNY Mellon', 'State Street', 'Northern Trust', 'JPMorgan', 'Citi', 'Internal']);
  position['fails_count'] = Math.random() > 0.9 ? Math.floor(randomNumber(1, 5, 0)) : 0;
  position['pending_settlement'] = Math.random() > 0.8;
  
  // Trading analytics
  position['execution_venue'] = randomElement(['Bloomberg', 'MarketAxess', 'Tradeweb', 'BondDesk', 'NASDAQ', 'NYSE', 'Direct', 'Voice']);
  position['execution_datetime'] = new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString();
  position['execution_cost'] = randomNumber(0, 25, 2);
  position['commission'] = randomNumber(0, 10, 2);
  position['transaction_cost_analysis'] = randomNumber(0, 50, 2);
  
  // Internal identifiers
  position['internal_id'] = `INT-${randomString(8)}`;
  position['strategy_id'] = `STR-${randomString(4)}`;
  position['desk'] = randomElement(['Treasury', 'Credit', 'Structured', 'Government', 'Municipal', 'High Yield', 'Emerging Markets']);
  position['group'] = randomElement(['Fixed Income', 'Rates', 'Credit', 'Emerging Markets', 'Structured Products']);
  position['division'] = randomElement(['Trading', 'Asset Management', 'Treasury', 'Risk', 'Proprietary']);
  
  // Generate additional columns to reach 320 total
  // Add market data points
  for (let i = 1; i <= 20; i++) {
    position[`market_data_point_${i}`] = randomNumber(0, 1000, 4);
  }
  
  // Add risk factors
  for (let i = 1; i <= 20; i++) {
    position[`risk_factor_${i}`] = randomNumber(-10, 10, 6);
  }
  
  // Add sensitivity metrics
  for (let i = 1; i <= 20; i++) {
    position[`sensitivity_metric_${i}`] = randomNumber(-5, 5, 6);
  }
  
  // Add custom analytics
  for (let i = 1; i <= 20; i++) {
    position[`custom_analytics_${i}`] = randomNumber(0, 100, 4);
  }
  
  // Add compliance flags
  for (let i = 1; i <= 20; i++) {
    position[`compliance_check_${i}`] = Math.random() > 0.9 ? false : true;
  }
  
  // Add scenario analysis results
  for (let i = 1; i <= 20; i++) {
    position[`scenario_${i}_impact`] = randomNumber(-20, 20, 4);
  }
  
  // Add portfolio attribution
  for (let i = 1; i <= 10; i++) {
    position[`attribution_factor_${i}`] = randomNumber(-5, 5, 4);
  }
  
  return position;
}

/**
 * Generates fixed income data with the specified number of rows
 * Returns the data as a JavaScript array of objects
 */
export function generateFixedIncomeData(rowCount: number = 100): FixedIncomePosition[] {
  console.time('Data Generation');
  
  // Use batch processing for better performance with large datasets
  const batchSize = 10000;
  const result: FixedIncomePosition[] = [];
  
  for (let i = 0; i < rowCount; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, rowCount - i);
    const batch = Array.from({ length: currentBatchSize }, (_, index) => createPosition(i + index));
    result.push(...batch);
    
    // Log progress for large datasets
    if (rowCount > 50000 && i % 50000 === 0 && i > 0) {
      console.log(`Generated ${i} rows (${(i / rowCount * 100).toFixed(2)}% complete)`);
    }
  }
  
  console.timeEnd('Data Generation');
  return result;
}

/**
 * Generates fixed income data and returns it as a JSON string
 * 
 * @param rowCount - Number of data rows to generate
 * @param prettyPrint - Whether to format the JSON with indentation (default: false)
 * @returns JSON string containing the generated data
 */
export function generateFixedIncomeJSON(rowCount: number, prettyPrint: boolean = false): string {
  console.time('JSON Generation');
  
  const data = generateFixedIncomeData(rowCount);
  
  // Convert data to JSON string with optional pretty printing
  const jsonString = prettyPrint 
    ? JSON.stringify(data, null, 2)  // Pretty print with 2-space indentation
    : JSON.stringify(data);          // Compact JSON format
  
  console.timeEnd('JSON Generation');
  return jsonString;
}
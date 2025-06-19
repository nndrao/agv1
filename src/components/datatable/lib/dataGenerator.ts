// Types for our fixed income data
export interface FixedIncomePosition {
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

const BATCH_SIZE = 100;
let randomBatch: number[] = [];
let batchIndex = 0;

function getRandomFromBatch(): number {
  if (batchIndex >= randomBatch.length) {
    randomBatch = new Array(BATCH_SIZE);
    for (let i = 0; i < BATCH_SIZE; i++) {
      randomBatch[i] = Math.random();
    }
    batchIndex = 0;
  }
  return randomBatch[batchIndex++];
}

function fastRandomNumber(min: number, max: number, precision: number = 2): number {
  const value = getRandomFromBatch() * (max - min) + min;
  return parseFloat(value.toFixed(precision));
}

function fastRandomElement<T>(array: T[]): T {
  return array[Math.floor(getRandomFromBatch() * array.length)];
}

function createPosition(): FixedIncomePosition {
  // Generate basic identifiers
  const positionId = `POS-${randomString(8)}`;
  const traderId = `TR${randomString(4)}`;
  const accountId = `AC${randomString(6)}`;
  const bookId = `BK-${randomString(4)}`;
  const cusip = randomString(9);
  const isin = `US${cusip}${randomString(1)}`;
  const securityId = `SID-${randomString(6)}`;
  const portfolioId = `PF-${randomString(5)}`;
  
  const securityType = fastRandomElement(SECURITY_TYPES);
  const issuer = fastRandomElement(LARGE_ISSUERS);
  const issuerCountry = fastRandomElement(COUNTRIES);
  const currency = fastRandomElement(CURRENCIES);
  const couponRate = fastRandomNumber(0.1, 8.5, 3);
  const couponFrequency = fastRandomElement(COUPON_FREQUENCIES);
  
  const tradeDate = randomDate(-365, -1);
  const settlementDate = randomDate(-360, 2);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yearsToMaturity = Math.floor(getRandomFromBatch() * 30) + 1;
  const maturityDate = `${currentYear + yearsToMaturity}-${String(Math.floor(getRandomFromBatch() * 12) + 1).padStart(2, '0')}-${String(Math.floor(getRandomFromBatch() * 28) + 1).padStart(2, '0')}`;
  const daysToMaturity = Math.floor((new Date(maturityDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const entryPrice = fastRandomNumber(85, 115, 4);
  const currentPrice = fastRandomNumber(entryPrice * 0.9, entryPrice * 1.1, 4);
  const quantity = Math.floor(fastRandomNumber(10000, 10000000, 0));
  const notionalAmount = quantity * 100;
  const marketValue = quantity * currentPrice;
  
  const yieldToMaturity = fastRandomNumber(0.5, 10, 4);
  const duration = fastRandomNumber(0.5, yearsToMaturity * 0.9, 3);
  const modifiedDuration = duration / (1 + yieldToMaturity / 100);
  const convexity = fastRandomNumber(0.1, duration / 2, 4);
  const oaSpread = fastRandomNumber(1, 500, 2);
  const zSpread = fastRandomNumber(oaSpread * 0.9, oaSpread * 1.1, 2);
  const effectiveDuration = fastRandomNumber(duration * 0.95, duration * 1.05, 3);
  const effectiveConvexity = fastRandomNumber(convexity * 0.95, convexity * 1.05, 4);
  const macaulayDuration = fastRandomNumber(duration * 0.98, duration * 1.02, 3);
  const dv01 = (marketValue * modifiedDuration) / 10000;
  const pv01 = dv01 * 100;
  
  const creditRating = fastRandomElement(CREDIT_RATINGS);
  const creditRatingAgency = fastRandomElement(RATING_AGENCIES);
  const creditSpread = fastRandomNumber(5, 500, 2);
  const defaultProbability = fastRandomNumber(0.01, 5, 4);
  const recoveryRate = fastRandomNumber(30, 70, 2);
  
  const dailyPnL = fastRandomNumber(-50000, 50000, 2);
  const mtdPnL = fastRandomNumber(-200000, 200000, 2);
  const ytdPnL = fastRandomNumber(-500000, 500000, 2);
  const inceptionPnL = fastRandomNumber(-1000000, 1000000, 2);
  
  const bidPrice = fastRandomNumber(currentPrice * 0.99, currentPrice * 0.999, 4);
  const askPrice = fastRandomNumber(currentPrice * 1.001, currentPrice * 1.01, 4);
  const bidSize = Math.floor(fastRandomNumber(100000, 5000000, 0));
  const askSize = Math.floor(fastRandomNumber(100000, 5000000, 0));
  const bidAskSpread = askPrice - bidPrice;
  const averageDailyVolume = Math.floor(fastRandomNumber(1000000, 50000000, 0));
  const marketDepth = Math.floor(fastRandomNumber(1, 10, 0));
  const liquidityScore = fastRandomNumber(1, 10, 2);
  
  const regulatoryBook = fastRandomElement(REGULATORY_BOOKS);
  const riskWeighting = fastRandomNumber(0, 150, 0);
  const baselClassification = fastRandomElement(BASEL_CLASSIFICATIONS);
  const sftClassification = fastRandomElement(SFT_CLASSIFICATIONS);
  const hqlaClassification = fastRandomElement(HQLA_CLASSIFICATIONS);

  const position: FixedIncomePosition = {
    positionId, traderId, accountId, bookId, cusip, isin, securityId, portfolioId,
    tradeDate, settlementDate, maturityDate, entryPrice, currentPrice, quantity, notionalAmount, marketValue,
    securityType, securityName: `${issuer} ${securityType} ${couponRate}% ${maturityDate.slice(0, 4)}`, 
    issuer, issuerCountry, currency, couponRate, couponFrequency, daysToMaturity, yieldToMaturity,
    duration, modifiedDuration, convexity, oaSpread, zSpread, effectiveDuration, effectiveConvexity, macaulayDuration, dv01, pv01,
    creditRating, creditRatingAgency, creditSpread, defaultProbability, recoveryRate,
    dailyPnL, mtdPnL, ytdPnL, inceptionPnL,
    bidPrice, askPrice, bidSize, askSize, bidAskSpread, averageDailyVolume, marketDepth, liquidityScore,
    regulatoryBook, riskWeighting, baselClassification, sftClassification, hqlaClassification,
    'riskSensitivity_1y': fastRandomNumber(-0.05, 0.05, 6),
    'riskSensitivity_2y': fastRandomNumber(-0.1, 0.1, 6),
    'riskSensitivity_3y': fastRandomNumber(-0.15, 0.15, 6),
    'riskSensitivity_5y': fastRandomNumber(-0.25, 0.25, 6),
    'riskSensitivity_7y': fastRandomNumber(-0.35, 0.35, 6),
    'riskSensitivity_10y': fastRandomNumber(-0.5, 0.5, 6),
    'riskSensitivity_15y': fastRandomNumber(-0.7, 0.7, 6),
    'riskSensitivity_20y': fastRandomNumber(-0.85, 0.85, 6),
    'riskSensitivity_30y': fastRandomNumber(-1, 1, 6),
    
    // Historical volatility metrics
    'volatility_1d': fastRandomNumber(0.01, 5, 4),
    'volatility_1w': fastRandomNumber(0.05, 8, 4),
    'volatility_1m': fastRandomNumber(0.1, 12, 4),
    'volatility_3m': fastRandomNumber(0.2, 15, 4),
    'volatility_6m': fastRandomNumber(0.3, 18, 4),
    'volatility_1y': fastRandomNumber(0.5, 20, 4),
    
    // Historical performance
    'performance_1d': fastRandomNumber(-2, 2, 4),
    'performance_1w': fastRandomNumber(-5, 5, 4),
    'performance_1m': fastRandomNumber(-8, 8, 4),
    'performance_3m': fastRandomNumber(-12, 12, 4),
    'performance_6m': fastRandomNumber(-15, 15, 4),
    'performance_ytd': fastRandomNumber(-20, 20, 4),
    'performance_1y': fastRandomNumber(-25, 25, 4),
    'performance_3y': fastRandomNumber(-30, 30, 4),
    'performance_5y': fastRandomNumber(-35, 35, 4),
    
    // Credit default swap data
    'cds_1y': fastRandomNumber(1, 500, 2),
    'cds_3y': fastRandomNumber(5, 550, 2),
    'cds_5y': fastRandomNumber(10, 600, 2),
    'cds_7y': fastRandomNumber(15, 650, 2),
    'cds_10y': fastRandomNumber(20, 700, 2),
    
    // Stress test results
    'stress_parallel_up_100bp': fastRandomNumber(-10, 0, 4),
    'stress_parallel_down_100bp': fastRandomNumber(0, 10, 4),
    'stress_steepener_100bp': fastRandomNumber(-5, 5, 4),
    'stress_flattener_100bp': fastRandomNumber(-5, 5, 4),
    'stress_short_up_100bp': fastRandomNumber(-8, 2, 4),
    'stress_short_down_100bp': fastRandomNumber(-2, 8, 4),
    'stress_long_up_100bp': fastRandomNumber(-8, 2, 4),
    'stress_long_down_100bp': fastRandomNumber(-2, 8, 4),
    'stress_credit_up_100bp': fastRandomNumber(-10, 0, 4),
    'stress_credit_down_100bp': fastRandomNumber(0, 10, 4),
    'stress_volatility_up_10pct': fastRandomNumber(-5, 5, 4),
    'stress_volatility_down_10pct': fastRandomNumber(-5, 5, 4),
    'stress_fx_up_10pct': fastRandomNumber(-5, 5, 4),
    'stress_fx_down_10pct': fastRandomNumber(-5, 5, 4),
    'stress_inflation_up_100bp': fastRandomNumber(-8, 2, 4),
    'stress_inflation_down_100bp': fastRandomNumber(-2, 8, 4),
    
    // Historical spread metrics
    'spread_vs_benchmark_1d': fastRandomNumber(-50, 50, 2),
    'spread_vs_benchmark_1w': fastRandomNumber(-60, 60, 2),
    'spread_vs_benchmark_1m': fastRandomNumber(-70, 70, 2),
    'spread_vs_benchmark_3m': fastRandomNumber(-80, 80, 2),
    'spread_vs_benchmark_6m': fastRandomNumber(-90, 90, 2),
    'spread_vs_benchmark_1y': fastRandomNumber(-100, 100, 2),
    
    // Risk decomposition
    'risk_ir': fastRandomNumber(0, 100, 2),
    'risk_credit': fastRandomNumber(0, 100, 2),
    'risk_fx': fastRandomNumber(0, 50, 2),
    'risk_inflation': fastRandomNumber(0, 30, 2),
    'risk_volatility': fastRandomNumber(0, 20, 2),
    'risk_basis': fastRandomNumber(0, 15, 2),
    'risk_other': fastRandomNumber(0, 10, 2),
    
    // Benchmark data
    'benchmark_id': `BM-${randomString(6)}`,
    'benchmark_name': `${currency} ${securityType} ${Math.floor(yearsToMaturity)}Y Index`,
    'benchmark_yield': fastRandomNumber(0.1, 8, 4),
    'benchmark_duration': fastRandomNumber(0.5, yearsToMaturity, 3),
    'benchmark_spread': fastRandomNumber(-100, 100, 2),
    'tracking_error': fastRandomNumber(0.1, 5, 4),
    'active_risk': fastRandomNumber(0.5, 8, 4),
    'information_ratio': fastRandomNumber(-2, 2, 4),
    'sharpe_ratio': fastRandomNumber(-1, 3, 4),
    'sortino_ratio': fastRandomNumber(-1, 4, 4),
    'treynor_ratio': fastRandomNumber(-2, 5, 4),
    'jensen_alpha': fastRandomNumber(-5, 5, 4),
    'counterparty_id': `CP-${randomString(6)}`,
    'counterparty_name': fastRandomElement(['JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'BAML', 'Citi', 'BNP Paribas', 'HSBC', 'Deutsche Bank', 'Barclays', 'UBS', 'Credit Suisse']),
    'counterparty_rating': fastRandomElement(['A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-']),
    'counterparty_country': fastRandomElement(COUNTRIES),
    'counterparty_exposure': notionalAmount,
    'counterparty_collateral': fastRandomNumber(0, notionalAmount, 0),
    'counterparty_netting_agreement': getRandomFromBatch() > 0.2,
    'counterparty_csa': getRandomFromBatch() > 0.3,
    'pricing_model': fastRandomElement(['Bloomberg', 'MarkIt', 'Internal', 'Vendor A', 'Vendor B']),
    'pricing_source': fastRandomElement(['Market', 'Model', 'Desk Quote', 'Trader Input', 'External Quote']),
    'pricing_quality': fastRandomNumber(1, 5, 0),
    'pricing_uncertainty': fastRandomNumber(0.01, 5, 4),
    'liquidity_premium': fastRandomNumber(0, 50, 2),
    'pricing_datetime': new Date(Date.now() - Math.floor(getRandomFromBatch() * 86400000)).toISOString(),
    'fx_rate': fastRandomNumber(0.5, 2, 4),
    'fx_exposure': getRandomFromBatch() > 0.5 ? notionalAmount : 0,
    'fx_hedged': getRandomFromBatch() > 0.3,
    'fx_hedge_ratio': getRandomFromBatch() > 0.3 ? fastRandomNumber(0, 100, 2) : 0,
    'fx_hedge_cost': getRandomFromBatch() > 0.3 ? fastRandomNumber(0, 50, 2) : 0,
    'settlement_type': fastRandomElement(['DVP', 'FOP', 'DFP']),
    'clearing_house': fastRandomElement(['DTCC', 'Euroclear', 'Clearstream', 'OCC', 'LCH', 'None']),
    'custodian': fastRandomElement(['BNY Mellon', 'State Street', 'Northern Trust', 'JPMorgan', 'Citi', 'Internal']),
    'fails_count': getRandomFromBatch() > 0.9 ? Math.floor(fastRandomNumber(1, 5, 0)) : 0,
    'pending_settlement': getRandomFromBatch() > 0.8,
    'execution_venue': fastRandomElement(['Bloomberg', 'MarketAxess', 'Tradeweb', 'BondDesk', 'NASDAQ', 'NYSE', 'Direct', 'Voice']),
    'execution_datetime': new Date(Date.now() - Math.floor(getRandomFromBatch() * 31536000000)).toISOString(),
    'execution_cost': fastRandomNumber(0, 25, 2),
    'commission': fastRandomNumber(0, 10, 2),
    'transaction_cost_analysis': fastRandomNumber(0, 50, 2),
    'internal_id': `INT-${randomString(8)}`,
    'strategy_id': `STR-${randomString(4)}`,
    'desk': fastRandomElement(['Treasury', 'Credit', 'Structured', 'Government', 'Municipal', 'High Yield', 'Emerging Markets']),
    'group': fastRandomElement(['Fixed Income', 'Rates', 'Credit', 'Emerging Markets', 'Structured Products']),
    'division': fastRandomElement(['Trading', 'Asset Management', 'Treasury', 'Risk', 'Proprietary'])
  };

  for (let i = 1; i <= 20; i++) {
    position[`market_data_point_${i}`] = fastRandomNumber(0, 1000, 4);
    position[`risk_factor_${i}`] = fastRandomNumber(-10, 10, 6);
    position[`sensitivity_metric_${i}`] = fastRandomNumber(-5, 5, 6);
    position[`custom_analytics_${i}`] = fastRandomNumber(0, 100, 4);
    position[`compliance_check_${i}`] = getRandomFromBatch() > 0.9 ? false : true;
    position[`scenario_${i}_impact`] = fastRandomNumber(-20, 20, 4);
  }
  
  for (let i = 1; i <= 10; i++) {
    position[`attribution_factor_${i}`] = fastRandomNumber(-5, 5, 4);
  }
  
  return position;
}

/**
 * Generates fixed income data with the specified number of rows
 * Returns the data as a JavaScript array of objects
 */
export function generateFixedIncomeData(rowCount: number = 100): FixedIncomePosition[] {
  console.time('Data Generation');
  
  // Pre-allocate result array for better performance
  const result: FixedIncomePosition[] = new Array(rowCount);
  
  // Use batch processing for better performance with large datasets
  const batchSize = 10000;
  
  for (let i = 0; i < rowCount; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, rowCount - i);
    
    // Generate batch using optimized loop instead of Array.from
    for (let j = 0; j < currentBatchSize; j++) {
      result[i + j] = createPosition();
    }
    
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

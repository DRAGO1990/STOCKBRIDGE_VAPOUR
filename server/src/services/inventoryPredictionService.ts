import { getDaysUntilExpiry, MIN_EXPIRY_DAYS } from '../utils/urgency';

export type PredictionConfidence = 'insufficient' | 'low' | 'medium' | 'high';
export type InventoryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  soldQuantity: number;
  remainingQuantity: number;
  restockedQuantity?: number;
}

export interface InventoryPredictionResult {
  currentQuantity: number;
  unit: string;
  historyDaysCount: number;
  averageDailySales: number;
  daysUntilExpiry: number | null;
  daysUntilHighUrgency: number;
  predictedDaysToSellRemaining: number | null; // null if sales = 0
  predictedRemainingAtHighUrgency: number;
  recommendedListingQuantity: number;
  riskLevel: InventoryRiskLevel;
  confidence: PredictionConfidence;
  shouldRecommendListing: boolean;
  canListOnStockBridge: boolean; // false if daysUntilExpiry < 11
  reason: string;
}

// Configurable constants for explainability and tuning
export const PREDICTION_CONFIG = {
  HIGH_URGENCY_START_DAYS: 25, // Urgency HIGH begins at <= 25 days
  MAX_HISTORY_DAYS_WINDOW: 14, // Last 14 days of logs used for weighted average
  MIN_HISTORY_FOR_LOW_CONFIDENCE: 3,
  MIN_HISTORY_FOR_MED_CONFIDENCE: 7,
  MIN_HISTORY_FOR_HIGH_CONFIDENCE: 14,
  DEAD_STOCK_EXPIRY_THRESHOLD: 40, // 0 sales and <= 40 days -> HIGH risk
  HIGH_RISK_RATIO: 0.5, // >= 50% remaining at high urgency -> HIGH risk
};

/**
 * Calculates weighted recent average daily sales from logs.
 * Newer logs receive linearly higher weight: w_i = i (1 <= i <= N).
 */
export function calculateSalesVelocity(logs: DailyLogEntry[]): {
  averageDailySales: number;
  validDaysCount: number;
} {
  if (!logs || logs.length === 0) {
    return { averageDailySales: 0, validDaysCount: 0 };
  }

  // Sort logs chronologically ascending (oldest first, newest last)
  const sorted = [...logs]
    .filter((l) => l.soldQuantity >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Take up to the most recent window (14 days)
  const recentLogs = sorted.slice(-PREDICTION_CONFIG.MAX_HISTORY_DAYS_WINDOW);
  const n = recentLogs.length;

  if (n === 0) {
    return { averageDailySales: 0, validDaysCount: 0 };
  }

  // If all sales are 0, return 0
  const allZero = recentLogs.every((l) => l.soldQuantity === 0);
  if (allZero) {
    return { averageDailySales: 0, validDaysCount: n };
  }

  // Linear weighted moving average: day 1 has weight 1, day N has weight N
  let weightedSum = 0;
  let totalWeights = 0;

  for (let i = 0; i < n; i++) {
    const weight = i + 1;
    weightedSum += recentLogs[i].soldQuantity * weight;
    totalWeights += weight;
  }

  const rawAverage = weightedSum / totalWeights;
  // Round to 1 decimal place (or 2 if < 1)
  const rounded = rawAverage < 1 ? Math.round(rawAverage * 100) / 100 : Math.round(rawAverage * 10) / 10;

  return {
    averageDailySales: rounded,
    validDaysCount: n,
  };
}

/**
 * Evaluates prediction confidence based on available history days.
 */
export function evaluateConfidence(historyDaysCount: number): PredictionConfidence {
  if (historyDaysCount < PREDICTION_CONFIG.MIN_HISTORY_FOR_LOW_CONFIDENCE) {
    return 'insufficient';
  }
  if (historyDaysCount < PREDICTION_CONFIG.MIN_HISTORY_FOR_MED_CONFIDENCE) {
    return 'low';
  }
  if (historyDaysCount < PREDICTION_CONFIG.MIN_HISTORY_FOR_HIGH_CONFIDENCE) {
    return 'medium';
  }
  return 'high';
}

/**
 * Deterministic mathematical prediction of inventory expiry risk and excess stock.
 */
export function predictInventoryBatchRisk(params: {
  productName: string;
  currentQuantity: number;
  unit: string;
  expiryDate: string | Date;
  dailyLogs: DailyLogEntry[];
}): InventoryPredictionResult {
  const { currentQuantity, unit, expiryDate, dailyLogs } = params;

  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  const { averageDailySales, validDaysCount } = calculateSalesVelocity(dailyLogs);
  const confidence = evaluateConfidence(validDaysCount);

  // Can this product be listed on StockBridge? (Rule: Expiry >= 11 days)
  const canListOnStockBridge = daysUntilExpiry !== null && daysUntilExpiry >= MIN_EXPIRY_DAYS;

  // Days until HIGH urgency begins (starts at 25 days)
  const daysUntilHighUrgency = daysUntilExpiry !== null
    ? Math.max(0, daysUntilExpiry - PREDICTION_CONFIG.HIGH_URGENCY_START_DAYS)
    : 0;

  // Calculate predicted remaining at High Urgency
  let expectedSalesUntilHighUrgency = 0;
  let predictedRemainingAtHighUrgency = 0;

  if (daysUntilHighUrgency > 0) {
    expectedSalesUntilHighUrgency = averageDailySales * daysUntilHighUrgency;
    predictedRemainingAtHighUrgency = Math.max(0, currentQuantity - expectedSalesUntilHighUrgency);
  } else {
    // Already in High Urgency (daysUntilExpiry <= 25)
    // In this case, expected sales until actual expiry:
    const expectedSalesUntilExpiry = averageDailySales * Math.max(0, daysUntilExpiry ?? 0);
    predictedRemainingAtHighUrgency = Math.max(0, currentQuantity - expectedSalesUntilExpiry);
  }

  // Round predicted remaining
  predictedRemainingAtHighUrgency = Math.round(predictedRemainingAtHighUrgency * 10) / 10;

  // Predicted days to completely sell remaining inventory
  let predictedDaysToSellRemaining: number | null = null;
  if (averageDailySales > 0) {
    predictedDaysToSellRemaining = Math.round(currentQuantity / averageDailySales);
  }

  // Determine Risk Level (HIGH | MEDIUM | LOW)
  let riskLevel: InventoryRiskLevel = 'LOW';
  if (daysUntilExpiry !== null) {
    if (averageDailySales === 0 && daysUntilExpiry <= PREDICTION_CONFIG.DEAD_STOCK_EXPIRY_THRESHOLD) {
      riskLevel = 'HIGH';
    } else if (predictedDaysToSellRemaining !== null && predictedDaysToSellRemaining > daysUntilExpiry) {
      riskLevel = 'HIGH';
    } else if (predictedRemainingAtHighUrgency >= currentQuantity * PREDICTION_CONFIG.HIGH_RISK_RATIO) {
      riskLevel = 'HIGH';
    } else if (
      predictedRemainingAtHighUrgency > 0 ||
      (predictedDaysToSellRemaining !== null && predictedDaysToSellRemaining > daysUntilExpiry - 10)
    ) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
  }

  // Recommendation Decision
  let shouldRecommendListing = false;
  let recommendedListingQuantity = 0;

  if (canListOnStockBridge && currentQuantity > 0) {
    if (confidence === 'insufficient' && averageDailySales > 0) {
      // With insufficient data, do not present an aggressive recommendation
      shouldRecommendListing = false;
    } else if (averageDailySales === 0 && daysUntilExpiry !== null && daysUntilExpiry <= PREDICTION_CONFIG.DEAD_STOCK_EXPIRY_THRESHOLD) {
      // Dead stock with 0 movement
      shouldRecommendListing = true;
      recommendedListingQuantity = currentQuantity;
    } else if (predictedRemainingAtHighUrgency > 0) {
      shouldRecommendListing = true;
      recommendedListingQuantity = Math.min(currentQuantity, Math.max(0, Math.round(predictedRemainingAtHighUrgency)));
    } else if (daysUntilHighUrgency === 0 && predictedDaysToSellRemaining !== null && predictedDaysToSellRemaining > (daysUntilExpiry ?? 0)) {
      shouldRecommendListing = true;
      recommendedListingQuantity = Math.min(currentQuantity, Math.max(0, Math.round(predictedRemainingAtHighUrgency)));
    }
  }

  // Explainable reason generation
  let reason = '';
  if (confidence === 'insufficient') {
    reason = `Add a few more days of sales data to receive a reliable stock prediction (currently ${validDaysCount} day${validDaysCount === 1 ? '' : 's'} recorded).`;
  } else if (!canListOnStockBridge && daysUntilExpiry !== null && daysUntilExpiry < MIN_EXPIRY_DAYS) {
    reason = `This batch has only ${daysUntilExpiry} days remaining until expiry. Less than ${MIN_EXPIRY_DAYS} days cannot be listed on StockBridge.`;
  } else if (averageDailySales === 0) {
    reason = `This product has recorded little or no recent movement (0 ${unit}/day) with ${daysUntilExpiry} days remaining until expiry. Consider listing excess stock on StockBridge.`;
  } else if (daysUntilHighUrgency > 0) {
    if (predictedRemainingAtHighUrgency > 0) {
      reason = `Your current stock is ${currentQuantity} ${unit} and your recent average sales are ${averageDailySales} ${unit}/day. In ${daysUntilHighUrgency} days this product will enter the High Urgency period. At the current sales rate, approximately ${Math.round(predictedRemainingAtHighUrgency)} ${unit} may still remain.`;
    } else {
      reason = `At your current sales rate of ${averageDailySales} ${unit}/day, this stock will comfortably sell out in approximately ${predictedDaysToSellRemaining} days, well before entering the High Urgency period in ${daysUntilHighUrgency} days.`;
    }
  } else {
    // Already in High Urgency
    if (recommendedListingQuantity > 0) {
      reason = `This product is currently in the High Urgency period (${daysUntilExpiry} days until expiry). At your current sales rate of ${averageDailySales} ${unit}/day, approximately ${recommendedListingQuantity} ${unit} are at risk of expiring unsold.`;
    } else {
      reason = `This product is in the High Urgency period (${daysUntilExpiry} days left), but at your current sales rate of ${averageDailySales} ${unit}/day, stock is projected to clear before expiry.`;
    }
  }

  return {
    currentQuantity,
    unit,
    historyDaysCount: validDaysCount,
    averageDailySales,
    daysUntilExpiry,
    daysUntilHighUrgency,
    predictedDaysToSellRemaining,
    predictedRemainingAtHighUrgency,
    recommendedListingQuantity,
    riskLevel,
    confidence,
    shouldRecommendListing,
    canListOnStockBridge,
    reason,
  };
}

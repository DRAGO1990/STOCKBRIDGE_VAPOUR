export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface CalculatedUrgency {
  urgency: UrgencyLevel;
  daysRemaining: number | null;
  label: string;
  badgeLabel: string;
  description: string;
  statusText: string;
}

export interface ExpiryValidationResult {
  valid: boolean;
  daysRemaining: number | null;
  error?: string;
}

/** Minimum number of days remaining before expiry required to list a product. */
export const MIN_LISTING_EXPIRY_DAYS = 11;
export const MIN_EXPIRY_DAYS = MIN_LISTING_EXPIRY_DAYS;

/** Upper bound of days remaining for HIGH urgency (11 to 25 days) */
export const HIGH_URGENCY_MAX_DAYS = 25;

/** Upper bound of days remaining for MEDIUM urgency (26 to 50 days) */
export const MEDIUM_URGENCY_MAX_DAYS = 50;

/**
 * Calculates the number of whole days remaining from today to the expiry date.
 */
export function calculateDaysRemaining(expiryDate: string | Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();

  const diffMs = startOfExpiry - startOfToday;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validates an expiry date against the minimum 11-day requirement.
 * Rejects: null/missing, invalid date, past dates, today, and < 11 days remaining.
 */
export function validateExpiryDate(expiryDate: string | Date | null | undefined): ExpiryValidationResult {
  if (!expiryDate) {
    return { valid: false, daysRemaining: null, error: 'Expiry date is required.' };
  }

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    return { valid: false, daysRemaining: null, error: 'Invalid expiry date.' };
  }

  const days = calculateDaysRemaining(expiryDate);

  if (days === null) {
    return { valid: false, daysRemaining: null, error: 'Invalid expiry date.' };
  }

  if (days < MIN_EXPIRY_DAYS) {
    return {
      valid: false,
      daysRemaining: days,
      error: 'This product cannot be listed because less than 11 days are remaining until expiry.',
    };
  }

  return { valid: true, daysRemaining: days };
}

/**
 * Calculates the Urgency Level based on remaining days until expiry.
 * This is fully deterministic and calculated dynamically from expiry date.
 *
 * Rules:
 * - 10–25 days remaining (effective 11–25 days since <11 is rejected) → HIGH
 * - 26–50 days remaining → MEDIUM
 * - More than 50 days (51+) → LOW
 */
export function calculateUrgency(expiryDate: string | Date | null | undefined): UrgencyLevel {
  const days = calculateDaysRemaining(expiryDate);
  if (days === null) return 'low';
  if (days <= HIGH_URGENCY_MAX_DAYS) return 'high';
  if (days <= MEDIUM_URGENCY_MAX_DAYS) return 'medium';
  return 'low';
}

/**
 * Calculates the full CalculatedUrgency object based on remaining days until expiry.
 */
export function calculateUrgencyFromExpiry(expiryDate: string | Date | null | undefined): CalculatedUrgency {
  const days = calculateDaysRemaining(expiryDate);

  if (days === null) {
    return {
      urgency: 'low',
      daysRemaining: null,
      label: 'LOW — Standard Pace',
      badgeLabel: 'LOW Urgency',
      description: 'Select an expiry date to calculate urgency',
      statusText: 'Select an expiry date to calculate urgency',
    };
  }

  if (days <= HIGH_URGENCY_MAX_DAYS) {
    return {
      urgency: 'high',
      daysRemaining: days,
      label: 'HIGH — Immediate Liquidation',
      badgeLabel: 'HIGH Urgency',
      description: 'Immediate clearance (11–25 days)',
      statusText: `${days} ${days === 1 ? 'day' : 'days'} remaining until expiry`,
    };
  }

  if (days <= MEDIUM_URGENCY_MAX_DAYS) {
    return {
      urgency: 'medium',
      daysRemaining: days,
      label: 'MEDIUM — Sell Soon',
      badgeLabel: 'MEDIUM Urgency',
      description: 'Liquidation window (26–50 days)',
      statusText: `${days} days remaining until expiry`,
    };
  }

  return {
    urgency: 'low',
    daysRemaining: days,
    label: 'LOW — Standard Pace',
    badgeLabel: 'LOW Urgency',
    description: 'Standard pace (51+ days)',
    statusText: `${days} days remaining until expiry`,
  };
}


/** Minimum number of days a listing must have remained unsold to qualify for auto-unlisting */
export const AUTO_UNLIST_MIN_AGE_DAYS = 15;
export const AUTO_UNLIST_MIN_LISTING_AGE_DAYS = AUTO_UNLIST_MIN_AGE_DAYS;

/** Remaining days threshold under which an unsold listing is auto-unlisted (< 11 days) */
export const AUTO_UNLIST_EXPIRY_THRESHOLD_DAYS = 11;

/**
 * Calculates the age of a listing in whole days from its creation timestamp (createdAt) to today.
 * Uses start-of-day normalized timestamps.
 */
export function getListingAgeInDays(createdAt: string | Date | null | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return 0;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();

  const diffMs = startOfToday - startOfCreated;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Shared alias for calculateDaysRemaining
 */
export const getDaysUntilExpiry = calculateDaysRemaining;

/**
 * Shared alias for calculateUrgencyFromExpiry
 */
export const calculateSuggestedUrgency = calculateUrgencyFromExpiry;

/**
 * Core business rule:
 * Qualifies for automatic unlisting ONLY IF:
 * 1. listingAgeInDays >= 15, AND
 * 2. daysUntilExpiry < 11, AND
 * 3. listing is still active and unsold
 */
export function shouldAutoUnlist(
  createdAt: string | Date | null | undefined,
  expiryDate: string | Date | null | undefined,
  status: string,
  active: boolean
): boolean {
  if (status !== 'active' || !active) return false;
  if (!expiryDate || !createdAt) return false;

  const ageInDays = getListingAgeInDays(createdAt);
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

  if (daysUntilExpiry === null) return false;

  return ageInDays >= AUTO_UNLIST_MIN_AGE_DAYS && daysUntilExpiry < AUTO_UNLIST_EXPIRY_THRESHOLD_DAYS;
}


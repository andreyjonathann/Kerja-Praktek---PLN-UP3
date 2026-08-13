/**
 * kpiHelpers.ts
 * Helper functions to handle corporate KPI calculations conforming to corporate Excel rules.
 */

export interface KPICalculationOptions {
  isReverse?: boolean; // true if lower is better (e.g. SAIDI/SAIFI)
  weight?: number;      // weight percentage (e.g. 0.1 for 10%)
}

/**
 * Calculates the raw/actual achievement percentage.
 * Avoids division by zero and handles reverse KPI.
 *
 * @param realisasi Real value
 * @param target Target value
 * @param isReverse Set true for lower-is-better KPIs
 */
export function calculateAchievement(
  realisasi: number | null | undefined,
  target: number | null | undefined,
  isReverse: boolean = false
): number {
  const r = realisasi ?? 0;
  const t = target ?? 0;

  // Handle division by zero
  if (t === 0) {
    return 0;
  }

  if (isReverse) {
    // Reverse KPI formula: 2 - (realisasi / target)
    // Example: Target = 5, Realisasi = 2.5 => Achievement = 2 - 0.5 = 1.5 (150% actual)
    // Target = 5, Realisasi = 10 => Achievement = 2 - 2.0 = 0 (0% actual)
    return 2 - (r / t);
  }

  // Standard KPI formula: realisasi / target
  return r / t;
}

/**
 * Calculates the capped KPI score (0% to 110%).
 * Conforms to corporate cap rules.
 *
 * @param realisasi Real value
 * @param target Target value
 * @param isReverse Set true for lower-is-better KPIs
 */
export function calculateKPI(
  realisasi: number | null | undefined,
  target: number | null | undefined,
  isReverse: boolean = false
): number {
  const ach = calculateAchievement(realisasi, target, isReverse);
  // Cap between 0% and 110% (0.0 to 1.1)
  return Math.min(Math.max(ach, 0), 1.1);
}

/**
 * Calculates the weighted KPI score.
 *
 * @param score Capped KPI score (0.0 - 1.1)
 * @param weight Weight of the KPI (0.0 - 1.0)
 */
export function calculateWeightedScore(score: number, weight: number): number {
  return score * weight;
}

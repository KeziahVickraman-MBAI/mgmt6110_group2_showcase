export interface WatchedSite {
  id: string;
  development: string;
  area: string;
  latitude: number;
  longitude: number;
}

export interface EvaluatedSite {
  id: string;
  development: string;
  area: string;
  agency?: string;
  lotType?: string;
  lotsAvailable: number;
  expectedRaw?: number;
  expectedAdjusted?: number;
  carsDiff?: number;
  absCarsDiff?: number;
  carsHeadline?: string;
  actionText?: string;
  direction?: "above" | "below" | "normal";
  latitude?: number;
  longitude?: number;
  observedOn?: string;
  rainFactor: number;
  nearestAreaName: string | null;
  nearestAreaForecast: string | null;
  distanceKm?: number;
  deviation: number;
  deviationPercent: number;
  deviationSignedStr: string;
  absDeviation: number;
  plainSentence: string;
  // Backward compatibility / optional
  totalLots?: number;
  actualLotsOccupied?: number;
  expectedLotsOccupied?: number;
  actualOccupancyRate?: number;
  expectedOccupancyRate?: number;
  baselineOccupancyRate?: number;
  deviationRaw?: number;
  deviationAdjusted?: number;
  isFull?: boolean;
}

export interface FlaggedDistance {
  distanceKm: number;
  isOneTrip: boolean;
  tripSummary: string;
  tripDescription: string;
  origin: string;
  destination: string;
}

export interface MissingSite {
  id: string;
  development: string;
  area?: string;
  status: string;
}

export interface CorruptedSite {
  id: string;
  development: string;
  area?: string;
  lotsAvailable: number | null;
  lotType?: string;
  status: string;
  reason?: string;
}

export interface LotTypeEvaluation {
  lotType: "C" | "Y" | "H";
  evaluatedSites: EvaluatedSite[];
  missingSites: MissingSite[];
  corruptedSites: CorruptedSite[];
  omittedDueToNoBaseline: Array<{ id: string; development: string; area?: string; reason: string; lotsAvailable?: number | null }>;
  flaggedExceptions: EvaluatedSite[];
  quietList: EvaluatedSite[];
  topAbove: EvaluatedSite | null;
  topBelow: EvaluatedSite | null;
  isAllWithinThreshold: boolean;
  isMiscalibrated: boolean;
  miscalibrationReason: string | null;
  over100Count: number;
  evaluatedCount: number;
  totalWatchedCount: number;
  decisionHeadline: string;
  decisionSubtext: string;
}

export interface CarparkDirectoryRecord {
  carParkId: string;
  development: string;
  area: string;
  agency: string;
  lotType: string;
  availableLots: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DeviationsResponse {
  readingTimestamp: string;
  minutesOld: number;
  isStale: boolean;
  cacheAge: number;
  timeContext: {
    dayType: "weekday" | "saturday" | "sunday";
    hour: number;
    weekdayName: string;
    period: string;
    timeLabel: string;
  };
  pagesFetched?: number;
  totalRecords?: number;
  recordsByLotType?: { C?: number; Y?: number; H?: number; [k: string]: number | undefined };
  isPartial?: boolean;
  partialMessage?: string | null;
  ionOrchardFound?: boolean;
  selectedLotType?: "C" | "Y" | "H";
  evaluatedByLotType?: {
    C: LotTypeEvaluation;
    Y: LotTypeEvaluation;
    H: LotTypeEvaluation;
  };
  allRecords?: Array<{
    carParkId: string;
    development: string;
    area: string;
    agency: string;
    lotType: string;
    availableLots: number | null;
    latitude: number | null;
    longitude: number | null;
  }>;
  // Active evaluation fields
  lotType?: "C" | "Y" | "H";
  evaluatedSites?: EvaluatedSite[];
  decisionHeadline?: string;
  decisionSubtext?: string;
  topAbove?: EvaluatedSite | null;
  topBelow?: EvaluatedSite | null;
  flaggedDistance?: FlaggedDistance | null;
  isAllWithinThreshold: boolean;
  isMiscalibrated?: boolean;
  miscalibrationReason?: string | null;
  over100Count?: number;
  totalWatchedCount: number;
  evaluatedCount: number;
  flaggedExceptions: EvaluatedSite[];
  quietList: EvaluatedSite[];
  missingSites: MissingSite[];
  corruptedSites?: CorruptedSite[];
  omittedDueToNoBaseline: Array<{ id: string; development: string; area?: string; reason: string; lotsAvailable?: number | null }>;
  weather: {
    degraded: boolean;
    reason: string;
    unmatchedForecastStrings: string[];
  };
  lastGoodReadingTimestamp: string | null;
  error?: string;
  isRefused?: boolean;
  isUnreachable?: boolean;
}

export type BoardState = "loading" | "empty" | "flagged" | "rain-adjusted" | "stale" | "refused" | "unreachable" | "miscalibrated";
export type NotifyState = "idle" | "submitting" | "sent" | "rejected" | "unreachable";
export type VehicleType = "C" | "Y" | "H";

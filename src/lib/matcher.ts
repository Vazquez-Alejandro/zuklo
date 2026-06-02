import type { ParsedProperty } from "./parser";
import type { UserFilter } from "./filters";

export interface MatchResult {
  filterId: string;
  filterName: string;
  propertyId: string;
  matched: boolean;
  score: number;
  reasons: string[];
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function matchPriceRange(
  price: number,
  filter: UserFilter
): { matched: boolean; score: number } {
  const { min, max } = filter.priceRange;
  if (min !== null && price < min) return { matched: false, score: 0 };
  if (max !== null && price > max) return { matched: false, score: 0 };

  let score = 1;
  if (min !== null && max !== null) {
    const range = max - min;
    const mid = (max + min) / 2;
    const dist = Math.abs(price - mid) / (range / 2);
    score = 1 - dist * 0.3;
  }
  return { matched: true, score };
}

function matchExpenses(
  expenses: number,
  filter: UserFilter
): { matched: boolean; score: number } {
  const { max } = filter.expensesRange;
  if (max !== null && expenses > max) return { matched: false, score: 0 };
  return { matched: true, score: 1 };
}

function matchLocation(
  property: ParsedProperty,
  filter: UserFilter
): { matched: boolean; score: number } {
  const { cities, states, country, radiusKm, centerLat, centerLng } =
    filter.location;

  if (country && property.location.country !== country) {
    return { matched: false, score: 0 };
  }

  if (cities.length > 0) {
    const cityMatch = cities.some(
      (c) =>
        property.location.city.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(property.location.city.toLowerCase())
    );
    if (!cityMatch) return { matched: false, score: 0 };
  }

  if (states.length > 0) {
    const stateMatch = states.some(
      (s) =>
        property.location.state.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(property.location.state.toLowerCase())
    );
    if (!stateMatch) return { matched: false, score: 0 };
  }

  if (
    radiusKm &&
    centerLat !== null &&
    centerLng !== null &&
    property.location.lat !== null &&
    property.location.lng !== null
  ) {
    const dist = haversineDistance(
      centerLat,
      centerLng,
      property.location.lat,
      property.location.lng
    );
    if (dist > radiusKm) return { matched: false, score: 0 };
    return { matched: true, score: 1 - dist / radiusKm };
  }

  return { matched: true, score: 0.8 };
}

function matchFeatures(
  property: ParsedProperty,
  filter: UserFilter
): { matched: boolean; score: number } {
  const f = filter.features;
  let score = 0;
  let checks = 0;

  if (f.minBedrooms !== null) {
    checks++;
    if (property.features.bedrooms < f.minBedrooms)
      return { matched: false, score: 0 };
    score++;
  }
  if (f.maxBedrooms !== null) {
    checks++;
    if (property.features.bedrooms > f.maxBedrooms)
      return { matched: false, score: 0 };
    score++;
  }
  if (f.minBathrooms !== null) {
    checks++;
    if (property.features.bathrooms < f.minBathrooms)
      return { matched: false, score: 0 };
    score++;
  }
  if (f.maxBathrooms !== null) {
    checks++;
    if (property.features.bathrooms > f.maxBathrooms)
      return { matched: false, score: 0 };
    score++;
  }
  if (f.minArea !== null) {
    checks++;
    if (property.features.area < f.minArea) return { matched: false, score: 0 };
    score++;
  }
  if (f.maxArea !== null) {
    checks++;
    if (property.features.area > f.maxArea) return { matched: false, score: 0 };
    score++;
  }
  if (f.minParkingSpaces !== null) {
    checks++;
    if (property.features.parkingSpaces < f.minParkingSpaces)
      return { matched: false, score: 0 };
    score++;
  }

  return {
    matched: true,
    score: checks > 0 ? score / checks : 1,
  };
}

function matchRestrictions(
  property: ParsedProperty,
  filter: UserFilter
): { matched: boolean; score: number } {
  const r = filter.restrictions;

  if (r.petFriendly === true && property.restrictions.petFriendly === false) {
    return { matched: false, score: 0 };
  }

  if (r.furnished === true && property.restrictions.furnished === false) {
    return { matched: false, score: 0 };
  }

  if (
    r.minContractMonths !== null &&
    property.restrictions.minContractMonths !== null &&
    property.restrictions.minContractMonths > r.minContractMonths
  ) {
    return { matched: false, score: 0 };
  }

  return { matched: true, score: 1 };
}

function matchPortals(
  property: ParsedProperty,
  filter: UserFilter
): { matched: boolean; score: number } {
  if (filter.portals.length === 0) return { matched: true, score: 1 };
  if (filter.portals.includes(property.portal)) {
    return { matched: true, score: 1 };
  }
  return { matched: false, score: 0 };
}

function matchKeywords(
  property: ParsedProperty,
  filter: UserFilter
): { matched: boolean; score: number } {
  const text = `${property.title} ${property.description} ${property.amenities.join(" ")}`.toLowerCase();

  if (filter.excludeKeywords.length > 0) {
    const hasExcluded = filter.excludeKeywords.some((kw) =>
      text.includes(kw.toLowerCase())
    );
    if (hasExcluded) return { matched: false, score: 0 };
  }

  if (filter.keywords.length === 0) return { matched: true, score: 1 };

  const matchedKw = filter.keywords.filter((kw) =>
    text.includes(kw.toLowerCase())
  );
  if (matchedKw.length === 0) return { matched: false, score: 0 };

  return {
    matched: true,
    score: matchedKw.length / filter.keywords.length,
  };
}

export function matchProperty(
  property: ParsedProperty,
  filter: UserFilter
): MatchResult {
  const reasons: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  const price = matchPriceRange(property.price, filter);
  if (!price.matched) {
    reasons.push("Price out of range");
  } else {
    totalScore += price.score * 3;
    totalWeight += 3;
  }

  const expenses = matchExpenses(property.expenses, filter);
  if (!expenses.matched) {
    reasons.push("Expenses too high");
  } else {
    totalScore += expenses.score;
    totalWeight += 1;
  }

  const location = matchLocation(property, filter);
  if (!location.matched) {
    reasons.push("Location doesn't match");
  } else {
    totalScore += location.score * 3;
    totalWeight += 3;
  }

  const features = matchFeatures(property, filter);
  if (!features.matched) {
    reasons.push("Features don't match");
  } else {
    totalScore += features.score * 2;
    totalWeight += 2;
  }

  const restrictions = matchRestrictions(property, filter);
  if (!restrictions.matched) {
    reasons.push("Restrictions don't match");
  } else {
    totalScore += restrictions.score;
    totalWeight += 1;
  }

  const portals = matchPortals(property, filter);
  if (!portals.matched) {
    reasons.push("Portal not in list");
  } else {
    totalScore += portals.score;
    totalWeight += 1;
  }

  const keywords = matchKeywords(property, filter);
  if (!keywords.matched) {
    reasons.push("Keywords don't match");
  } else {
    totalScore += keywords.score;
    totalWeight += 1;
  }

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const matched = reasons.length === 0;

  return {
    filterId: filter.id,
    filterName: filter.name,
    propertyId: property.id,
    matched,
    score: finalScore,
    reasons,
  };
}

export function matchPropertyAgainstAllFilters(
  property: ParsedProperty,
  filters: UserFilter[]
): MatchResult[] {
  return filters
    .filter((f) => f.isActive && f.notification.enabled)
    .map((filter) => matchProperty(property, filter))
    .filter((result) => result.matched);
}

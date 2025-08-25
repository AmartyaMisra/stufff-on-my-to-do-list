// Utility functions for aviation conversions

export function metersToFeet(meters) {
  if (meters === null || meters === undefined) return null;
  return meters * 3.28084;
}

export function msToKmh(mps) {
  if (mps === null || mps === undefined) return null;
  return mps * 3.6;
}

export function getCardinalDirection(degrees) {
  if (degrees === null || degrees === undefined) return '';
  
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function knotsToKmh(knots) {
  if (knots === null || knots === undefined) return null;
  return knots * 1.852;
}

export function feetToMeters(feet) {
  if (feet === null || feet === undefined) return null;
  return feet * 0.3048;
}

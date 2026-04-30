/**
 * Formats a distance value with appropriate units
 * @param distance The distance value as a string
 * @returns Formatted distance string with units
 */
export const formatDistance = (distance: string): string => {
  if (!distance) return "-";
  
  const distanceNum = parseFloat(distance);
  if (isNaN(distanceNum)) return distance;
  
  // If it's less than 1km, show in meters
  if (distanceNum < 1) {
    return `${(distanceNum * 1000).toFixed(0)}m`;
  }
  
  // Otherwise show in kilometers with 1 decimal place
  return `${distanceNum.toFixed(1)}km`;
};

/**
 * Formats a temperature value with appropriate units
 * @param temperature The temperature value as a string
 * @returns Formatted temperature string with units
 */
export const formatTemperature = (temperature: string): string => {
  if (!temperature) return "-";
  
  const tempNum = parseFloat(temperature);
  if (isNaN(tempNum)) return temperature;
  
  // Return with degree symbol
  return `${tempNum.toFixed(1)}°C`;
}; 
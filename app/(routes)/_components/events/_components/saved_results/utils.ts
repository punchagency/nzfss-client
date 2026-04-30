/**
 * Formats a distance value to a human-readable string
 * @param distance - The distance value to format
 * @returns A formatted string representing the distance
 */
export const formatDistance = (distance: string): string => {
  if (!distance) return "-";
  const distanceNum = parseFloat(distance);
  if (isNaN(distanceNum)) return distance;
  return distanceNum < 1 
    ? `${(distanceNum * 1000).toFixed(0)}m` 
    : `${distanceNum.toFixed(1)}km`;
};

/**
 * Safely accesses localStorage with error handling
 * @param key - The key to retrieve from localStorage
 * @returns The value from localStorage or null if not found/error
 */
export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null;
  }
};

/**
 * Safely sets a value in localStorage with error handling
 * @param key - The key to set in localStorage
 * @param value - The value to store
 */
export const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("Error setting localStorage:", error);
  }
};

/**
 * Formats a date string to a localized format
 * @param dateString - The date string to format
 * @returns A formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}; 
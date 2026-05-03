/**
 * Format a number to display with up to 2 decimal places
 * Removes trailing zeros and unnecessary decimal points
 * @param value - The number to format
 * @returns Formatted string representation
 */
export function formatNumber(value: number): string {
  return parseFloat(value.toFixed(2)).toString();
}

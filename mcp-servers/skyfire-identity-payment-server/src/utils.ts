export function getEpochPlus24Hours() {
  const now = Date.now(); // Get current time in milliseconds since epoch
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // Convert 24 hours to milliseconds
  const futureTimeInMs = now + twentyFourHoursInMs; // Add 24 hours
  const futureEpochInSeconds = Math.floor(futureTimeInMs / 1000); // Convert to seconds and floor
  return futureEpochInSeconds;
}
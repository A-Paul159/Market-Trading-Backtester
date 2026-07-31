const NEW_YORK_TIME_OFFSET = "-04:00";

export function parseCandleTime(timestamp: string) {
  if (timestamp.endsWith("Z")) {
    return new Date(timestamp);
  }

  if (timestamp.includes("-04:00") || timestamp.includes("-05:00")) {
    return new Date(timestamp);
  }

  return new Date(`${timestamp}${NEW_YORK_TIME_OFFSET}`);
}
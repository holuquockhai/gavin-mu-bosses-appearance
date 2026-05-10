const timezonePattern = /([zZ]|[+-]\d{2}:?\d{2})$/;

export const getUserTimeZone = () => (
  Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
);

export const parseApiDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  const valueString = String(value);
  const hasTimezone = timezonePattern.test(valueString);
  const date = new Date(hasTimezone ? valueString : `${valueString}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const getApiDateTime = (value, fallback = Date.now()) => (
  parseApiDate(value)?.getTime() ?? fallback
);

export const formatUserDateTime = (value, options = {}) => {
  const date = parseApiDate(value);

  if (!date) {
    return "";
  }

  const usesDateTimeStyle = options.dateStyle || options.timeStyle;
  const defaultOptions = usesDateTimeStyle ? {} : {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: getUserTimeZone(),
    ...defaultOptions,
    ...options,
  }).format(date);
};

export const formatUserDate = (value, options = {}) => {
  const date = parseApiDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: getUserTimeZone(),
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
};

export const formatUserTimeDate = (value) => {
  const date = parseApiDate(value);

  if (!date) {
    return "";
  }

  const timeText = new Intl.DateTimeFormat("en-AU", {
    timeZone: getUserTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const dateText = new Intl.DateTimeFormat("en-AU", {
    timeZone: getUserTimeZone(),
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  return `${timeText}, ${dateText}`;
};

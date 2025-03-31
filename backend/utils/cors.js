const parseAllowedOrigins = (value) => {
  if (!value) return [];

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;

  return allowedOrigins.includes(origin);
};


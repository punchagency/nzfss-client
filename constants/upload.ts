const DEFAULT_YEARBOOK_MAX_FILE_SIZE_MB = 20;
const configuredLimit = Number(process.env.NEXT_PUBLIC_YEARBOOK_MAX_SIZE_MB);

export const YEARBOOK_MAX_FILE_SIZE_MB =
  Number.isFinite(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : DEFAULT_YEARBOOK_MAX_FILE_SIZE_MB;
export const YEARBOOK_MAX_FILE_SIZE_BYTES = YEARBOOK_MAX_FILE_SIZE_MB * 1024 * 1024;

//
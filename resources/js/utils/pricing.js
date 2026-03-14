const STORE_LOCALE = "es-ES";
const STORE_CURRENCY = "USD";

const defaultCurrencyFormatter = new Intl.NumberFormat(STORE_LOCALE, {
  style: "currency",
  currency: STORE_CURRENCY,
  maximumFractionDigits: 2,
});

export const normalizePrice = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const sanitized = String(value).trim().replace(/[^\d,.-]/g, "");
  const normalized = sanitized.replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value) => defaultCurrencyFormatter.format(normalizePrice(value));

export { STORE_CURRENCY, STORE_LOCALE };
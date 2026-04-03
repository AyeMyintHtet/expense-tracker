import { STORAGE_KEYS } from './security';

export const DEFAULT_CURRENCY = 'USD';

const FALLBACK_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD', 'INR', 'THB'];

const formatterCache = new Map();
const currencyOptionCache = new Map();

const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getSupportedCurrencyCodes = () => {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('currency');
    } catch {
      return FALLBACK_CODES;
    }
  }
  return FALLBACK_CODES;
};

const supportedCurrencyCodes = getSupportedCurrencyCodes();
const supportedCurrencySet = new Set(supportedCurrencyCodes);

const normalizeCurrencyCode = (currencyCode) => {
  const normalized = String(currencyCode ?? '').trim().toUpperCase();
  if (supportedCurrencySet.has(normalized)) return normalized;
  return DEFAULT_CURRENCY;
};

const buildFormatterKey = (currencyCode, options) => {
  const locale = options.locale || 'en-US';
  const signDisplay = options.signDisplay || 'auto';
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;

  return `${currencyCode}|${locale}|${signDisplay}|${minimumFractionDigits}|${maximumFractionDigits}`;
};

const getFormatter = (currencyCode, options = {}) => {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode);
  const locale = options.locale || 'en-US';
  const signDisplay = options.signDisplay || 'auto';
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  const key = buildFormatterKey(normalizedCurrency, options);

  if (formatterCache.has(key)) {
    return formatterCache.get(key);
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    signDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  formatterCache.set(key, formatter);
  return formatter;
};

export const getStoredCurrency = () => {
  if (!hasLocalStorage()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEYS.currency);
  if (!raw) return null;

  const normalized = raw.trim().toUpperCase();
  if (!supportedCurrencySet.has(normalized)) return null;
  return normalized;
};

export const setStoredCurrency = (currencyCode) => {
  const normalized = normalizeCurrencyCode(currencyCode);
  if (hasLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEYS.currency, normalized);
  }
  return normalized;
};

export const formatCurrency = (amount, currencyCode, options = {}) => {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return getFormatter(currencyCode, options).format(safeAmount);
};

export const getCurrencySymbol = (currencyCode, locale = 'en-US') => {
  const parts = getFormatter(currencyCode, {
    locale,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value || normalizeCurrencyCode(currencyCode);
};

export const getCurrencyOptions = (locale = 'en-US') => {
  if (currencyOptionCache.has(locale)) {
    return currencyOptionCache.get(locale);
  }

  const displayNames =
    typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames([locale], { type: 'currency' })
      : null;

  const options = supportedCurrencyCodes.map((code) => {
    const name = displayNames?.of(code) || code;
    const symbol = getCurrencySymbol(code, locale);
    return {
      code,
      name,
      symbol,
      label: `${code} - ${name} (${symbol})`,
    };
  });

  currencyOptionCache.set(locale, options);
  return options;
};

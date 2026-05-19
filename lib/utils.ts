import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyMap: Record<string, { code: string; locale: string; decimals: number }> = {
  UG: { code: "UGX", locale: "en-UG", decimals: 0 },
  TZ: { code: "TZS", locale: "en-TZ", decimals: 0 },
  KE: { code: "KES", locale: "en-KE", decimals: 2 },
  CD: { code: "CDF", locale: "fr-CD", decimals: 2 },
};

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, countryCode: string): string {
  const config = currencyMap[countryCode] ?? currencyMap["UG"];
  const cacheKey = `${config.code}:${config.locale}`;
  if (!currencyFormatterCache.has(cacheKey)) {
    currencyFormatterCache.set(
      cacheKey,
      new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      })
    );
  }
  return currencyFormatterCache.get(cacheKey)!.format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.slice(0, length) + "…" : text;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mobileLineCountry: Record<string, string> = {
  MTN_UG: "UG",
  AIRTEL_UG: "UG",
  VODACOM_TZ: "TZ",
  TIGO_TZ: "TZ",
  SAFARICOM_KE: "KE",
  AIRTEL_KE: "KE",
  ORANGE_CD: "CD",
  VODACOM_CD: "CD",
  AIRTEL_CD: "CD",
};

export const mobileLineLabel: Record<string, string> = {
  MTN_UG: "MTN Uganda",
  AIRTEL_UG: "Airtel Uganda",
  VODACOM_TZ: "Vodacom Tanzania",
  TIGO_TZ: "Tigo Tanzania",
  SAFARICOM_KE: "Safaricom M-Pesa",
  AIRTEL_KE: "Airtel Kenya",
  ORANGE_CD: "Orange Congo",
  VODACOM_CD: "Vodacom Congo",
  AIRTEL_CD: "Airtel Congo",
};

export * from "./currency.js";
export * from "./strings.js";

export const REGIONS_META = [
  { code: "us", name: "United States", currency: "USD", currencySymbol: "$", flagEmoji: "🇺🇸", storeLocale: "en-us" },
  { code: "sg", name: "Singapore", currency: "SGD", currencySymbol: "S$", flagEmoji: "🇸🇬", storeLocale: "en-sg" },
  { code: "hk", name: "Hong Kong", currency: "HKD", currencySymbol: "HK$", flagEmoji: "🇭🇰", storeLocale: "en-hk" },
  { code: "tr", name: "Turkey", currency: "TRY", currencySymbol: "₺", flagEmoji: "🇹🇷", storeLocale: "tr-tr" },
] as const;

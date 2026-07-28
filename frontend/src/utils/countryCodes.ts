export interface CountryCodeItem {
  code: string;
  country: string;
  flag: string;
  maxDigits: number;
}

export const COUNTRY_CODES: CountryCodeItem[] = [
  { code: "+91", country: "India", flag: "🇮🇳", maxDigits: 10 },
  { code: "+1", country: "United States", flag: "🇺🇸", maxDigits: 10 },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", maxDigits: 10 },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪", maxDigits: 9 },
  { code: "+1", country: "Canada", flag: "🇨🇦", maxDigits: 10 },
  { code: "+61", country: "Australia", flag: "🇦🇺", maxDigits: 9 },
  { code: "+65", country: "Singapore", flag: "🇸🇬", maxDigits: 8 },
  { code: "+49", country: "Germany", flag: "🇩🇪", maxDigits: 11 },
  { code: "+33", country: "France", flag: "🇫🇷", maxDigits: 9 },
  { code: "+81", country: "Japan", flag: "🇯🇵", maxDigits: 10 },
  { code: "+977", country: "Nepal", flag: "🇳🇵", maxDigits: 10 },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩", maxDigits: 10 },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰", maxDigits: 9 },
  { code: "+92", country: "Pakistan", flag: "🇵🇰", maxDigits: 10 },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", maxDigits: 9 },
  { code: "+974", country: "Qatar", flag: "🇶🇦", maxDigits: 8 },
  { code: "+968", country: "Oman", flag: "🇴🇲", maxDigits: 8 },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", maxDigits: 8 },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", maxDigits: 10 },
  { code: "+86", country: "China", flag: "🇨🇳", maxDigits: 11 },
  { code: "+82", country: "South Korea", flag: "🇰🇷", maxDigits: 10 },
  { code: "+39", country: "Italy", flag: "🇮🇹", maxDigits: 10 },
  { code: "+34", country: "Spain", flag: "🇪🇸", maxDigits: 9 },
  { code: "+7", country: "Russia", flag: "🇷🇺", maxDigits: 10 },
  { code: "+55", country: "Brazil", flag: "🇧🇷", maxDigits: 11 },
  { code: "+27", country: "South Africa", flag: "🇿🇦", maxDigits: 9 },
];

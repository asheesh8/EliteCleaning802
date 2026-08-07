/**
 * Brand identity, in one place.
 *
 * The client has two Facebook pages under similar names — "Elite Cleaning
 * 802" (Rutland, plum/cream mark) and "Elite Cleaning LLC" (Burlington,
 * navy/gold Rosie mark). Everything visual keys off this object, so
 * switching identities is a one-line change here plus swapping the logo
 * file in /public. Contact details are overridden at runtime by the
 * Settings table — see `getSiteSettings()`.
 */

export const brand = {
  name: "Elite Cleaning 802",
  shortName: "Elite 802",
  legalName: "Elite Cleaning 802 LLC",
  tagline: "Vermont clean, done right.",
  owners: ["Laura", "Lisa"],

  logo: "/brand/logo.jpg",
  logoAlt: "/brand/logo-alt.jpg",

  city: "Rutland",
  state: "VT",
  serviceArea: "Rutland County and central Vermont",

  facebook: "https://www.facebook.com/EliteCleaningLLCVT/",

  // Defaults only. The Settings table wins wherever it has a value.
  phone: "(802) 417-4764",
  email: "elitecleaning802@gmail.com",
} as const;

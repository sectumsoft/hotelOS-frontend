// ─────────────────────────────────────────────────────────────────────────────
//  DEFAULT (committed): `npm start` / `ng serve` points at the hosted QA API.
//  The deployed QA build swaps in environment.qa.ts (angular.json → "qa");
//  the deployed Production build swaps in environment.prod.ts.
// ─────────────────────────────────────────────────────────────────────────────
export const environment = {
  production: false,
  apiUrl: 'https://hotelos-api-qa.onrender.com/api',
  appName: 'HotelOS'
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOCAL BACKEND: to develop against an API running on your machine, comment
//  out the block ABOVE and uncomment the block BELOW. Re-comment it before you
//  commit / push. (Leaving both active is a compile error — on purpose.)
// ─────────────────────────────────────────────────────────────────────────────
// export const environment = {
//   production: false,
//   apiUrl: 'https://localhost:62481/api',
//   appName: 'HotelOS'
// };

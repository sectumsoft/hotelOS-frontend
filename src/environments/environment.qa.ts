// Used by the deployed QA build only (ng build --configuration qa).
// If Render gives the API a different hostname, update apiUrl here.
export const environment = {
  production: true,
  apiUrl: 'https://hotelos-api-qa.onrender.com/api',
  appName: 'HotelOS'
};

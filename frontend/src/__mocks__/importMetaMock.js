// Mock for import.meta (or import.meta.env) so that tests do not fail with SyntaxError
module.exports = {
  env: {
    REACT_APP_API_BASE_URL: 'http://localhost:3001/api',
    REACT_APP_HOTEL_CONFIG_ID: 'mock-hotel-1',
  },
}; 
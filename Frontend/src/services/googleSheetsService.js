import Papa from 'papaparse';

/**
 * Fetches data from a published Google Sheets CSV URL
 * @param {string} csvUrl The URL of the published CSV
 * @returns {Promise<Array>} The parsed data as an array of objects
 */
export const fetchSpreadsheetData = (csvUrl) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

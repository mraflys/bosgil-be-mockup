/**
 * Date formatting utilities
 */

/**
 * Convert DD/MM/YYYY to DD-MM-YYYY for storage
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {string} - Date in DD-MM-YYYY format
 */
function convertToStorageFormat(dateString) {
  return dateString.replace(/\//g, "-");
}

/**
 * Convert DD-MM-YYYY to DD/MM/YYYY for display
 * @param {string} dateString - Date in DD-MM-YYYY format
 * @returns {string} - Date in DD/MM/YYYY format
 */
function convertToDisplayFormat(dateString) {
  return dateString.replace(/-/g, "/");
}

/**
 * Get current timestamp in ISO format
 * @returns {string} - Current timestamp in ISO format
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Parse date range filter supporting multiple formats
 * @param {string} dateString - Date string to parse
 * @returns {Date} - Parsed Date object
 */
function parseFilterDate(dateString) {
  let dateObj;

  if (dateString.includes("/")) {
    // DD/MM/YYYY format
    const [day, month, year] = dateString.split("/");
    dateObj = new Date(`${year}-${month}-${day}`);
  } else if (dateString.includes("-")) {
    // DD-MM-YYYY format
    const [day, month, year] = dateString.split("-");
    dateObj = new Date(`${year}-${month}-${day}`);
  } else {
    // ddmmyyyy format
    const day = dateString.substring(0, 2);
    const month = dateString.substring(2, 4);
    const year = dateString.substring(4, 8);
    dateObj = new Date(`${year}-${month}-${day}`);
  }

  return dateObj;
}

/**
 * Format date to DD/MM/YYYY for API responses
 * @param {string} isoDateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDateForResponse(isoDateString) {
  return new Date(isoDateString).toLocaleDateString("en-GB");
}

module.exports = {
  convertToStorageFormat,
  convertToDisplayFormat,
  getCurrentTimestamp,
  parseFilterDate,
  formatDateForResponse,
};

/**
 * Validation utilities for common validation tasks
 */

/**
 * Validate date format (DD/MM/YYYY)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDateFormat(dateString) {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  return dateRegex.test(dateString);
}

/**
 * Validate required fields
 * @param {object} data - Object containing the data to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} - {isValid: boolean, missingFields: array}
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter((field) => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate positive number
 * @param {*} value - Value to validate
 * @returns {boolean} - True if valid positive number, false otherwise
 */
function validatePositiveNumber(value) {
  return typeof value === "number" && value > 0;
}

/**
 * Validate transaction types for omzet
 * @param {string} transactionType - Transaction type to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateOmzetTransactionType(transactionType) {
  return ["Pemasukan", "Pengeluaran"].includes(transactionType);
}

/**
 * Validate transaction types for pengeluaran
 * @param {string} transactionType - Transaction type to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePengeluaranTransactionType(transactionType) {
  return ["Operasional", "Bahan Baku"].includes(transactionType);
}

/**
 * Validate file structure
 * @param {object} file - File object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateFileStructure(file) {
  return file && file.filename && file.original_name;
}

module.exports = {
  validateDateFormat,
  validateRequiredFields,
  validatePositiveNumber,
  validateOmzetTransactionType,
  validatePengeluaranTransactionType,
  validateFileStructure,
};

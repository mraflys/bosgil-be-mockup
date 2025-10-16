/**
 * Response formatting utilities
 */

/**
 * Create success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
function successResponse(data, message = "Success") {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
function errorResponse(message, statusCode = 400) {
  return {
    success: false,
    message,
    statusCode,
  };
}

/**
 * Create validation error response
 * @param {Array|string} errors - Validation errors
 * @returns {Object} - Formatted validation error response
 */
function validationErrorResponse(errors) {
  return {
    success: false,
    message: "Validation error",
    errors: Array.isArray(errors) ? errors : [errors],
    statusCode: 400,
  };
}

/**
 * Create not found response
 * @param {string} resource - Resource name
 * @returns {Object} - Formatted not found response
 */
function notFoundResponse(resource = "Data") {
  return {
    success: false,
    message: `${resource} not found`,
    statusCode: 404,
  };
}

/**
 * Create pagination response
 * @param {Array} data - Response data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Formatted pagination response
 */
function paginationResponse(data, page, limit, total) {
  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  paginationResponse,
};

const { v4: uuidv4 } = require("uuid");

/**
 * File processing utilities
 */

/**
 * Generate file metadata
 * @param {Object} file - File object
 * @returns {Object} - File metadata
 */
function generateFileMetadata(file) {
  return {
    id: uuidv4(),
    filename: file.filename || `file_${Date.now()}`,
    original_name: file.originalname || file.filename,
    size: file.size || 0,
    mime_type: file.mimetype || "application/octet-stream",
    uploaded_at: new Date().toISOString(),
  };
}

/**
 * Process multiple files
 * @param {Array} files - Array of file objects
 * @returns {Array} - Array of file metadata
 */
function processMultipleFiles(files) {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map((file) => generateFileMetadata(file));
}

/**
 * Format file for response
 * @param {Object} fileData - File data from storage
 * @returns {Object} - Formatted file data
 */
function formatFileForResponse(fileData) {
  return {
    id: fileData.id,
    filename: fileData.filename,
    original_name: fileData.original_name,
    size: fileData.size,
    mime_type: fileData.mime_type,
    uploaded_at: fileData.uploaded_at,
  };
}

/**
 * Find file by ID in files array
 * @param {Array} files - Array of files
 * @param {string} fileId - File ID to find
 * @returns {Object|null} - Found file or null
 */
function findFileById(files, fileId) {
  if (!files || !Array.isArray(files)) {
    return null;
  }

  return files.find((file) => file.id === fileId) || null;
}

/**
 * Remove file from files array
 * @param {Array} files - Array of files
 * @param {string} fileId - File ID to remove
 * @returns {Array} - Updated files array
 */
function removeFileById(files, fileId) {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.filter((file) => file.id !== fileId);
}

/**
 * Validate file array structure
 * @param {Array} files - Files array to validate
 * @returns {boolean} - True if valid
 */
function validateFilesArray(files) {
  if (!Array.isArray(files)) {
    return false;
  }

  return files.every(
    (file) =>
      file &&
      typeof file === "object" &&
      file.id &&
      file.filename &&
      file.original_name
  );
}

module.exports = {
  generateFileMetadata,
  processMultipleFiles,
  formatFileForResponse,
  findFileById,
  removeFileById,
  validateFilesArray,
};

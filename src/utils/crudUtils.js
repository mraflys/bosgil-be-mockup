const { v4: uuidv4 } = require('uuid');
const { getCurrentTimestamp } = require('./dateUtils');

/**
 * CRUD operation utilities
 */

/**
 * Generate new entity with common fields
 * @param {Object} data - Entity data
 * @param {Object} options - Options for generation
 * @returns {Object} - Generated entity
 */
function generateNewEntity(data, options = {}) {
  const timestamp = getCurrentTimestamp();
  
  return {
    id: uuidv4(),
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
    ...options.additionalFields
  };
}

/**
 * Update entity with updated_at timestamp
 * @param {Object} existingEntity - Existing entity
 * @param {Object} updateData - Update data
 * @returns {Object} - Updated entity
 */
function updateEntity(existingEntity, updateData) {
  return {
    ...existingEntity,
    ...updateData,
    updated_at: getCurrentTimestamp()
  };
}

/**
 * Find entity by ID in array
 * @param {Array} entities - Array of entities
 * @param {string} id - Entity ID
 * @returns {Object|null} - Found entity or null
 */
function findEntityById(entities, id) {
  if (!entities || !Array.isArray(entities)) {
    return null;
  }
  
  return entities.find(entity => entity.id === id) || null;
}

/**
 * Find entity index by ID in array
 * @param {Array} entities - Array of entities
 * @param {string} id - Entity ID
 * @returns {number} - Entity index or -1 if not found
 */
function findEntityIndexById(entities, id) {
  if (!entities || !Array.isArray(entities)) {
    return -1;
  }
  
  return entities.findIndex(entity => entity.id === id);
}

/**
 * Remove entity by ID from array
 * @param {Array} entities - Array of entities
 * @param {string} id - Entity ID
 * @returns {Array} - Updated entities array
 */
function removeEntityById(entities, id) {
  if (!entities || !Array.isArray(entities)) {
    return [];
  }
  
  return entities.filter(entity => entity.id !== id);
}

/**
 * Apply pagination to array
 * @param {Array} data - Data array
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated result with data and metadata
 */
function applyPagination(data, page = 1, limit = 10) {
  const pageNum = Math.max(1, Number.parseInt(page) || 1);
  const limitNum = Math.max(1, Number.parseInt(limit) || 10);
  const offset = (pageNum - 1) * limitNum;
  
  const paginatedData = data.slice(offset, offset + limitNum);
  
  return {
    data: paginatedData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: data.length,
      totalPages: Math.ceil(data.length / limitNum),
      hasNext: pageNum < Math.ceil(data.length / limitNum),
      hasPrev: pageNum > 1
    }
  };
}

/**
 * Filter data by date range
 * @param {Array} data - Data array
 * @param {string} startDate - Start date filter
 * @param {string} endDate - End date filter
 * @param {string} dateField - Field name containing date
 * @returns {Array} - Filtered data
 */
function filterByDateRange(data, startDate, endDate, dateField = 'date') {
  if (!startDate && !endDate) {
    return data;
  }
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    } else if (startDate) {
      const start = new Date(startDate);
      return itemDate >= start;
    } else if (endDate) {
      const end = new Date(endDate);
      return itemDate <= end;
    }
    
    return true;
  });
}

module.exports = {
  generateNewEntity,
  updateEntity,
  findEntityById,
  findEntityIndexById,
  removeEntityById,
  applyPagination,
  filterByDateRange
};
const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { coa } = require("../data/dummy");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Simulasi database COA
let coaData = [...coa];

// Helper function untuk generate ID
function generateId() {
  return uuidv4();
}

// Helper function untuk format tanggal
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * GET /api/coa - Get all COA records
 * Query params: search (optional)
 */
router.get("/coa", authMiddleware, (req, res) => {
  try {
    const { search } = req.query;

    let filteredCoa = coaData.filter((item) => item.is_active);

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCoa = filteredCoa.filter(
        (item) =>
          item.account_code.toLowerCase().includes(searchLower) ||
          item.account_name.toLowerCase().includes(searchLower) ||
          item.account_type.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      code: 200,
      data: filteredCoa,
      message: "Successfully retrieved COA data.",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to retrieve COA data.",
      details: error.message,
    });
  }
});

/**
 * GET /api/coa/list - Get COA list for dropdown options
 */
router.get("/coa/list", authMiddleware, (req, res) => {
  try {
    const coaList = coaData
      .filter((item) => item.is_active)
      .map((item) => ({
        id: item.account_id,
        code: item.account_code,
        name: item.account_name,
      }));

    res.json({
      code: 200,
      data: coaList,
      message: "Successfully retrieved COA list.",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to retrieve COA list.",
      details: error.message,
    });
  }
});

/**
 * GET /api/coa/:id - Get single COA record
 */
router.get("/coa/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const coaItem = coaData.find(
      (item) => item.account_id === id && item.is_active
    );

    if (!coaItem) {
      return res.status(404).json({
        code: 404,
        error: "COA not found.",
      });
    }

    res.json({
      code: 200,
      data: coaItem,
      message: "Successfully retrieved COA data.",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to retrieve COA data.",
      details: error.message,
    });
  }
});

/**
 * POST /api/coa - Create new COA record
 * Body: { account_code, account_name, account_type }
 */
router.post("/coa", authMiddleware, (req, res) => {
  try {
    const { account_code, account_name, account_type } = req.body;

    // Validation
    if (!account_code || !account_name || !account_type) {
      return res.status(400).json({
        code: 400,
        error:
          "Missing required fields. Please provide account_code, account_name, and account_type.",
      });
    }

    // Check if account_code already exists
    const existingCoa = coaData.find(
      (item) => item.account_code === account_code && item.is_active
    );

    if (existingCoa) {
      return res.status(409).json({
        code: 409,
        error: "Account code already exists.",
      });
    }

    const newCoa = {
      account_id: generateId(),
      account_code,
      account_name,
      account_type,
      is_active: true,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    };

    coaData.push(newCoa);

    res.status(201).json({
      code: 201,
      data: newCoa,
      message: `COA ${newCoa.account_id} successfully created.`,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to create COA.",
      details: error.message,
    });
  }
});

/**
 * PATCH /api/coa/:id - Update COA record
 * Body: { account_code?, account_name?, account_type? }
 */
router.patch("/coa/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { account_code, account_name, account_type } = req.body;

    const coaIndex = coaData.findIndex(
      (item) => item.account_id === id && item.is_active
    );

    if (coaIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "COA not found.",
      });
    }

    // Check if new account_code already exists (if provided)
    if (account_code) {
      const existingCoa = coaData.find(
        (item) =>
          item.account_code === account_code &&
          item.account_id !== id &&
          item.is_active
      );

      if (existingCoa) {
        return res.status(409).json({
          code: 409,
          error: "Account code already exists.",
        });
      }
    }

    // Update fields if provided
    const updatedCoa = { ...coaData[coaIndex] };
    if (account_code) updatedCoa.account_code = account_code;
    if (account_name) updatedCoa.account_name = account_name;
    if (account_type) updatedCoa.account_type = account_type;
    updatedCoa.updated_at = getCurrentTimestamp();

    coaData[coaIndex] = updatedCoa;

    res.json({
      code: 200,
      data: updatedCoa,
      message: `COA ${id} successfully updated.`,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to update COA.",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/coa/:id - Delete/Deactivate COA record
 */
router.delete("/coa/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const coaIndex = coaData.findIndex(
      (item) => item.account_id === id && item.is_active
    );

    if (coaIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "COA not found.",
      });
    }

    // Soft delete by setting is_active to false
    coaData[coaIndex].is_active = false;
    coaData[coaIndex].updated_at = getCurrentTimestamp();

    res.json({
      code: 200,
      message: `COA ${id} successfully deactivated.`,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Failed to deactivate COA.",
      details: error.message,
    });
  }
});

module.exports = router;

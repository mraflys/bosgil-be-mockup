const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { omzet, accounts, branches, coa } = require("../data/dummy");

const router = express.Router();

// GET /api/omzet - Read All Omzet
router.get("/omzet", authMiddleware, (req, res) => {
  try {
    const { search } = req.query;

    let filteredOmzet = omzet.filter((item) => item.status === "active");

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOmzet = filteredOmzet.filter(
        (item) =>
          item.reference_no.toLowerCase().includes(searchLower) ||
          item.notes.toLowerCase().includes(searchLower) ||
          item.branch_name.toLowerCase().includes(searchLower) ||
          item.account_name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at desc
    filteredOmzet.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.status(200).json({
      code: 200,
      message: "Success get omzet data",
      data: filteredOmzet,
      total: filteredOmzet.length,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/omzet/:id - Read One Omzet
router.get("/omzet/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const omzetItem = omzet.find(
      (item) => item.id === id && item.status === "active"
    );

    if (!omzetItem) {
      return res.status(404).json({
        code: 404,
        error: "Omzet not found",
      });
    }

    res.status(200).json({
      code: 200,
      message: "Success get omzet detail",
      data: omzetItem,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/omzet - Create Omzet
router.post("/omzet", authMiddleware, (req, res) => {
  try {
    const {
      transaction_date,
      transaction_type,
      reference_no,
      branch_id,
      account_id,
      notes,
      total_amount,
      file,
    } = req.body;

    // Validation
    if (
      !transaction_date ||
      !transaction_type ||
      !reference_no ||
      !branch_id ||
      !account_id ||
      !total_amount
    ) {
      return res.status(400).json({
        code: 400,
        error: "Missing required fields",
        message:
          "transaction_date, transaction_type, reference_no, branch_id, account_id, and total_amount are required",
      });
    }

    // Validate date format (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(transaction_date)) {
      return res.status(400).json({
        code: 400,
        error: "Invalid date format",
        message: "Date must be in DD-MM-YYYY format",
      });
    }

    // Validate transaction_type
    if (!["Pemasukan", "Pengeluaran"].includes(transaction_type)) {
      return res.status(400).json({
        code: 400,
        error: "Invalid transaction type",
        message: "transaction_type must be 'Pemasukan' or 'Pengeluaran'",
      });
    }

    // Validate branch exists
    const branch = branches.find((b) => b.id === branch_id);
    if (!branch) {
      return res.status(400).json({
        code: 400,
        error: "Branch not found",
        message: "Invalid branch_id",
      });
    }

    // Validate account exists
    const account = coa.find((a) => a.account_id === account_id && a.is_active);
    if (!account) {
      return res.status(400).json({
        code: 400,
        error: "Account not found",
        message: "Invalid account_id or account is inactive",
      });
    }

    // Validate total_amount is positive number
    if (typeof total_amount !== "number" || total_amount <= 0) {
      return res.status(400).json({
        code: 400,
        error: "Invalid total amount",
        message: "total_amount must be a positive number",
      });
    }

    // Check if reference_no already exists
    const existingRef = omzet.find(
      (item) => item.reference_no === reference_no && item.status === "active"
    );
    if (existingRef) {
      return res.status(400).json({
        code: 400,
        error: "Reference number already exists",
        message: "reference_no must be unique",
      });
    }

    // Generate new ID
    const newId = `omzet-${omzet.length + 1}`;
    const currentTimestamp = new Date().toISOString();

    // Create new omzet
    const newOmzet = {
      id: newId,
      transaction_date,
      transaction_type,
      reference_no,
      branch_id,
      branch_name: branch.name,
      account_id,
      account_name: account.name,
      notes: notes || "",
      total_amount,
      status: "active",
      file: file || null,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
    };

    // Add to omzet array (in real app, this would be saved to database)
    omzet.push(newOmzet);

    res.status(201).json({
      code: 201,
      message: "Omzet created successfully",
      data: newOmzet,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// PATCH /api/omzet/:id - Update Omzet
router.patch("/omzet/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      transaction_date,
      transaction_type,
      reference_no,
      branch_id,
      account_id,
      notes,
      total_amount,
      file,
    } = req.body;

    // Find omzet
    const omzetIndex = omzet.findIndex(
      (item) => item.id === id && item.status === "active"
    );
    if (omzetIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "Omzet not found",
      });
    }

    const currentOmzet = omzet[omzetIndex];

    // Validate fields if provided
    if (transaction_date) {
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (!dateRegex.test(transaction_date)) {
        return res.status(400).json({
          code: 400,
          error: "Invalid date format",
          message: "Date must be in DD-MM-YYYY format",
        });
      }
    }

    if (
      transaction_type &&
      !["Pemasukan", "Pengeluaran"].includes(transaction_type)
    ) {
      return res.status(400).json({
        code: 400,
        error: "Invalid transaction type",
        message: "transaction_type must be 'Pemasukan' or 'Pengeluaran'",
      });
    }

    if (branch_id) {
      const branch = branches.find((b) => b.id === branch_id);
      if (!branch) {
        return res.status(400).json({
          code: 400,
          error: "Branch not found",
          message: "Invalid branch_id",
        });
      }
      currentOmzet.branch_id = branch_id;
      currentOmzet.branch_name = branch.name;
    }

    if (account_id) {
      const account = coa.find(
        (a) => a.account_id == account_id && a.is_active
      );
      if (!account) {
        return res.status(400).json({
          code: 400,
          error: "Account not found",
          message: "Invalid account_id or account is inactive",
        });
      }
      currentOmzet.account_id = account_id;
      currentOmzet.account_name = account.name;
    }

    if (total_amount !== undefined) {
      if (typeof total_amount !== "number" || total_amount <= 0) {
        return res.status(400).json({
          code: 400,
          error: "Invalid total amount",
          message: "total_amount must be a positive number",
        });
      }
    }

    if (reference_no && reference_no !== currentOmzet.reference_no) {
      const existingRef = omzet.find(
        (item) =>
          item.reference_no === reference_no &&
          item.status === "active" &&
          item.id !== id
      );
      if (existingRef) {
        return res.status(400).json({
          code: 400,
          error: "Reference number already exists",
          message: "reference_no must be unique",
        });
      }
    }

    // Update fields
    if (transaction_date) currentOmzet.transaction_date = transaction_date;
    if (transaction_type) currentOmzet.transaction_type = transaction_type;
    if (reference_no) currentOmzet.reference_no = reference_no;
    if (notes !== undefined) currentOmzet.notes = notes;
    if (total_amount !== undefined) currentOmzet.total_amount = total_amount;
    if (file !== undefined) currentOmzet.file = file;

    currentOmzet.updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: "Omzet updated successfully",
      data: currentOmzet,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// DELETE /api/omzet/:id - Delete (Deactivate) Omzet
router.delete("/omzet/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Find omzet
    const omzetIndex = omzet.findIndex(
      (item) => item.id === id && item.status === "active"
    );
    if (omzetIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "Omzet not found",
      });
    }

    // Deactivate instead of actual delete
    omzet[omzetIndex].status = "inactive";
    omzet[omzetIndex].updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: "Omzet deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/accounts - Get all active accounts (helper endpoint)
router.get("/accounts", authMiddleware, (req, res) => {
  try {
    const activeAccounts = accounts.filter((account) => account.is_active);

    res.status(200).json({
      code: 200,
      message: "Success get accounts data",
      data: activeAccounts,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;

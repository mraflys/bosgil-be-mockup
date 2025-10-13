const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { omzet, branches, coa } = require("../data/dummy");

const router = express.Router();

// GET /api/pengeluaran - Read All Pengeluaran
router.get("/pengeluaran", authMiddleware, (req, res) => {
  try {
    const { search, start_date, end_date, account_id, branch_id } = req.query;

    // Filter only "Pengeluaran" transactions
    let filteredPengeluaran = omzet.filter(
      (item) =>
        item.status === "active" && item.transaction_type === "Pengeluaran"
    );

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPengeluaran = filteredPengeluaran.filter(
        (item) =>
          item.reference_no.toLowerCase().includes(searchLower) ||
          item.notes.toLowerCase().includes(searchLower) ||
          item.branch_name.toLowerCase().includes(searchLower) ||
          item.account_name.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (start_date || end_date) {
      filteredPengeluaran = filteredPengeluaran.filter((item) => {
        // Convert DD-MM-YYYY to YYYY-MM-DD for comparison
        const [day, month, year] = item.transaction_date.split("-");
        const itemDate = new Date(`${year}-${month}-${day}`);

        let isInRange = true;

        if (start_date) {
          // Assuming start_date format is ddmmyyyy
          const startDay = start_date.substring(0, 2);
          const startMonth = start_date.substring(2, 4);
          const startYear = start_date.substring(4, 8);
          const startDateObj = new Date(
            `${startYear}-${startMonth}-${startDay}`
          );
          isInRange = isInRange && itemDate >= startDateObj;
        }

        if (end_date) {
          // Assuming end_date format is ddmmyyyy
          const endDay = end_date.substring(0, 2);
          const endMonth = end_date.substring(2, 4);
          const endYear = end_date.substring(4, 8);
          const endDateObj = new Date(`${endYear}-${endMonth}-${endDay}`);
          isInRange = isInRange && itemDate <= endDateObj;
        }

        return isInRange;
      });
    }

    // Account filter
    if (account_id) {
      filteredPengeluaran = filteredPengeluaran.filter(
        (item) => item.account_id === account_id
      );
    }

    // Branch filter
    if (branch_id) {
      filteredPengeluaran = filteredPengeluaran.filter(
        (item) => item.branch_id === branch_id
      );
    }

    // Sort by created_at desc
    filteredPengeluaran.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Format response to match expected structure
    const responseData = filteredPengeluaran.map((item) => ({
      transaction_id: item.id,
      transaction_date: item.transaction_date.replace(/-/g, "/"), // Convert to DD/MM/YYYY
      transaction_type: item.transaction_type,
      reference_no: item.reference_no,
      notes: item.notes,
      total_amount: item.total_amount,
      status: "Approved", // Default status for pengeluaran
      branch_id: item.branch_id,
      branch_name: item.branch_name,
      account_id: item.account_id,
      account_code: item.account_code,
      account_name: item.account_name,
    }));

    res.status(200).json({
      code: 200,
      message: "Successfully retrieved Expense data.",
      data: responseData,
      total: responseData.length,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/pengeluaran/:id - Read One Pengeluaran
router.get("/pengeluaran/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const pengeluaranItem = omzet.find(
      (item) =>
        item.id === id &&
        item.status === "active" &&
        item.transaction_type === "Pengeluaran"
    );

    if (!pengeluaranItem) {
      return res.status(404).json({
        code: 404,
        error: "Expense not found",
      });
    }

    // Format response
    const responseData = {
      transaction_id: pengeluaranItem.id,
      transaction_date: pengeluaranItem.transaction_date.replace(/-/g, "/"), // Convert to DD/MM/YYYY
      transaction_type: pengeluaranItem.transaction_type,
      reference_no: pengeluaranItem.reference_no,
      notes: pengeluaranItem.notes,
      total_amount: pengeluaranItem.total_amount,
      status: "Approved", // Default status for pengeluaran
      branch_id: pengeluaranItem.branch_id,
      branch_name: pengeluaranItem.branch_name,
      account_id: pengeluaranItem.account_id,
      account_code: pengeluaranItem.account_code,
      account_name: pengeluaranItem.account_name,
    };

    res.status(200).json({
      code: 200,
      message: "Successfully retrieved Expense data.",
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/pengeluaran - Create Pengeluaran
router.post("/pengeluaran", authMiddleware, (req, res) => {
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

    // Validate transaction_type for pengeluaran
    if (!["Operasional", "Bahan Baku"].includes(transaction_type)) {
      return res.status(400).json({
        code: 400,
        error: "Invalid transaction type",
        message: "transaction_type must be 'Operasional' or 'Bahan Baku'",
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

    // Validate account exists in COA
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

    // Create new pengeluaran (saved as omzet with transaction_type = "Pengeluaran")
    const newPengeluaran = {
      id: newId,
      transaction_date,
      transaction_type: "Pengeluaran", // Force to Pengeluaran for consistency
      reference_no,
      branch_id,
      branch_name: branch.name,
      account_id,
      account_code: account.account_code,
      account_name: account.account_name,
      notes: notes || "",
      total_amount,
      status: "active",
      file: file || null,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
    };

    // Add to omzet array (in real app, this would be saved to database)
    omzet.push(newPengeluaran);

    res.status(200).json({
      code: 200,
      message: `Expense ${newId} successfully created.`,
      data: newPengeluaran,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// PATCH /api/pengeluaran/:id - Update Pengeluaran
router.patch("/pengeluaran/:id", authMiddleware, (req, res) => {
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

    // Find pengeluaran
    const omzetIndex = omzet.findIndex(
      (item) =>
        item.id === id &&
        item.status === "active" &&
        item.transaction_type === "Pengeluaran"
    );
    if (omzetIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "Expense not found",
      });
    }

    const currentPengeluaran = omzet[omzetIndex];

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
      !["Operasional", "Bahan Baku"].includes(transaction_type)
    ) {
      return res.status(400).json({
        code: 400,
        error: "Invalid transaction type",
        message: "transaction_type must be 'Operasional' or 'Bahan Baku'",
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
      currentPengeluaran.branch_id = branch_id;
      currentPengeluaran.branch_name = branch.name;
    }

    if (account_id) {
      const account = coa.find(
        (a) => a.account_id === account_id && a.is_active
      );
      if (!account) {
        return res.status(400).json({
          code: 400,
          error: "Account not found",
          message: "Invalid account_id or account is inactive",
        });
      }
      currentPengeluaran.account_id = account_id;
      currentPengeluaran.account_code = account.account_code;
      currentPengeluaran.account_name = account.account_name;
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

    if (reference_no && reference_no !== currentPengeluaran.reference_no) {
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
    if (transaction_date)
      currentPengeluaran.transaction_date = transaction_date;
    if (transaction_type) currentPengeluaran.transaction_type = "Pengeluaran"; // Always keep as Pengeluaran
    if (reference_no) currentPengeluaran.reference_no = reference_no;
    if (notes !== undefined) currentPengeluaran.notes = notes;
    if (total_amount !== undefined)
      currentPengeluaran.total_amount = total_amount;
    if (file !== undefined) currentPengeluaran.file = file;

    currentPengeluaran.updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: `Expense ${id} successfully updated.`,
      data: currentPengeluaran,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// DELETE /api/pengeluaran/:id - Delete (Deactivate) Pengeluaran
router.delete("/pengeluaran/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Find pengeluaran
    const omzetIndex = omzet.findIndex(
      (item) =>
        item.id === id &&
        item.status === "active" &&
        item.transaction_type === "Pengeluaran"
    );
    if (omzetIndex === -1) {
      return res.status(404).json({
        code: 404,
        error: "Expense not found",
      });
    }

    // Deactivate instead of actual delete
    omzet[omzetIndex].status = "inactive";
    omzet[omzetIndex].updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: `Expense ${id} successfully deactivated.`,
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

const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { omzet, accounts, branches, coa } = require("../data/dummy");
const {
  validation,
  dateUtils,
  responseUtils,
  fileUtils,
  crudUtils,
} = require("../utils");

const router = express.Router();

// GET /api/omzet - Read All Omzet
router.get("/omzet", authMiddleware, (req, res) => {
  try {
    const {
      search,
      transaction_type,
      start_date,
      end_date,
      account_id,
      branch_id,
    } = req.query;

    let filteredOmzet = omzet.filter((item) => item.status === "active");

    // Transaction type filter
    if (transaction_type) {
      filteredOmzet = filteredOmzet.filter(
        (item) => item.transaction_type === transaction_type
      );
    }

    // Account filter
    if (account_id) {
      filteredOmzet = filteredOmzet.filter(
        (item) => item.account_id === account_id
      );
    }

    // Branch filter
    if (branch_id) {
      filteredOmzet = filteredOmzet.filter(
        (item) => item.branch_id === branch_id
      );
    }

    // Date range filter
    if (start_date || end_date) {
      filteredOmzet = filteredOmzet.filter((item) => {
        // Convert DD-MM-YYYY to Date for comparison
        const [day, month, year] = item.transaction_date.split("-");
        const itemDate = new Date(`${year}-${month}-${day}`);

        let isInRange = true;

        if (start_date) {
          const startDateObj = dateUtils.parseFilterDate(start_date);
          isInRange = isInRange && itemDate >= startDateObj;
        }

        if (end_date) {
          const endDateObj = dateUtils.parseFilterDate(end_date);
          isInRange = isInRange && itemDate <= endDateObj;
        }

        return isInRange;
      });
    }

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

    // Format response dates to DD/MM/YYYY
    const formattedData = filteredOmzet.map((item) => ({
      ...item,
      transaction_date: dateUtils.convertToDisplayFormat(item.transaction_date),
    }));

    res
      .status(200)
      .json(
        responseUtils.successResponse(formattedData, "Success get omzet data")
      );
  } catch (error) {
    res.status(500).json(responseUtils.errorResponse(error.message, 500));
  }
});

// GET /api/omzet/:id - Read One Omzet
router.get("/omzet/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const omzetItem = crudUtils.findEntityById(
      omzet.filter((item) => item.status === "active"),
      id
    );

    if (!omzetItem) {
      return res.status(404).json(responseUtils.notFoundResponse("Omzet"));
    }

    // Format response date to DD/MM/YYYY
    const formattedData = {
      ...omzetItem,
      transaction_date: dateUtils.convertToDisplayFormat(
        omzetItem.transaction_date
      ),
    };

    res
      .status(200)
      .json(
        responseUtils.successResponse(formattedData, "Success get omzet detail")
      );
  } catch (error) {
    res.status(500).json(responseUtils.errorResponse(error.message, 500));
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
      files,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "transaction_date",
      "transaction_type",
      "reference_no",
      "branch_id",
      "account_id",
      "total_amount",
    ];
    const validationError = validation.validateRequiredFields(
      req.body,
      requiredFields
    );
    if (validationError) {
      return res
        .status(400)
        .json(responseUtils.validationErrorResponse(validationError));
    }

    // Validate date format (DD/MM/YYYY)
    if (!validation.validateDateFormat(transaction_date)) {
      return res
        .status(400)
        .json(
          responseUtils.validationErrorResponse(
            "Date must be in DD/MM/YYYY format"
          )
        );
    }

    // Validate transaction_type
    if (
      !validation.validateTransactionType(transaction_type, [
        "Pemasukan",
        "Pengeluaran",
      ])
    ) {
      return res
        .status(400)
        .json(
          responseUtils.validationErrorResponse(
            "transaction_type must be 'Pemasukan' or 'Pengeluaran'"
          )
        );
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
      return res
        .status(400)
        .json(
          responseUtils.validationErrorResponse(
            "Invalid account_id or account is inactive"
          )
        );
    }

    // Validate total_amount is positive number
    if (!validation.validatePositiveNumber(total_amount)) {
      return res
        .status(400)
        .json(
          responseUtils.validationErrorResponse(
            "total_amount must be a positive number"
          )
        );
    }

    // Check if reference_no already exists
    const existingRef = omzet.find(
      (item) => item.reference_no === reference_no && item.status === "active"
    );
    if (existingRef) {
      return res
        .status(400)
        .json(
          responseUtils.validationErrorResponse("reference_no must be unique")
        );
    }

    // Validate and process files if provided
    let processedFiles = [];
    if (files && Array.isArray(files)) {
      if (!validation.validateFileStructure(files)) {
        return res
          .status(400)
          .json(
            responseUtils.validationErrorResponse(
              "Each file must have filename and original_name"
            )
          );
      }
      processedFiles = fileUtils.processMultipleFiles(files);
    }

    // Convert DD/MM/YYYY input to DD-MM-YYYY for storage
    const storageDate = dateUtils.convertToStorageFormat(transaction_date);

    // Create new omzet using utility
    const newOmzet = crudUtils.generateNewEntity({
      transaction_date: storageDate,
      transaction_type,
      reference_no,
      branch_id,
      branch_name: branch.name,
      account_id,
      account_code: account.account_code,
      account_name: account.account_name,
      notes: notes || "",
      total_amount,
      status: "active",
      files: processedFiles,
    });

    // Add to omzet array (in real app, this would be saved to database)
    omzet.push(newOmzet);

    // Format response date to DD/MM/YYYY
    const responseData = {
      ...newOmzet,
      transaction_date: dateUtils.convertToDisplayFormat(
        newOmzet.transaction_date
      ),
    };

    res
      .status(201)
      .json(
        responseUtils.successResponse(
          responseData,
          "Omzet created successfully"
        )
      );
  } catch (error) {
    res.status(500).json(responseUtils.errorResponse(error.message, 500));
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
      files,
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
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(transaction_date)) {
        return res.status(400).json({
          code: 400,
          error: "Invalid date format",
          message: "Date must be in DD/MM/YYYY format",
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
      currentOmzet.account_code = account.account_code;
      currentOmzet.account_name = account.account_name;
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

    // Process files if provided
    if (files !== undefined) {
      let processedFiles = [];
      if (Array.isArray(files)) {
        processedFiles = files.map((file, index) => {
          if (!file.filename || !file.original_name) {
            throw new Error("Each file must have filename and original_name");
          }
          return {
            id: file.id || `file-${Date.now()}-${index}`,
            filename: file.filename,
            original_name: file.original_name,
            size: file.size || 0,
            mime_type: file.mime_type || "application/octet-stream",
            uploaded_at: file.uploaded_at || new Date().toISOString(),
          };
        });
      }
      currentOmzet.files = processedFiles;
    }

    // Update fields
    if (transaction_date) {
      // Convert DD/MM/YYYY input to DD-MM-YYYY for storage
      currentOmzet.transaction_date =
        dateUtils.convertToStorageFormat(transaction_date);
    }
    if (transaction_type) currentOmzet.transaction_type = transaction_type;
    if (reference_no) currentOmzet.reference_no = reference_no;
    if (notes !== undefined) currentOmzet.notes = notes;
    if (total_amount !== undefined) currentOmzet.total_amount = total_amount;

    currentOmzet.updated_at = new Date().toISOString();

    // Format response date to DD/MM/YYYY
    const responseData = {
      ...currentOmzet,
      transaction_date: dateUtils.convertToDisplayFormat(
        currentOmzet.transaction_date
      ),
    };

    res.status(200).json({
      code: 200,
      message: "Omzet updated successfully",
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

// POST /api/omzet/:id/files - Add files to existing omzet
router.post("/omzet/:id/files", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body;

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

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        code: 400,
        error: "Files array is required and cannot be empty",
      });
    }

    // Process new files
    const processedFiles = files.map((file, index) => {
      if (!file.filename || !file.original_name) {
        throw new Error("Each file must have filename and original_name");
      }
      return {
        id: `file-${Date.now()}-${index}`,
        filename: file.filename,
        original_name: file.original_name,
        size: file.size || 0,
        mime_type: file.mime_type || "application/octet-stream",
        uploaded_at: new Date().toISOString(),
      };
    });

    // Add to existing files
    omzet[omzetIndex].files = [
      ...(omzet[omzetIndex].files || []),
      ...processedFiles,
    ];
    omzet[omzetIndex].updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: "Files added successfully",
      data: {
        transaction_id: id,
        files: omzet[omzetIndex].files,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// DELETE /api/omzet/:id/files/:file_id - Remove file from omzet
router.delete("/omzet/:id/files/:file_id", authMiddleware, (req, res) => {
  try {
    const { id, file_id } = req.params;

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

    // Find and remove file
    const fileIndex = omzet[omzetIndex].files?.findIndex(
      (f) => f.id === file_id
    );
    if (fileIndex === -1 || fileIndex === undefined) {
      return res.status(404).json({
        code: 404,
        error: "File not found",
      });
    }

    omzet[omzetIndex].files.splice(fileIndex, 1);
    omzet[omzetIndex].updated_at = new Date().toISOString();

    res.status(200).json({
      code: 200,
      message: "File removed successfully",
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

const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const AuditLogs = require("../models/AuditLogs");

// POST: Create a candidate
const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, position, source } = req.body;

    if (!name || !email || !phone || !position) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and position are required",
      });
    }

    const existingCandidate = await Candidate.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: "Candidate with this email or phone already exists",
      });
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      position,
      source,
    });

    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Create candidate error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET: Fetch candidates with filters and pagination
const getCandidates = async (req, res) => {
  try {
    const {
      status,
      position,
      source,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { isArchived: false };

    if (status) filter.status = status;
    if (position) filter.position = position;
    if (source) filter.source = source;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),

      Candidate.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: candidates,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get candidates error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      isArchived: false,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Get candidate error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "position",
      "source",
      "resumeUrl",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();

      const existing = await Candidate.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, isArchived: false },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const allowedStatuses = [
      "applied",
      "screening",
      "interview",
      "selected",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        allowedStatuses,
      });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, isArchived: false },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate status updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Update candidate status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const selectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedAs } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    if (!["intern", "employee"].includes(selectedAs)) {
      return res.status(400).json({
        success: false,
        message: "selectedAs must be intern or employee",
      });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, isArchived: false },
      { $set: { status: "selected", selectedAs } },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate selected successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Select candidate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const archiveCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, isArchived: false },
      { $set: { isArchived: true } },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found or already archived",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate archived successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Archive candidate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    await AuditLogs.create({
      userId: req.user.id,
      action: "DELETE",
      entity: "Candidate",
      entityId: candidate._id,
      details: `Candidate deleted: ${candidate.name} (${candidate.email})`,
      ipAddress: req.ip,
    });

    await Candidate.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.error("Delete candidate error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete candidate",
    });
  }
};


module.exports = {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  selectCandidate,
  archiveCandidate,
  deleteCandidate,
};

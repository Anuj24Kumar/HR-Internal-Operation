const { Candidate, Employee, Offer, User } = require("../../models");

/**
 * 1. Full-scope search across Candidates, Employees, Offers, and Users
 * GET /api/admin/search?q=
 */
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        query: "",
        results: {
          candidates: [],
          employees: [],
          offers: [],
          users: [],
        },
      });
    }

    const searchTerm = q.trim();
    const regex = new RegExp(searchTerm, "i");

    const [candidates, employees, offers, users] = await Promise.all([
      Candidate.find({
        $or: [{ name: regex }, { email: regex }, { position: regex }, { phone: regex }],
      })
        .select("name email position status source")
        .limit(20),

      Employee.find({
        $or: [{ empId: regex }, { designation: regex }, { department: regex }],
      })
        .select("empId type department designation status joiningDate")
        .populate("userId", "name email")
        .limit(20),

      Offer.find({
        $or: [{ designation: regex }, { status: regex }],
      })
        .select("offerType designation salary status joiningDate")
        .populate("candidateId", "name email")
        .limit(20),

      User.find({
        $or: [{ name: regex }, { email: regex }, { role: regex }],
      })
        .select("name email role isActive")
        .limit(20),
    ]);

    res.status(200).json({
      success: true,
      query: searchTerm,
      counts: {
        candidates: candidates.length,
        employees: employees.length,
        offers: offers.length,
        users: users.length,
        total: candidates.length + employees.length + offers.length + users.length,
      },
      results: {
        candidates,
        employees,
        offers,
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Search operation failed",
      error: error.message,
    });
  }
};

/**
 * 2. Export search results as CSV or JSON
 * GET /api/admin/search/export?q=&format=csv|json
 */
const exportSearchResults = async (req, res) => {
  try {
    const { q, format = "csv" } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' parameter is required for export",
      });
    }

    const regex = new RegExp(q.trim(), "i");

    const [candidates, employees] = await Promise.all([
      Candidate.find({
        $or: [{ name: regex }, { email: regex }, { position: regex }],
      }).select("name email position status"),
      Employee.find({
        $or: [{ empId: regex }, { designation: regex }, { department: regex }],
      })
        .select("empId designation department status")
        .populate("userId", "name email"),
    ]);

    const combined = [
      ...candidates.map((c) => ({
        type: "Candidate",
        id: c._id,
        identifier: c.name,
        details: `${c.position} (${c.email})`,
        status: c.status,
      })),
      ...employees.map((e) => ({
        type: "Employee",
        id: e._id,
        identifier: e.empId,
        details: `${e.designation} - ${e.department} (${e.userId ? e.userId.name : ""})`,
        status: e.status,
      })),
    ];

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Disposition", 'attachment; filename="search-results.json"');
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(JSON.stringify(combined, null, 2));
    }

    const headers = "Entity Type,ID,Identifier,Details,Status\n";
    const rows = combined.map(
      (item) =>
        `"${item.type}","${item.id}","${item.identifier}","${item.details.replace(/"/g, '""')}","${item.status}"`
    );

    res.setHeader("Content-Disposition", 'attachment; filename="search-results.csv"');
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(headers + rows.join("\n"));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Export operation failed",
      error: error.message,
    });
  }
};

module.exports = {
  globalSearch,
  exportSearchResults,
};

const {
  Application,
  Document,
  Interview,
  Letter,
  Offer,
  User,
} = require("../../models");

const makeRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const searchLimit = (value) => Math.min(50, Math.max(1, Number.parseInt(value, 10) || 10));

const searchEntities = async (term, limit) => {
  const regex = makeRegex(term);
  return Promise.all([
    User.find({
      $or: [
        { name: regex }, { email: regex }, { empId: regex }, { designation: regex },
        { department: regex }, { position: regex }, { track: regex }, { role: regex },
      ],
    }).select("name email role empId designation department position isActive status").limit(limit).lean(),
    Application.find({
      $or: [{ candidateName: regex }, { email: regex }, { position: regex }],
    }).populate("candidateId", "name email").select("candidateName email position status createdAt").sort({ createdAt: -1 }).limit(limit).lean(),
    Offer.find({
      $or: [{ designation: regex }, { status: regex }, { offerType: regex }],
    }).populate("candidateId", "name email").select("designation salary status offerType joiningDate candidateId").limit(limit).lean(),
    Interview.find({
      $or: [{ roundName: regex }, { status: regex }, { interviewType: regex }],
    }).populate("candidateId", "name email").populate("interviewerId", "name email")
      .select("roundName status interviewType scheduledAt candidateId interviewerId").limit(limit).lean(),
    Document.find({
      $or: [{ label: regex }, { originalName: regex }, { documentType: regex }],
    }).populate("ownerId", "name email").select("label originalName documentType status createdAt ownerId").limit(limit).lean(),
    Letter.find({
      $or: [{ title: regex }, { type: regex }, { status: regex }],
    }).populate("employeeId", "name email").select("title type status createdAt employeeId").limit(limit).lean(),
  ]);
};

const globalSearch = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      const empty = { users: [], applications: [], offers: [], interviews: [], documents: [], letters: [] };
      return res.json({
        success: true,
        query: q,
        data: empty,
        results: { ...empty, candidates: [], employees: [] },
        counts: { users: 0, applications: 0, offers: 0, interviews: 0, documents: 0, letters: 0, candidates: 0, employees: 0, total: 0 },
      });
    }

    const [users, applications, offers, interviews, documents, letters] =
      await searchEntities(q, searchLimit(req.query.limit));
    const candidates = users
      .filter((user) => user.role === "candidate")
      .map((user) => {
        const application = applications.find((item) => item.candidateId?._id?.toString() === user._id.toString());
        return {
          ...user,
          position: user.position || application?.position,
          status: application?.status || user.status,
        };
      });
    const employees = users
      .filter((user) => ["intern", "employee"].includes(user.role))
      .map((user) => ({
        ...user,
        userId: { name: user.name },
        type: user.role === "intern" ? "Intern" : "Employee",
      }));
    const total = users.length + applications.length + offers.length + interviews.length + documents.length + letters.length;
    return res.json({
      success: true,
      query: q,
      data: { users, applications, offers, interviews, documents, letters },
      results: { users, applications, offers, interviews, documents, letters, candidates, employees },
      counts: {
        users: users.length,
        applications: applications.length,
        offers: offers.length,
        interviews: interviews.length,
        documents: documents.length,
        letters: letters.length,
        candidates: candidates.length,
        employees: employees.length,
        total,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Search operation failed", error: error.message });
  }
};

const exportSearchResults = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      return res.status(400).json({ success: false, message: "Search query 'q' must contain at least 2 characters" });
    }
    const [users, applications, offers, interviews, documents, letters] =
      await searchEntities(q, searchLimit(req.query.limit || 50));
    const combined = [
      ...users.map((item) => ({ type: "User", id: item._id, identifier: item.name, details: `${item.role} (${item.email})`, status: item.status })),
      ...applications.map((item) => ({ type: "Application", id: item._id, identifier: item.candidateName, details: item.position, status: item.status })),
      ...offers.map((item) => ({ type: "Offer", id: item._id, identifier: item.candidateId?.name || "Unknown", details: item.designation, status: item.status })),
      ...interviews.map((item) => ({ type: "Interview", id: item._id, identifier: item.candidateId?.name || "Unknown", details: item.roundName, status: item.status })),
      ...documents.map((item) => ({ type: "Document", id: item._id, identifier: item.label, details: item.originalName, status: item.status })),
      ...letters.map((item) => ({ type: "Letter", id: item._id, identifier: item.title, details: item.type, status: item.status })),
    ];

    if (String(req.query.format || "csv").toLowerCase() === "json") {
      res.setHeader("Content-Disposition", 'attachment; filename="search-results.json"');
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(JSON.stringify(combined, null, 2));
    }

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = combined.map((item) => [
      item.type, item.id, item.identifier, item.details, item.status,
    ].map(escapeCsv).join(","));
    res.setHeader("Content-Disposition", 'attachment; filename="search-results.csv"');
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(["Entity Type,ID,Identifier,Details,Status", ...rows].join("\n"));
  } catch (error) {
    return res.status(500).json({ success: false, message: "Export operation failed", error: error.message });
  }
};

module.exports = { globalSearch, exportSearchResults };

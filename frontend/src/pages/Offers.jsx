
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, RefreshCw, Pencil, Trash2, Send,
  FileDown, CheckCircle2, XCircle, Clock3, X, ExternalLink, Eye,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";
import { useAlert } from "../components/AlertProvider.jsx";
import { useNavigate } from "react-router-dom";

const EMPTY_FORM = {
  candidateId: "",
  templateId: "",
  placeholderValues: {},
  offerType: "employee",
  salary: "",
  designation: "",
  joiningDate: "",
  expiryDate: "",
  requiredDocuments: [
    { label: "Government ID / Aadhaar", acceptedTypes: ["pdf", "jpg", "png"], required: true },
    { label: "Signed Offer Letter", acceptedTypes: ["pdf"], required: true },
  ],
};

const STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "sent",
  "offer_received",
  "accepted",
  "declined",
  "expired",
];

const money = (value) =>
  Number.isFinite(Number(value))
    ? `₹${Number(value).toLocaleString("en-IN")}`
    : "—";

const date = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

function candidateOf(offer) {
  return offer?.candidateId && typeof offer.candidateId === "object"
    ? offer.candidateId
    : null;
}

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    pending_approval: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
    sent: "bg-blue-50 text-blue-700",
    offer_received: "bg-blue-50 text-blue-700",
    accepted: "bg-emerald-50 text-emerald-700",
    declined: "bg-rose-50 text-rose-700",
    expired: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {String(status || "draft").replace(/_/g, " ")}
    </span>
  );
}

export default function Offers() {
  const alert = useAlert();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [offerTemplates, setOfferTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offerGroup, setOfferGroup] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOffer, setDetailOffer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [comments, setComments] = useState({});

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [offerResult, candidateResult, templateResult] = await Promise.all([
        apiRequest("/offers"),
        apiRequest("/candidates?limit=100&page=1&includeSelected=true"),
        apiRequest("/offers/templates"),
      ]);

      setOffers(Array.isArray(offerResult.data) ? offerResult.data : []);
      setOfferTemplates(Array.isArray(templateResult.data) ? templateResult.data : []);
      setCandidates(
        Array.isArray(candidateResult.data) ? candidateResult.data : []
      );
    } catch (err) {
      setError(err.message || "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const candidate = candidateOf(offer);
      const matchesStatus =
        !statusFilter || offer.status === statusFilter;
      const matchesGroup = offerGroup === "all" ||
        (offerGroup === "draft" ? offer.status === "draft" : offer.status !== "draft");

      const matchesSearch =
        !term ||
        [
          candidate?.name,
          candidate?.email,
          candidate?.position,
          offer.designation,
          offer.status,
          offer.templateId,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      return matchesStatus && matchesGroup && matchesSearch;
    });
  }, [offers, search, statusFilter, offerGroup]);

  const stats = {
    total: offers.length,
    drafts: offers.filter((o) => o.status === "draft").length,
    pending: offers.filter((o) => o.status === "pending_approval").length,
    sent: offers.filter((o) => o.status === "sent").length,
  };

  const candidateIdsWithOffers = new Set(
    offers.map((offer) => {
      const candidate = offer.candidateId;
      return String(candidate && typeof candidate === "object" ? candidate._id : candidate || "");
    })
  );
  const selectedCandidates = candidates.filter((candidate) => {
    const isSelected =
      String(candidate.hiringRecommendation?.status || "").toLowerCase() === "select" ||
      String(candidate.status || "").toLowerCase() === "selected";
    return isSelected && !candidateIdsWithOffers.has(String(candidate._id));
  });

  const selectedCandidate =
    candidates.find((candidate) => String(candidate._id) === String(form.candidateId)) ||
    candidateOf(editing);
  const selectedTemplate = offerTemplates.find((template) => String(template._id) === String(form.templateId));
  const autoPlaceholderValues = {
    candidate_name: selectedCandidate?.name || selectedCandidate?.fullName || "",
    employee_name: selectedCandidate?.name || selectedCandidate?.fullName || "",
    intern_name: selectedCandidate?.name || selectedCandidate?.fullName || "",
    name: selectedCandidate?.name || selectedCandidate?.fullName || "",
    candidate_email: selectedCandidate?.email || "",
    email: selectedCandidate?.email || "",
    phone: selectedCandidate?.phone || "",
    designation: form.designation || selectedCandidate?.position || "",
    position: form.designation || selectedCandidate?.position || "",
    department: selectedCandidate?.department || "",
    salary: form.salary === "" ? "" : money(form.salary),
    stipend: form.salary === "" ? "" : money(form.salary),
    joining_date: form.joiningDate ? date(`${form.joiningDate}T00:00:00`) : "",
    issue_date: date(new Date()),
    expiry_date: form.expiryDate ? date(`${form.expiryDate}T00:00:00`) : "",
    offer_type: form.offerType === "intern" ? "Intern" : "Employee",
    company_name: "HR",
  };
  const effectivePlaceholderValues = Object.fromEntries(
    (selectedTemplate?.placeholders || []).map((key) => [
      key,
      form.placeholderValues?.[key] ?? autoPlaceholderValues[key] ?? "",
    ])
  );
  const offerTemplatePreview = selectedTemplate?.htmlContent?.replace(
    /\{\{([a-zA-Z0-9_]+)\}\}/g,
    (token, key) => escapeHtml(effectivePlaceholderValues[key] ?? autoPlaceholderValues[key] ?? token)
  ) || "";

  function openCreate(candidate = null) {
    setEditing(null);
    const chosen = candidate || selectedCandidates[0] || candidates[0];
    setForm({
      ...EMPTY_FORM,
      candidateId: chosen?._id || "",
      offerType: chosen?.jobType === "internship" ? "intern" : "employee",
      designation: chosen?.position || "",
      requiredDocuments: [
        { label: "Government ID / Aadhaar", acceptedTypes: ["pdf", "jpg", "png"], required: true },
        { label: "Signed Offer Letter", acceptedTypes: ["pdf"], required: true },
      ],
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEdit(offer) {
    const candidate = candidateOf(offer);

    setEditing(offer);
    setForm({
      candidateId: candidate?._id || offer.candidateId || "",
      templateId: typeof offer.templateId === "object" ? offer.templateId?._id || "" : offer.templateId || "",
      placeholderValues: offer.placeholders || {},
      offerType: offer.offerType || "employee",
      salary: offer.salary ?? "",
      designation: offer.designation || "",
      joiningDate: offer.joiningDate
        ? new Date(offer.joiningDate).toISOString().slice(0, 10)
        : "",
      expiryDate: offer.expiryDate
        ? new Date(offer.expiryDate).toISOString().slice(0, 10)
        : "",
      requiredDocuments: Array.isArray(offer.requiredDocuments) ? offer.requiredDocuments : [],
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function saveOffer(mode = "draft") {
    const shouldSend = mode === "send";
    const showValidationError = (message, fieldName) => {
      setError(message);
      alert.toastError("Offer not saved", message);
      if (fieldName) {
        requestAnimationFrame(() => {
          const field = document.querySelector(`[name="${fieldName}"]`);
          field?.scrollIntoView({ behavior: "smooth", block: "center" });
          field?.focus();
        });
      }
    };

    if (!form.candidateId) {
      showValidationError("Please select a candidate.", "candidateId");
      return;
    }
    if (!form.designation.trim()) {
      showValidationError("Designation is required.", "designation");
      return;
    }
    if (
      form.salary === "" ||
      !Number.isFinite(Number(form.salary)) ||
      Number(form.salary) < 0
    ) {
      showValidationError("Enter a valid non-negative salary or stipend.", "salary");
      return;
    }
    if (!form.joiningDate) {
      showValidationError("Joining date is required.", "joiningDate");
      return;
    }
    if (shouldSend) {
      const confirmed = await alert.confirm({
        title: "Send offer now?",
        message: `Send this offer to ${selectedCandidate?.name || selectedCandidate?.email || "the candidate"}? They will be notified.`,
        confirmText: "Send offer",
        type: "warning",
      });
      if (!confirmed) return;
    }

    const body = {
      offerType: form.offerType || "employee",
      salary: Number(form.salary),
      designation: form.designation.trim(),
      joiningDate: new Date(
        `${form.joiningDate}T00:00:00`
      ).toISOString(),
      requiredDocuments: (form.requiredDocuments || []).filter((d) => d.label && d.label.trim()),
      templateId: form.templateId || "",
      placeholders: effectivePlaceholderValues,
    };

    if (form.expiryDate) {
      body.expiryDate = new Date(`${form.expiryDate}T00:00:00`).toISOString();
    }

    if (!editing) {
      body.candidateId = form.candidateId;
      body.sendImmediately = shouldSend;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      let result = await apiRequest(
        editing ? `/offers/${editing._id}` : "/offers",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );
      if (editing && shouldSend) {
        result = await apiRequest(`/offers/${editing._id}/send`, { method: "PATCH" });
      }

      setShowForm(false);
      setNotice(result.message || "Offer saved successfully.");
      await loadOffers();
    } catch (err) {
      setError(err.message || "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  }

  async function action(offer, suffix, body) {
    if (suffix === "/send") {
      const candidate = candidateOf(offer);
      const confirmed = await alert.confirm({
        title: "Send offer?",
        message: `Send this offer to ${candidate?.name || candidate?.email || "the candidate"}? They will be notified.`,
        confirmText: "Send offer",
        type: "warning",
      });
      if (!confirmed) return;
    }
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/offers/${offer._id}${suffix}`, {
        method: "PATCH",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      setNotice(result.message || "Offer updated successfully.");
      await loadOffers();
    } catch (err) {
      setError(err.message || "Offer action failed.");
    }
  }

  async function removeDraft(offer) {
    if (offer.status !== "draft") {
      setError("Only draft offers can be deleted.");
      return;
    }

    const confirmed = await alert.confirm({
      title: "Delete draft offer?",
      message: "Delete this draft offer?",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      const result = await apiRequest(`/offers/${offer._id}`, {
        method: "DELETE",
      });
      setNotice(result.message || "Draft deleted.");
      setError("");
      await loadOffers();
    } catch (err) {
      setError(err.message || "Unable to delete offer.");
    }
  }

  async function downloadPdf(offer) {
    try {
      const response = await apiRequest(`/offers/${offer._id}/pdf`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `offer-${offer._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice("Offer PDF downloaded.");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to download PDF.");
    }
  }

  async function review(offer, approvalAction) {
    const comment = comments[offer._id] || "";

    if (approvalAction === "rejected" && !comment.trim()) {
      setError("A comment is required to reject an offer.");
      return;
    }

    await action(offer, "/approval", {
      action: approvalAction,
      comments: comment,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            HR Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Offers
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create offers, manage approvals and track offer status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadOffers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={candidates.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={17} />
            Create Offer
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total offers", value: stats.total, icon: FileDown, tone: "bg-blue-50 text-blue-600" },
          { label: "Drafts", value: stats.drafts, icon: Pencil, tone: "bg-slate-100 text-slate-600" },
          { label: "Pending approval", value: stats.pending, icon: Clock3, tone: "bg-amber-50 text-amber-600" },
          { label: "Sent", value: stats.sent, icon: Send, tone: "bg-emerald-50 text-emerald-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${item.tone}`}>
                  <Icon size={21} />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Selected by Hiring Manager
            <span className="ml-2 text-sm font-medium text-slate-500">
              ({selectedCandidates.length} awaiting offer)
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Candidates recommended for selection are ready for HR to prepare an offer.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading selected candidates...</div>
        ) : selectedCandidates.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No candidates are currently awaiting an offer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-5 py-3 font-semibold">Candidate</th>
                  <th className="border-b border-slate-200 px-5 py-3 font-semibold">Position</th>
                  <th className="border-b border-slate-200 px-5 py-3 font-semibold">Interview evaluation</th>
                  <th className="border-b border-slate-200 px-5 py-3 font-semibold">Hiring manager feedback</th>
                  <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedCandidates.map((candidate) => {
                  const latestInterview = candidate.interviews?.[candidate.interviews.length - 1];
                  return (
                    <tr key={candidate._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {candidate.name || candidate.fullName || "Candidate"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{candidate.email || "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <p>{candidate.position || "—"}</p>
                        <p className="mt-1 text-xs text-slate-500">{candidate.department || "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {latestInterview?.score != null ? `${latestInterview.score}/100` : "—"}
                        {latestInterview?.rating != null && (
                          <span className="ml-2 text-xs text-slate-500">{latestInterview.rating}/5 stars</span>
                        )}
                      </td>
                      <td className="max-w-xs whitespace-normal px-5 py-4 text-slate-700">
                        {candidate.hiringRecommendation?.comments || "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openCreate(candidate)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <Plus size={14} />
                          Create offer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate or designation..."
            className="w-full min-w-0 border-0 bg-transparent py-3 text-sm outline-none"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Offer categories">
        {[
          { id: "all", label: "All Offers" },
          { id: "draft", label: "Draft Offers" },
          { id: "sent", label: "Sent Offers" },
        ].map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={offerGroup === group.id}
            onClick={() => setOfferGroup(group.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${offerGroup === group.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            {group.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          {
            key: "candidate",
            label: "Candidate",
            render: (offer) => {
              const candidate = candidateOf(offer);
              return (
                <div className="min-w-36">
                  <p className="font-semibold text-slate-800">
                    {candidate?.name || candidate?.fullName || "Candidate unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {candidate?.email || "—"}
                  </p>
                </div>
              );
            },
          },
          {
            key: "designation",
            label: "Designation",
            render: (offer) => offer.designation || "—",
          },
          {
            key: "salary",
            label: "Annual salary",
            render: (offer) => money(offer.salary),
          },
          {
            key: "joiningDate",
            label: "Joining date",
            render: (offer) => date(offer.joiningDate),
          },
          {
            key: "sentAt",
            label: "Sent date",
            render: (offer) => date(offer.sentAt),
          },
          {
            key: "status",
            label: "Status",
            render: (offer) => <StatusBadge status={offer.status} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (offer) => (
              <div className="flex min-w-40 flex-wrap items-center gap-2">
                <button type="button" onClick={() => setDetailOffer(offer)} title="View offer details" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                  <Eye size={15} />
                </button>
                {offer.status === "draft" && (
                  <>
                    <button type="button" onClick={() => openEdit(offer)} title="Edit draft" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => action(offer, "/submit")} title="Submit for approval" className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50">
                      <CheckCircle2 size={15} />
                    </button>
                    <button type="button" onClick={() => removeDraft(offer)} title="Delete draft" className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}

                {offer.status === "pending_approval" && (
                  <div className="flex flex-col gap-2">
                    <input
                      value={comments[offer._id] || ""}
                      onChange={(e) => setComments((current) => ({
                        ...current,
                        [offer._id]: e.target.value,
                      }))}
                      placeholder="Comment to reject"
                      className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => review(offer, "approved")} title="Approve" className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50">
                        <CheckCircle2 size={15} />
                      </button>
                      <button type="button" onClick={() => review(offer, "rejected")} title="Reject" className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50">
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {offer.status === "approved" && (
                  <button type="button" onClick={() => action(offer, "/send")} title="Mark as sent" className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50">
                    <Send size={15} />
                  </button>
                )}

                {["approved", "sent", "expired"].includes(offer.status) && (
                  <button type="button" onClick={() => downloadPdf(offer)} title="Download PDF" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                    <FileDown size={15} />
                  </button>
                )}

                {offer.status === "sent" && (
                  <button type="button" onClick={() => action(offer, "/expire")} title="Expire offer" className="rounded-lg border border-violet-200 p-2 text-violet-700 hover:bg-violet-50">
                    <Clock3 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={filteredOffers}
        loading={loading}
        emptyMessage={
          error
            ? "Offers could not be loaded. Check the error above."
            : search || statusFilter
              ? "No offers match your filters."
              : "No offers have been created yet."
        }
        getRowKey={(offer) => offer._id}
      />

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-form-title"
            className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="offer-form-title" className="text-xl font-bold text-slate-900">
                  {editing ? "Edit offer draft" : "Create offer draft"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  To send this offer, provide a designation, salary or stipend, and joining date.
                </p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={19} />
              </button>
            </div>

            <form noValidate onSubmit={(event) => { event.preventDefault(); saveOffer("draft"); }} className="space-y-4">
              {error && (
                <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Offer letter template</span>
                  <select
                    value={form.templateId || ""}
                    onChange={(event) => setForm((current) => ({ ...current, templateId: event.target.value, placeholderValues: {} }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Use the standard offer letter</option>
                    {offerTemplates.map((template) => <option key={template._id} value={template._id}>{template.name} · v{template.version || 1}</option>)}
                  </select>
                  {!offerTemplates.length && <span className="mt-1 block text-xs text-slate-500">No active offer templates are available. An admin can create one in Templates.</span>}
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Candidate</span>
                  <select
                    name="candidateId"
                    required
                    value={form.candidateId}
                    disabled={Boolean(editing)}
                    onChange={(e) => {
                      const candidate = candidates.find(
                        (item) => String(item._id) === e.target.value
                      );
                      setForm((current) => ({
                        ...current,
                        candidateId: e.target.value,
                        designation: candidate?.position || current.designation,
                        placeholderValues: {},
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:bg-slate-50"
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.name || candidate.fullName || candidate.email || candidate._id}
                        {candidate.email ? ` — ${candidate.email}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedCandidate && (
                  <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-900">Candidate details</h3>
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Name</dt>
                        <dd className="mt-0.5 font-semibold text-slate-800">
                          {selectedCandidate.name || selectedCandidate.fullName || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Email</dt>
                        <dd className="mt-0.5 break-all text-slate-800">{selectedCandidate.email || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Phone</dt>
                        <dd className="mt-0.5 text-slate-800">{selectedCandidate.phone || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Applied position</dt>
                        <dd className="mt-0.5 text-slate-800">{selectedCandidate.position || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Department</dt>
                        <dd className="mt-0.5 text-slate-800">{selectedCandidate.department || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Application status</dt>
                        <dd className="mt-0.5 capitalize text-slate-800">{selectedCandidate.status || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">Applied date</dt>
                        <dd className="mt-0.5 text-slate-800">{date(selectedCandidate.appliedDate || selectedCandidate.createdAt)}</dd>
                      </div>
                      {selectedCandidate.resumeUrl && (
                        <div>
                          <dt className="text-xs font-medium text-slate-500">Resume</dt>
                          <dd className="mt-1">
                            <a
                              href={selectedCandidate.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                            >
                              View resume <ExternalLink size={14} />
                            </a>
                          </dd>
                        </div>
                      )}
                      {detailOffer && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
                          <section role="dialog" aria-modal="true" className="my-auto w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
                            <header className="flex items-start justify-between gap-3">
                              <div>
                                <h2 className="text-xl font-bold text-slate-900">Offer details</h2>
                                <p className="text-sm text-slate-500">{candidateOf(detailOffer)?.name || candidateOf(detailOffer)?.email || "Candidate"}</p>
                              </div>
                              <button type="button" onClick={() => setDetailOffer(null)} aria-label="Close offer details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
                            </header>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                              <div><dt className="text-slate-500">Designation</dt><dd className="font-semibold">{detailOffer.designation || "—"}</dd></div>
                              <div><dt className="text-slate-500">Offer type</dt><dd className="font-semibold capitalize">{detailOffer.offerType || "—"}</dd></div>
                              <div><dt className="text-slate-500">Salary / stipend</dt><dd className="font-semibold">{money(detailOffer.salary)}</dd></div>
                              <div><dt className="text-slate-500">Joining date</dt><dd className="font-semibold">{date(detailOffer.joiningDate)}</dd></div>
                              <div><dt className="text-slate-500">Status</dt><dd><StatusBadge status={detailOffer.status} /></dd></div>
                              <div><dt className="text-slate-500">Sent date</dt><dd className="font-semibold">{date(detailOffer.sentAt || detailOffer.updatedAt)}</dd></div>
                            </dl>
                            <div className="border-t border-slate-100 pt-4">
                              <h3 className="font-semibold text-slate-900">Required documents</h3>
                              <ul className="mt-2 space-y-2">
                                {(detailOffer.requiredDocuments || []).map((document, index) => {
                                  const uploaded = Boolean(document.uploadedDocumentId);
                                  return (
                                    <li key={`${document.label}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                      <span>{document.label} {document.required ? "(required)" : "(optional)"}</span>
                                      <span className={uploaded ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{uploaded ? "Uploaded" : "Pending"}</span>
                                    </li>
                                  );
                                })}
                                {(detailOffer.requiredDocuments || []).length === 0 && <li className="text-sm text-slate-500">No required documents configured.</li>}
                              </ul>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                              {detailOffer.pdfUrl && <a href={detailOffer.pdfUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Offer PDF <ExternalLink size={14} className="inline" /></a>}
                              {detailOffer.signedOfferLetterUrl && <a href={detailOffer.signedOfferLetterUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Signed letter <ExternalLink size={14} className="inline" /></a>}
                              {detailOffer.status === "accepted" && <button type="button" onClick={() => { setDetailOffer(null); navigate("/hr/employees"); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Ready for conversion</button>}
                            </div>
                          </section>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Offer Type</span>
                  <select
                    value={form.offerType || "employee"}
                    onChange={(e) => setForm((f) => ({ ...f, offerType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="employee">Full-time Employee</option>
                    <option value="intern">Intern</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Designation</span>
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Salary / Stipend</span>
                  <input
                    name="salary"
                    type="number"
                    min="0"
                    step="any"
                    value={form.salary}
                    onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Joining date</span>
                  <input
                    name="joiningDate"
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Expiry date (Optional)</span>
                  <input
                    type="date"
                    value={form.expiryDate || ""}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <div className="sm:col-span-2 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Required Documents for Candidate</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          requiredDocuments: [
                            ...(f.requiredDocuments || []),
                            { label: "", acceptedTypes: ["pdf", "jpg", "png"], required: true },
                          ],
                        }))
                      }
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Document
                    </button>
                  </div>
                  {(!form.requiredDocuments || form.requiredDocuments.length === 0) ? (
                    <p className="text-xs text-slate-400">No documents required. Click "+ Add Document" to add one.</p>
                  ) : (
                    form.requiredDocuments.map((doc, idx) => (
                      <div key={idx} className="grid gap-2 rounded-lg border border-slate-100 p-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                        <input
                          type="text"
                          placeholder="Document label (e.g. Aadhaar Card, Signed Offer Letter)"
                          value={doc.label}
                          onChange={(e) => {
                            const updated = [...form.requiredDocuments];
                            updated[idx].label = e.target.value;
                            setForm((f) => ({ ...f, requiredDocuments: updated }));
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                        />
                        <div className="flex flex-wrap gap-2">
                          {["pdf", "jpg", "png", "doc", "docx"].map((type) => (
                            <label key={type} className="flex items-center gap-1 text-[11px] uppercase text-slate-600">
                              <input
                                type="checkbox"
                                checked={(doc.acceptedTypes || []).includes(type)}
                                onChange={(e) => {
                                  const updated = [...form.requiredDocuments];
                                  const current = new Set(updated[idx].acceptedTypes || []);
                                  if (e.target.checked) current.add(type);
                                  else current.delete(type);
                                  updated[idx].acceptedTypes = [...current];
                                  setForm((f) => ({ ...f, requiredDocuments: updated }));
                                }}
                              />
                              {type}
                            </label>
                          ))}
                        </div>
                        <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={doc.required !== false}
                            onChange={(e) => {
                              const updated = [...form.requiredDocuments];
                              updated[idx].required = e.target.checked;
                              setForm((f) => ({ ...f, requiredDocuments: updated }));
                            }}
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.requiredDocuments.filter((_, i) => i !== idx);
                            setForm((f) => ({ ...f, requiredDocuments: updated }));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {selectedTemplate && (
                  <section className="space-y-4 rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Template placeholders</h3>
                      <p className="mt-1 text-xs text-slate-500">Values are filled from the candidate and offer details where possible. Edit any value before saving or sending.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(selectedTemplate.placeholders || []).map((key) => (
                        <label key={key} className="block">
                          <span className="mb-1 block text-xs font-medium text-slate-600">{key.replace(/_/g, " ")}</span>
                          <input
                            value={effectivePlaceholderValues[key] || ""}
                            onChange={(event) => setForm((current) => ({ ...current, placeholderValues: { ...current.placeholderValues, [key]: event.target.value } }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Offer letter preview</h4>
                      <iframe title="Rendered offer template preview" sandbox="" srcDoc={offerTemplatePreview} className="h-72 w-full rounded-lg border border-slate-200 bg-white" />
                    </div>
                  </section>
                )}

              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                {error && <div role="alert" className="basis-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" disabled={saving} onClick={() => saveOffer("draft")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save changes" : "Save as Draft"}
                </button>
                {!editing && (
                  <button type="button" disabled={saving} onClick={() => saveOffer("send")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save & Send"}
                  </button>
                )}
                {editing && (
                  <button type="button" disabled={saving} onClick={() => saveOffer("send")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Sending..." : "Save & Send"}
                </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

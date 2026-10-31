
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, RefreshCw, Pencil, Trash2, Send,
  FileDown, CheckCircle2, XCircle, Clock3, X,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";

const EMPTY_FORM = {
  candidateId: "",
  salary: "",
  designation: "",
  joiningDate: "",
  template: "default",
};

const STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Sent",
  "Expired",
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

function candidateOf(offer) {
  return offer?.candidateId && typeof offer.candidateId === "object"
    ? offer.candidateId
    : null;
}

function StatusBadge({ status }) {
  const styles = {
    Draft: "bg-slate-100 text-slate-700",
    "Pending Approval": "bg-amber-50 text-amber-700",
    Approved: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-rose-50 text-rose-700",
    Sent: "bg-blue-50 text-blue-700",
    Expired: "bg-violet-50 text-violet-700",
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Draft}`}>
      {status || "Draft"}
    </span>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [comments, setComments] = useState({});

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [offerResult, candidateResult] = await Promise.all([
        apiRequest("/offers"),
        apiRequest("/candidates?limit=100&page=1"),
      ]);

      setOffers(Array.isArray(offerResult.data) ? offerResult.data : []);
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

      const matchesSearch =
        !term ||
        [
          candidate?.name,
          candidate?.email,
          candidate?.position,
          offer.designation,
          offer.status,
          offer.template,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      return matchesStatus && matchesSearch;
    });
  }, [offers, search, statusFilter]);

  const stats = {
    total: offers.length,
    drafts: offers.filter((o) => o.status === "Draft").length,
    pending: offers.filter((o) => o.status === "Pending Approval").length,
    sent: offers.filter((o) => o.status === "Sent").length,
  };

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      candidateId: candidates[0]?._id || "",
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
      salary: offer.salary ?? "",
      designation: offer.designation || "",
      joiningDate: offer.joiningDate
        ? new Date(offer.joiningDate).toISOString().slice(0, 10)
        : "",
      template: offer.template || "default",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function saveOffer(event) {
    event.preventDefault();

    if (!form.candidateId) {
      setError("Please select a candidate.");
      return;
    }
    if (!form.designation.trim()) {
      setError("Designation is required.");
      return;
    }
    if (
      form.salary === "" ||
      !Number.isFinite(Number(form.salary)) ||
      Number(form.salary) < 0
    ) {
      setError("Enter a valid non-negative salary.");
      return;
    }
    if (!form.joiningDate) {
      setError("Joining date is required.");
      return;
    }

    const body = {
      salary: Number(form.salary),
      designation: form.designation.trim(),
      joiningDate: new Date(
        `${form.joiningDate}T00:00:00`
      ).toISOString(),
      template: form.template.trim() || "default",
    };

    if (!editing) body.candidateId = form.candidateId;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(
        editing ? `/offers/${editing._id}` : "/offers",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );

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
    if (offer.status !== "Draft") {
      setError("Only draft offers can be deleted.");
      return;
    }

    if (!window.confirm("Delete this draft offer?")) return;

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
            key: "status",
            label: "Status",
            render: (offer) => <StatusBadge status={offer.status} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (offer) => (
              <div className="flex min-w-40 flex-wrap items-center gap-2">
                {offer.status === "Draft" && (
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

                {offer.status === "Pending Approval" && (
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

                {offer.status === "Approved" && (
                  <button type="button" onClick={() => action(offer, "/send")} title="Mark as sent" className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50">
                    <Send size={15} />
                  </button>
                )}

                {["Approved", "Sent", "Expired"].includes(offer.status) && (
                  <button type="button" onClick={() => downloadPdf(offer)} title="Download PDF" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                    <FileDown size={15} />
                  </button>
                )}

                {offer.status === "Sent" && (
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
                  Enter the offer details below.
                </p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveOffer} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Candidate</span>
                  <select
                    required
                    value={form.candidateId}
                    disabled={Boolean(editing)}
                    onChange={(e) => setForm((f) => ({ ...f, candidateId: e.target.value }))}
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

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Designation</span>
                  <input
                    required
                    value={form.designation}
                    onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                    placeholder="Software Developer"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Annual salary (₹)</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.salary}
                    onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                    placeholder="600000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Joining date</span>
                  <input
                    required
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Template</span>
                  <input
                    value={form.template}
                    onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
                    placeholder="default"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save changes" : "Create offer draft"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

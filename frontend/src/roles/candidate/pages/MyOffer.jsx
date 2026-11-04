import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../api.js";
import { useAlert } from "../../../components/AlertProvider.jsx";
import FileUpload from "../../../components/FileUpload.jsx";
import Spinner from "../../../components/Spinner.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

function formatDate(val) {
  if (!val) return "Not specified";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Not specified";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amt) {
  if (amt === undefined || amt === null || amt === "") return "As per agreement";
  const num = Number(amt);
  return isNaN(num) ? amt : `₹${num.toLocaleString("en-IN")}`;
}

export default function MyOffer() {
  const alert = useAlert();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({}); // { [requiredDocId]: File }
  const [signedLetter, setSignedLetter] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState("");

  const loadOffer = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/candidate/offer");
      setOffer(res.data || null);
    } catch (err) {
      console.error("Failed to load offer:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffer();
  }, []);

  const handleAccept = async () => {
    if (!signedLetter) {
      await alert.alert({
        title: "Missing Document",
        message: "Please upload your signed offer letter before accepting.",
        type: "warning",
      });
      return;
    }

    const requiredDocs = offer.requiredDocuments || [];
    const missing = requiredDocs.filter(rd => rd.required && !files[rd.id] && !rd.uploadedDocument);
    if (missing.length > 0) {
      await alert.alert({
        title: "Missing Required Documents",
        message: `Please upload the required document(s): ${missing.map(m => m.label).join(", ")}`,
        type: "warning",
      });
      return;
    }

    const confirmed = await alert.confirm({
      title: "Accept Offer?",
      message:
        "You are about to accept the offer and submit your signed documents. This will notify HR to finalize your account conversion.",
      type: "success",
      confirmText: "Accept Offer",
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("signedOfferLetter", signedLetter);
      if (candidateNotes) {
        fd.append("candidateNotes", candidateNotes);
      }

      requiredDocs.forEach(rd => {
        if (files[rd.id]) {
          fd.append(`doc_${rd.id}`, files[rd.id]);
        }
      });

      const token = localStorage.getItem("hr-auth-token") || localStorage.getItem("token");
      const res = await fetch("/api/v1/candidate/offer/accept", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to accept offer");
      }

      await alert.alert({
        title: "Offer Accepted!",
        message: "Your acceptance and documents were submitted successfully. HR will review them and convert your account shortly.",
        type: "success",
      });

      await loadOffer();
    } catch (err) {
      await alert.alert({
        title: "Submission Failed",
        message: err.message || "An error occurred while accepting the offer.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    const confirmed = await alert.confirm({
      title: "Decline Offer?",
      message:
        "Are you sure you want to decline this job offer? This action is permanent and cannot be undone.",
      type: "danger",
      confirmText: "Decline Offer",
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      await apiRequest("/candidate/offer/decline", {
        method: "POST",
        body: { reason: "Declined by candidate" },
      });

      await alert.alert({
        title: "Offer Declined",
        message: "You have declined the offer letter. Your application status has been updated.",
        type: "info",
      });

      await loadOffer();
    } catch (err) {
      await alert.alert({
        title: "Error",
        message: err.message || "Failed to decline the offer.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner message="Loading your offer letter..." />;

  if (!offer) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          title="No offer letter available yet"
          message="Once your interviews and evaluations are complete, HR will generate and send your official offer letter here."
          action={
            <Link
              to="/candidate"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const isAccepted = offer.status === "accepted";
  const isDeclined = offer.status === "declined" || offer.status === "rejected";
  const pdfUrl = offer.pdfUrl || `/api/v1/offers/${offer._id}/pdf`;
  const requiredDocs = offer.requiredDocuments || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
          <Link to="/candidate" className="hover:text-slate-600 transition">
            Candidate Portal
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Offer Letter</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Job Offer: {offer.position || "Position"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Issued on {formatDate(offer.createdAt)} · Role Type:{" "}
              <span className="font-semibold text-slate-700 capitalize">
                {offer.offerType || "Full-time"}
              </span>
            </p>
          </div>

          <div>
            {isAccepted && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Offer Accepted
              </span>
            )}
            {isDeclined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-bold text-rose-800">
                <XCircle className="h-4 w-4" />
                Offer Declined
              </span>
            )}
            {!isAccepted && !isDeclined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800">
                <Clock className="h-4 w-4" />
                Awaiting Acceptance
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Offer Summary Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Briefcase className="h-3.5 w-3.5" />
              Designation
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {offer.position || "Role"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Building className="h-3.5 w-3.5" />
              Department
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {offer.department || "General"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <DollarSign className="h-3.5 w-3.5" />
              {offer.offerType === "intern" ? "Monthly Stipend" : "Annual CTC"}
            </div>
            <p className="mt-1.5 text-sm font-bold text-emerald-600">
              {formatCurrency(offer.offerType === "intern" ? offer.stipend : offer.salary)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Joining Date
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {formatDate(offer.joiningDate || offer.startDate)}
            </p>
          </div>
        </div>

        {/* PDF Download Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Official Offer Letter Document
              </p>
              <p className="text-[11px] text-slate-500">
                Review the formal terms and conditions before signing.
              </p>
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Download Offer PDF
          </a>
        </div>
      </div>

      {/* If Accepted: Show confirmation & status */}
      {isAccepted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-2xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">
                Offer Acceptance Confirmed
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                You accepted this offer on {formatDate(offer.acceptedAt || offer.updatedAt)}.
                Your submitted documents are undergoing verification by HR.
              </p>
            </div>
          </div>

          {offer.signedOfferLetterUrl && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3.5 border border-emerald-100 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Signed Offer Letter</span>
              </div>
              <a
                href={offer.signedOfferLetterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                View Signed Letter
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* If Declined: Show notice */}
      {isDeclined && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-2xs flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-950">Offer Declined</h3>
            <p className="text-xs text-rose-800 mt-1">
              You declined this offer on {formatDate(offer.declinedAt || offer.updatedAt)}.
            </p>
          </div>
        </div>
      )}

      {/* Acceptance & Document Upload Form (Only if awaiting acceptance) */}
      {!isAccepted && !isDeclined && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Accept Offer & Upload Required Documents
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Please download the offer letter PDF above, sign it, and upload the signed copy along with all required verification documents.
            </p>
          </div>

          <div className="space-y-4">
            <FileUpload
              label="Signed Offer Letter (PDF)"
              accept="application/pdf"
              required={true}
              helperText="Upload your physically or digitally signed offer letter copy (PDF only)"
              onChange={setSignedLetter}
            />

            {requiredDocs.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Required Onboarding Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredDocs.map(rd => {
                    const acceptStr = (rd.acceptedTypes || ["pdf", "jpg", "png"])
                      .map(t => (t === "jpg" ? "image/jpeg" : t === "png" ? "image/png" : t === "pdf" ? "application/pdf" : t))
                      .join(",");

                    return (
                      <div key={rd.id} className="space-y-1">
                        <FileUpload
                          label={rd.label}
                          required={Boolean(rd.required)}
                          accept={acceptStr}
                          helperText={`Formats: ${(rd.acceptedTypes || []).join(", ")}`}
                          onChange={f => setFiles(prev => ({ ...prev, [rd.id]: f }))}
                        />
                        {rd.uploadedDocument && (
                          <p className="text-[11px] text-emerald-600 font-medium">
                            ✓ Document previously uploaded
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Candidate Notes / Comments (Optional)
              </label>
              <textarea
                rows={2}
                value={candidateNotes}
                onChange={e => setCandidateNotes(e.target.value)}
                placeholder="Any special remarks or notes for HR..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDecline}
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl border border-rose-300 px-5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
            >
              Decline Offer
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? "Submitting Acceptance..." : "Accept Offer & Submit Documents"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

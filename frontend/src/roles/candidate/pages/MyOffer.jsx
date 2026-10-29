
import { useEffect, useState } from "react";
import { getMyOffer } from "../services/candidateService.js";
import EmptyState from "../components/EmptyState.jsx";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

function formatAmount(value, currency = "INR") {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function MyOffer() {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOffer() {
      try {
        setLoading(true);
        setError("");

        const result = await getMyOffer();

        if (!cancelled) {
          setOffer(result.offer ?? result.data?.offer ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your offer.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOffer();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 w-52 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <header>
        <p className="text-sm text-slate-500">
          Workspace <span className="mx-2">›</span> My Offer
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          My Offer
        </h1>

        <p className="mt-2 text-slate-500">
          Review the offer details associated with your application.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!offer ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="No offer available"
            description="An offer will appear here when one is associated with your account."
          />
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#111C2E] p-6 text-white sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm text-slate-300">Employment offer</p>

                <h2 className="mt-2 text-2xl font-bold">
                  {offer.designation || "Position not available"}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Offer details and joining information
                </p>
              </div>

              <ApplicationStatusBadge
                status={offer.status || "Not available"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 sm:p-8">
            <div>
              <p className="text-sm text-slate-500">Offer Type</p>
              <p className="mt-2 font-semibold capitalize text-slate-900">
                {offer.offerType || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Salary / Stipend
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {formatAmount(offer.salary, offer.currency || "INR")}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Joining Date</p>
              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(offer.joiningDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Offer Created</p>
              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(offer.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Offer Expiry</p>
              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(offer.expiryDate || offer.expiresAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Approval Status</p>
              <p className="mt-2 font-semibold text-slate-900">
                {offer.approvalStatus || "Not available"}
              </p>
            </div>
          </div>

          {offer.pdfUrl && (
            <div className="border-t border-slate-100 p-6 sm:px-8">
              <a
                href={offer.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Offer Letter
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}


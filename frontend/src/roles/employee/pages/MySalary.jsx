
import { useEffect, useState } from "react";
import { getMySalaryBreakdown } from "../services/employeeService.js";

function SalaryCard({ title, amount, description, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <h2
        className={`mt-3 text-2xl font-bold ${
          highlight ? "text-blue-700" : "text-slate-900"
        }`}
      >
        {amount}
      </h2>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MySalary() {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSalary() {
      try {
        setLoading(true);
        setError("");

        const response = await getMySalaryBreakdown();

        setSalary(response.salary || null);
      } catch (err) {
        setError(err.message || "Unable to load salary details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSalary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Salary
        </h1>

        <p className="mt-2 text-slate-500">
          View your salary breakdown and compensation details.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Loading salary details...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load salary details
          </h2>

          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Salary Details */}
      {!loading && !error && salary && (
        <>
          {/* Total CTC */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Cost to Company (CTC)
            </p>

            <h2 className="mt-3 text-4xl font-bold text-blue-700">
              {formatCurrency(salary.totalCTC)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your total annual compensation as recorded in the system.
            </p>
          </div>

          {/* Salary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SalaryCard
              title="Basic Salary"
              amount={formatCurrency(salary.basic)}
              description="Basic salary component"
            />

            <SalaryCard
              title="HRA"
              amount={formatCurrency(salary.hra)}
              description="House Rent Allowance"
            />

            <SalaryCard
              title="Allowances"
              amount={formatCurrency(salary.allowances)}
              description="Other salary allowances"
            />

            <SalaryCard
              title="PF"
              amount={formatCurrency(salary.pf)}
              description="Provident Fund"
            />
          </div>

          {/* Salary Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Salary Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Salary details are fetched from your employee record.
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                      Component
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      Basic Salary
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(salary.basic)}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      HRA
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(salary.hra)}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      Allowances
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(salary.allowances)}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      Provident Fund (PF)
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(salary.pf)}
                    </td>
                  </tr>

                  <tr className="bg-blue-50">
                    <td className="px-4 py-4 text-sm font-bold text-slate-900">
                      Total CTC
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-blue-700">
                      {formatCurrency(salary.totalCTC)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



export default function DataTable({
  columns = [],
  data = [],
  getRowKey,
  emptyMessage = "No records found.",
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading records...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap border-b border-slate-200 px-5 py-4 font-semibold text-slate-600"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={
                    getRowKey
                      ? getRowKey(record)
                      : record._id || record.id || index
                  }
                  className="transition hover:bg-slate-50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-5 py-4 text-slate-700"
                    >
                      {column.render
                        ? column.render(record)
                        : record[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

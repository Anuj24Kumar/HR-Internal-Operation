import { Loader2 } from "lucide-react";

export default function Spinner({
  size = "md",
  message = "Loading...",
  className = "",
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center text-slate-500 ${className}`}
    >
      <Loader2
        className={`animate-spin text-blue-600 ${sizeClasses[size] || sizeClasses.md}`}
      />
      {message && <p className="mt-3 text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
}

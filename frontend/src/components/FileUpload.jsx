import { useRef, useState } from "react";
import { UploadCloud, File, X, Check } from "lucide-react";

export default function FileUpload({
  label = "Upload File",
  accept = "*",
  required = false,
  onChange,
  value = null,
  helperText = "",
  className = "",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (onChange) onChange(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onChange) onChange(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <File className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              Selected
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600 transition"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
            disabled
              ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-200"
              : isDragging
              ? "border-blue-500 bg-blue-50/60"
              : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-50"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-2xs text-slate-500 mb-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {helperText || `Accepted formats: ${accept === "*" ? "All files" : accept}`}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Folder,
  File,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  name: string;
  status: UploadStatus;
  message?: string;
}

interface ServerDocument {
  id: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  status: string;
  chunk_count: number;
  created_at: string;
}

export default function KnowledgePage() {
  const { ensureAuth } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [existingDocs, setExistingDocs] = useState<ServerDocument[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const token = await ensureAuth();
      if (!token) return;

      const res = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExistingDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((f) =>
      [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ].includes(f.type) ||
      f.name.endsWith(".txt") ||
      f.name.endsWith(".md") ||
      f.name.endsWith(".pdf") ||
      f.name.endsWith(".docx")
    );

    if (accepted.length === 0) return;

    const token = await ensureAuth();
    if (!token) {
      alert("Authentication error — please refresh.");
      return;
    }

    const newEntries: UploadedFile[] = accepted.map((f) => ({
      name: f.name,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...newEntries]);

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (res.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? {
                    ...f,
                    status: "success",
                    message: `Ingested (${data.chunk_count || 1} chunks ready)`,
                  }
                : f
            )
          );
          loadDocuments();
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "error", message: data.detail || "Upload failed" }
                : f
            )
          );
        }
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "error", message: err.message || "Network error" }
              : f
          )
        );
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-full chronotask-canvas text-[#1F2937] p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Knowledge &amp; Portfolios
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Connect documents, notes, policies, and personal context.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#374151] bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-xl hover:bg-[#F9FAFB] shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? "animate-spin" : ""}`} />
          <span>Refresh Files</span>
        </button>
      </div>

      {/* ── Dropzone & Upload Card ── */}
      <div
        className={`card-chronotask p-8 text-center transition-all cursor-pointer mb-8 ${
          dragging
            ? "border-[#2563EB] bg-[#EFF6FF]"
            : "border-[#E5E7EB] bg-white hover:border-[#93C5FD]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#111827] mb-1">
          Upload documents to build your personal knowledge
        </h3>
        <p className="text-xs text-[#6B7280] mb-4">
          Drag &amp; drop PDF, DOCX, TXT, or Markdown files here · Max 50MB
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          Choose Local Files
        </span>
        <input
          id="file-input"
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Active Uploads */}
      {files.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-3">
            Recent Uploads
          </h3>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="card-chronotask px-4 py-3 flex items-center gap-3 text-xs"
              >
                <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="flex-1 font-semibold text-[#111827] truncate">
                  {file.name}
                </span>
                {file.status === "uploading" && (
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                    <span>Processing &amp; Chunking...</span>
                  </div>
                )}
                {file.status === "success" && (
                  <div className="flex items-center gap-1.5 text-[#059669] font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
                {file.status === "error" && (
                  <div className="flex items-center gap-1.5 text-[#DC2626]">
                    <AlertCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Library Table */}
      <div className="card-chronotask overflow-hidden">
        <div className="p-5 border-b border-[#F3F4F6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#111827]">
              Indexed Documents ({existingDocs.length})
            </h2>
          </div>
          <span className="text-xs text-[#6B7280]">Vector Database</span>
        </div>

        {loadingDocs ? (
          <div className="py-16 text-center text-xs text-[#6B7280] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
            <span>Loading contextual documents...</span>
          </div>
        ) : existingDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            No documents uploaded yet. Upload files above to populate your personal context.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#F3F4F6]">
                <tr>
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-5">Format</th>
                  <th className="py-3 px-5">Size</th>
                  <th className="py-3 px-5">Chunks</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {existingDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#4B5563] shrink-0" />
                        <span className="font-semibold text-[#111827] truncate max-w-sm">
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#6B7280]">
                      <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] font-medium">
                        {doc.filename.split(".").pop()?.toUpperCase() || "TXT"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#6B7280]">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#111827]">
                      {doc.chunk_count || 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669]">
                        ● Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

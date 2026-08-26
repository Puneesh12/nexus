"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Calendar,
  Layers,
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

  // Load existing documents from backend
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
          // Refresh list
          loadDocuments();
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "error", message: data.detail || "Upload rejected" }
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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="min-h-full bg-[#0A0A0D] text-[#EDEDED] px-8 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#1C1C22] gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-[#8E8E98] mt-0.5">
            Manage your connected files, documents, policies, and notes.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="text-xs text-[#A0A0AB] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#14141A] border border-[#22222B] hover:border-[#383846] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer mb-8 ${
          dragging
            ? "border-white bg-[#14141C]"
            : "border-[#242430] hover:border-[#404052] bg-[#101015]"
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
        <div className="w-10 h-10 rounded-full bg-[#181822] flex items-center justify-center text-white mx-auto mb-3">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-white mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-[#70707C] mb-4">
          PDF, DOCX, TXT, Markdown · Max 50MB
        </p>
        <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-black hover:bg-[#E5E5E5] transition-colors shadow-sm">
          Select files
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
          <h3 className="text-xs font-semibold text-[#8E8E98] uppercase tracking-wider mb-3">
            Recent Uploads
          </h3>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#22222B] bg-[#121217] text-xs"
              >
                <FileText className="w-4 h-4 text-white shrink-0" />
                <span className="flex-1 font-medium text-white truncate">{file.name}</span>
                {file.status === "uploading" && (
                  <div className="flex items-center gap-1.5 text-[#8E8E98]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
                {file.status === "success" && (
                  <div className="flex items-center gap-1.5 text-[#10B981] font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
                {file.status === "error" && (
                  <div className="flex items-center gap-1.5 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[#8E8E98] uppercase tracking-wider">
            Connected Documents ({existingDocs.length})
          </h3>
        </div>

        {loadingDocs ? (
          <div className="py-12 text-center text-xs text-[#70707C] flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span>Loading documents...</span>
          </div>
        ) : existingDocs.length === 0 ? (
          <div className="p-8 rounded-xl border border-[#1E1E26] bg-[#121217] text-center text-xs text-[#70707C]">
            No documents uploaded yet. Drag and drop your files above.
          </div>
        ) : (
          <div className="rounded-xl border border-[#1E1E26] bg-[#121217] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1E1E26] bg-[#0E0E13] text-[#70707C] font-medium">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                  <th className="py-3 px-4 hidden md:table-cell">Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E26]">
                {existingDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#16161D] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#A0A0AB] shrink-0" />
                        <span className="font-medium text-white truncate max-w-xs sm:max-w-md">
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8E98] hidden sm:table-cell">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8E98] hidden md:table-cell">
                      {doc.chunk_count || 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#10B981]/15 text-[#10B981]">
                        Indexed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#70707C] hidden sm:table-cell">
                      {formatDate(doc.created_at)}
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

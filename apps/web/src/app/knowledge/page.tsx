"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  Database,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  name: string;
  status: UploadStatus;
  message?: string;
  chunkCount?: number;
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
          // Refresh connected docs list
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

  return (
    <div className="min-h-full bg-[#0C0C10] text-[#F8F3E6] font-sans px-6 sm:px-12 py-10 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#22222E] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-[#FF6B55] uppercase">
              // KNOWLEDGE REPOSITORY
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-[#F8F3E6]">
            DOCUMENT INTELLIGENCE
          </h1>
          <p className="text-xs text-[#8E8E9B] mt-1 font-mono">
            AUTOMATIC INGESTION · RECURSIVE CHUNKING · 1536-DIM VECTOR EMBEDDING
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="text-xs font-mono text-[#D0D0E0] hover:text-white flex items-center gap-2 px-3.5 py-2 rounded bg-[#14141E] border border-[#2E2E40] hover:border-[#FF6B55] transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B55] ${loadingDocs ? "animate-spin" : ""}`} />
          <span>Sync Context</span>
        </button>
      </div>

      {/* ── Pixelate Drop Zone ── */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer pixel-grid-dense ${
          dragging
            ? "border-[#FF6B55] bg-[#1A151C]"
            : "border-[#333344] hover:border-[#FF6B55] bg-[#12121A]/60"
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
        <div className="w-12 h-12 rounded-lg bg-[#FF6B55]/10 border border-[#FF6B55]/30 flex items-center justify-center text-[#FF6B55] mx-auto mb-4">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold font-display text-[#F8F3E6] mb-1">
          Drop Files Here or Click to Upload
        </h3>
        <p className="text-xs font-mono text-[#8E8E9B] max-w-sm mx-auto mb-4">
          PDF, DOCX, TXT, Markdown · Max 50MB per file
        </p>
        <span className="inline-block text-[11px] font-mono font-bold px-3 py-1 rounded bg-[#FF6B55] text-[#0C0C10] tracking-wider uppercase shadow-[2px_2px_0px_#FFFFFF]">
          Select Local Files
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

      {/* ── Active / Recent Uploads ── */}
      {files.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-mono font-bold tracking-widest text-[#FF6B55] uppercase mb-3">
            // ACTIVE UPLOADS IN PIPELINE
          </p>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#2A2A38] bg-[#14141E]"
              >
                <FileText className="w-4 h-4 text-[#FF6B55] shrink-0" />
                <span className="flex-1 text-xs font-mono text-[#F8F3E6] truncate">{file.name}</span>
                {file.status === "uploading" && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8E8E9B]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B55]" />
                    <span>Parsing &amp; Embedding...</span>
                  </div>
                )}
                {file.status === "success" && (
                  <div className="flex items-center gap-1.5 text-[#10B981] text-xs font-mono font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
                {file.status === "error" && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
                    <AlertCircle className="w-4 h-4" />
                    <span>{file.message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ingested Context List ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono font-bold tracking-widest text-[#FF6B55] uppercase">
            // INGESTED DOCUMENTS IN CONTEXT ({existingDocs.length})
          </p>
          <span className="text-[11px] font-mono text-[#6E6E80]">PGVECTOR STORAGE</span>
        </div>

        {loadingDocs ? (
          <div className="py-12 text-center text-xs font-mono text-[#8E8E9B] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B55]" />
            <span>Loading contextual documents...</span>
          </div>
        ) : existingDocs.length === 0 ? (
          <div className="p-8 rounded-lg border border-[#22222E] bg-[#14141E] text-center text-xs font-mono text-[#8E8E9B]">
            No documents ingested yet. Upload files above to populate your personal context.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {existingDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg border border-[#252535] bg-[#14141E] hover:border-[#2563EB] transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-[#1C1C28] border border-[#2A2A3A] flex items-center justify-center text-[#FF6B55] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-mono font-bold text-[#F8F3E6] truncate">
                      {doc.filename}
                    </h4>
                    <p className="text-[10px] font-mono text-[#6E6E80] mt-0.5">
                      {doc.mime_type || "text/plain"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#20202C] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8E8E9B]">
                    {doc.chunk_count || 1} chunks
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold uppercase tracking-wider text-[10px]">
                    READY
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

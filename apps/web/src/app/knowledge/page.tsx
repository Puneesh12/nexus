"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  name: string;
  status: UploadStatus;
  message?: string;
}

export default function KnowledgePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((f) =>
      [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ].includes(f.type)
    );

    const newEntries: UploadedFile[] = accepted.map((f) => ({
      name: f.name,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...newEntries]);

    accepted.forEach(async (file, i) => {
      const idx = files.length + i;
      try {
        // TODO (Milestone 2): use actual auth token from context
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          // Authorization header will be added once auth context is wired
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setFiles((prev) =>
            prev.map((f, fi) =>
              fi === idx ? { ...f, status: "success", message: `Status: ${data.status}` } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f, fi) =>
              fi === idx ? { ...f, status: "error", message: data.detail } : f
            )
          );
        }
      } catch {
        setFiles((prev) =>
          prev.map((f, fi) =>
            fi === idx ? { ...f, status: "error", message: "Upload failed" } : f
          )
        );
      }
    });
  };

  return (
    <div className="px-10 py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Knowledge</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Upload documents to build your personal context. Supported: PDF, DOCX, TXT, Markdown.
      </p>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg px-8 py-12 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-ring bg-accent"
            : "border-border hover:border-muted-foreground"
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
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, DOCX, TXT, Markdown · Max 50MB
        </p>
        <input
          id="file-input"
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card"
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm text-foreground truncate">{file.name}</span>
              {file.status === "uploading" && (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
              {file.status === "success" && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              {file.status === "error" && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">{file.message}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

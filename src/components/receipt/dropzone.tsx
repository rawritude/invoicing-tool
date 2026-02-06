"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFileSelected, disabled }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Upload className="h-8 w-8" />
        </div>
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Drop your receipt here...</p>
        ) : (
          <>
            <p className="text-lg font-medium">
              Drag & drop your receipt here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <FileImage className="h-4 w-4" />
            Images
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            PDF
          </span>
        </div>
      </div>
    </div>
  );
}

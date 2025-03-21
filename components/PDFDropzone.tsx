"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { uploadPDF } from "@/actions/uploadPDF";
import { AlertCircle, CheckCircle, CloudUpload } from "lucide-react";
import { Button } from "./ui/button";

function PDFDropzone() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const {
    value: isFeatureEnabled,
    featureUsageExceeded,
    featureAllocation,
  } = useSchematicEntitlement("scans");

  //   console.log(isFeatureEnabled);
  //   console.log("Feature Usage: ", featureUsage);
  //   console.log("Feature Allocation: ", featureAllocation);
  //   console.log("Feature Usage Exceeded: ", featuredUsageExceeded);

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!user) {
        alert("Please sign in to upload files");
        return;
      }

      const fileArray = Array.from(files);
      const pdfFiles = fileArray.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      );

      if (pdfFiles.length === 0) {
        alert("Please drop only PDF files");
        return;
      }

      setIsUploading(true);

      try {
        // Upload files
        const newUploadedFiles: string[] = [];

        for (const file of pdfFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const result = await uploadPDF(formData);

          if (!result.success) {
            throw new Error(result.error || "Upload failed");
          }

          newUploadedFiles.push(file.name);
        }

        setUploadedFiles((prevFiles) => [...prevFiles, ...newUploadedFiles]);

        // Clear uploaded files after 5 seconds
        setTimeout(() => {
          setUploadedFiles([]);
        }, 5000);

        router.push("/receipts");
      } catch (error) {
        console.error("Upload failed: ", error);
        alert(
          `Upload failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      } finally {
        setIsUploading(false);
      }
    },
    [user, router],
  );

  // Handle file drag via native browser events for better PDF support
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    },
    [setIsDraggingOver],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
    },
    [setIsDraggingOver],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (!user) {
        alert("Please sign in to upload files");
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [user, handleUpload],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleUpload(e.target.files);
      }
    },
    [handleUpload],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isUserSignedIn = !!user;
  const canUpload = isUserSignedIn && isFeatureEnabled;

  return (
    <DndContext sensors={sensors}>
      <div className="w-full max-w-md mx-auto">
        <div
          onDragOver={canUpload ? handleDragOver : undefined}
          onDragLeave={canUpload ? handleDragLeave : undefined}
          onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
            !canUpload ? "opacity-70 cursor-not-allowed" : "",
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2" />
              <p>Uploading...</p>
            </div>
          ) : !isUserSignedIn ? (
            <>
              <CloudUpload className="mx-auto w-12 h-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Please sign in to upload files
              </p>
            </>
          ) : (
            <>
              <CloudUpload className="mx-auto w-12 h-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drop your drop PDF files here, or click to select files
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isFeatureEnabled}
                onClick={triggerFileInput}
              >
                {isFeatureEnabled ? "Select Files" : "Upgrade to Upload"}
              </Button>
            </>
          )}
        </div>
        <div className="mt-4">
          {featureUsageExceeded && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                You have exceeded your limit of {featureAllocation} scans.
                Please upgrade to continue.
              </p>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium">Uploaded Files</h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              {uploadedFiles.map((fileName, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  {fileName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DndContext>
  );
}

export default PDFDropzone;

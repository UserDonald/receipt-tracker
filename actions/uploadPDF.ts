"use server";

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server";
import { getFileDownloadUrl } from "./getFileDownloadUrl";

export async function uploadPDF(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No file uploaded",
      };
    }

    if (
      !file.type.includes("pdf") &&
      !file.name.toLocaleLowerCase().endsWith(".pdf")
    ) {
      return {
        success: false,
        error: "Only PDF files are allowed",
      };
    }

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.receipts.generateUploadUrl, {});

    // Convert file to arrayBuffer for fetch API
    const arrayBuffer = await file.arrayBuffer();

    // Upload the file to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    // Get the storage ID from the response
    const { storageId } = await uploadResponse.json();

    const receiptId = await convex.mutation(api.receipts.storeReceipt, {
      userId: user.id,
      fileName: file.name,
      fileId: storageId,
      mimeType: file.type,
      size: file.size,
    });

    // Generate the file URL
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileUrl = await getFileDownloadUrl(storageId);

    // TODO: Trigger inngest agent flow

    return {
      success: true,
      data: {
        receiptId,
        fileName: file.name,
      },
    };
  } catch (error) {
    console.error("Server action upload error: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

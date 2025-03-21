"use server";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";

/**
 * Server action to get a download URL for a file in Convex storage
 * @param fileId - The ID of the file in Convex storage
 * @returns The download URL for the file
 */

export async function getFileDownloadUrl(fileId: Id<"_storage"> | string) {
  try {
    const downloadUrl = await convex.query(api.receipts.getReceiptDownloadUrl, {
      fileId: fileId as Id<"_storage">,
    });

    if (!downloadUrl) {
      throw new Error("No download URL returned from Convex");
    }

    return {
      success: true,
      downloadUrl,
    };
  } catch (error) {
    console.error("Error generating download URL: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

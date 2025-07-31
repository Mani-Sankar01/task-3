export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Security: Ensure the path is within the uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(
      uploadsDir,
      filePath.replace(/^\/uploads\//, "")
    );

    // Check if the resolved path is within the uploads directory
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(fullPath);
    const fileName = path.basename(fullPath);

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      default:
        contentType = "application/octet-stream";
    }

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

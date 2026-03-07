import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Log the file details
    console.log("── File Upload ──");
    console.log("  Name:", file.name);
    console.log("  Type:", file.type);
    console.log("  Size:", `${(file.size / 1024).toFixed(1)} KB`);

    return NextResponse.json({
        success: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
    });
}

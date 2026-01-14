import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const demoPassword = process.env.DEMO_PASSWORD;

    // If no password is configured, allow access
    if (!demoPassword) {
      return NextResponse.json({ success: true });
    }

    // Check password
    if (password === demoPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

// Also expose a GET endpoint to check if auth is required
export async function GET() {
  const isProtected = !!process.env.DEMO_PASSWORD;
  return NextResponse.json({ protected: isProtected });
}

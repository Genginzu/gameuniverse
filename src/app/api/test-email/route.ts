import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/resend";

// Route de test pour vérifier l'envoi d'emails (développement uniquement)
export async function GET(request: NextRequest) {
  // Vérifier que nous sommes en développement
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoint only available in development" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const email = searchParams.get("email") || "test@example.com";
  const locale = searchParams.get("locale") || "fr";

  try {
    let result;

    switch (type) {
      case "verification":
        result = await sendVerificationEmail({
          email,
          confirmationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm?token=test-token-123&type=signup&redirect_to=${encodeURIComponent("/dashboard")}`,
          locale,
        });
        break;

      case "reset":
        result = await sendPasswordResetEmail({
          email,
          resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=test-reset-token-123&type=recovery`,
          locale,
        });
        break;

      default:
        return NextResponse.json(
          {
            error: "Invalid type parameter",
            usage: {
              verification: "/api/test-email?type=verification&email=test@example.com&locale=fr",
              reset: "/api/test-email?type=reset&email=test@example.com&locale=en",
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      details: {
        email,
        locale,
        messageId: result.data?.id,
      },
      result,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Route POST pour tester avec des données personnalisées
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoint only available in development" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { type, email, locale = "fr", customUrl } = body;

    if (!type || !email) {
      return NextResponse.json(
        {
          error: "Missing required fields: type and email",
        },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "verification":
        result = await sendVerificationEmail({
          email,
          confirmationUrl:
            customUrl ||
            `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm?token=test-token-123`,
          locale,
        });
        break;

      case "reset":
        result = await sendPasswordResetEmail({
          email,
          resetUrl:
            customUrl ||
            `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=test-reset-token-123`,
          locale,
        });
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid type. Use "verification" or "reset"',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      details: {
        email,
        locale,
        messageId: result.data?.id,
      },
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

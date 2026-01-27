import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/resend";

// Client Supabase avec service role key pour les webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, record } = body;

    console.warn("Auth webhook received:", { type, record: record?.email });

    switch (type) {
      case "user.created":
        // Nouvel utilisateur créé - envoyer email de vérification
        if (record?.email && record?.email_confirm_token) {
          const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm?token=${record.email_confirm_token}&type=signup&redirect_to=${encodeURIComponent("/dashboard")}`;

          // Récupérer la langue préférée de l'utilisateur (par défaut français)
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("preferred_locale")
            .eq("id", record.id)
            .single();

          const locale = profile?.preferred_locale || "fr";

          await sendVerificationEmail({
            email: record.email,
            confirmationUrl,
            locale,
          });

          console.warn("Verification email sent to:", record.email);
        }
        break;

      case "user.password_recovery_requested":
        // Demande de réinitialisation de mot de passe
        if (record?.email && record?.recovery_token) {
          const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=${record.recovery_token}&type=recovery`;

          // Récupérer la langue préférée de l'utilisateur
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("preferred_locale")
            .eq("id", record.id)
            .single();

          const locale = profile?.preferred_locale || "fr";

          await sendPasswordResetEmail({
            email: record.email,
            resetUrl,
            locale,
          });

          console.warn("Password reset email sent to:", record.email);
        }
        break;

      default:
        console.warn("Unhandled webhook type:", type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Méthode pour tester l'envoi d'emails (développement uniquement)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const email = searchParams.get("email") || "test@example.com";
  const locale = searchParams.get("locale") || "fr";

  try {
    if (type === "verification") {
      const result = await sendVerificationEmail({
        email,
        confirmationUrl: "http://localhost:3000/auth/confirm?token=test-token",
        locale,
      });
      return NextResponse.json({ success: true, result });
    }

    if (type === "reset") {
      const result = await sendPasswordResetEmail({
        email,
        resetUrl: "http://localhost:3000/auth/reset-password?token=test-token",
        locale,
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      {
        error: "Invalid type. Use ?type=verification or ?type=reset",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: error },
      { status: 500 }
    );
  }
}

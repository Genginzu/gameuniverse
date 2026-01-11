// Script de test simple pour vérifier l'intégration Resend
// Usage: bun run test-resend.js

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY n'est pas définie dans les variables d'environnement");
  console.log("💡 Ajoutez RESEND_API_KEY=your_api_key dans votre fichier .env.local");
  process.exit(1);
}

async function testResendConnection() {
  try {
    console.log("🧪 Test de connexion à Resend...");

    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Connexion à Resend réussie !");
      console.log(`📧 Domaines configurés: ${data.data?.length || 0}`);

      if (data.data && data.data.length > 0) {
        data.data.forEach((domain) => {
          console.log(`   - ${domain.name} (${domain.status})`);
        });
      } else {
        console.log(
          "⚠️  Aucun domaine configuré. Vous pouvez utiliser onboarding@resend.dev pour les tests."
        );
      }
    } else {
      const error = await response.text();
      console.error("❌ Erreur de connexion à Resend:", response.status, error);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test de connexion:", error.message);
  }
}

async function testEmailSending() {
  try {
    console.log("\n📤 Test d'envoi d'email...");

    const emailData = {
      from: "Game Universe <onboarding@resend.dev>",
      to: "test@example.com",
      subject: "Test d'intégration Resend - Game Universe",
      html: `
        <h1>Test d'intégration réussi !</h1>
        <p>Cet email confirme que l'intégration Resend fonctionne correctement avec Game Universe.</p>
        <p>Configuration testée :</p>
        <ul>
          <li>✅ Connexion API</li>
          <li>✅ Envoi d'email</li>
          <li>✅ Templates HTML</li>
        </ul>
        <p><em>Ceci est un email de test généré automatiquement.</em></p>
      `,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Email de test envoyé avec succès !");
      console.log(`📧 ID du message: ${result.id}`);
      console.log("💡 Vérifiez votre boîte de réception (et les spams)");
    } else {
      const error = await response.text();
      console.error("❌ Erreur lors de l'envoi:", response.status, error);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test d'envoi:", error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log("🚀 Test d'intégration Resend pour Game Universe\n");

  await testResendConnection();
  await testEmailSending();

  console.log("\n✨ Tests terminés !");
  console.log("\n📋 Prochaines étapes :");
  console.log("1. Configurez un domaine personnalisé dans Resend (optionnel)");
  console.log("2. Testez les emails via l'API: GET /api/test-email?type=verification");
  console.log("3. Testez l'inscription d'un nouvel utilisateur");
}

runTests();

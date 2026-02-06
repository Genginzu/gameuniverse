/**
 * Script de test pour récupérer toutes les infos age_ratings d'Outer Wilds depuis IGDB
 * Usage: node scripts/test-igdb-age-ratings.js
 */

const IGDB_CLIENT_ID = "1d2tejj63z747buefo0l53qjvlvq7r";
const IGDB_CLIENT_SECRET = "resf56kll3yq90t79l67bvyubfvxz7";
const OUTER_WILDS_IGDB_ID = 11737;

async function getAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: IGDB_CLIENT_ID,
      client_secret: IGDB_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const data = await response.json();
  return data.access_token;
}

async function igdbQuery(endpoint, body, token) {
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  return response.json();
}

async function main() {
  console.log("=== Test IGDB Age Ratings pour Outer Wilds ===\n");

  const token = await getAccessToken();
  console.log("✓ Token obtenu\n");

  // 1. Récupérer le jeu avec tous les champs age_ratings
  console.log("1. Récupération du jeu avec age_ratings.*");
  const games = await igdbQuery(
    "games",
    `fields name, age_ratings.*; where id = ${OUTER_WILDS_IGDB_ID};`,
    token
  );
  console.log(JSON.stringify(games, null, 2));

  if (games[0]?.age_ratings) {
    const ageRatingIds = games[0].age_ratings.map((ar) => ar.id);
    console.log(`\n✓ ${ageRatingIds.length} age ratings trouvés: ${ageRatingIds.join(", ")}\n`);

    // 2. Récupérer les détails complets des age_ratings
    console.log("2. Récupération des détails age_ratings (tous les champs)");
    const ageRatings = await igdbQuery(
      "age_ratings",
      `fields *; where id = (${ageRatingIds.join(",")});`,
      token
    );
    console.log(JSON.stringify(ageRatings, null, 2));

    // 3. Vérifier si rating_cover_url existe
    console.log("\n3. Vérification de rating_cover_url:");
    for (const ar of ageRatings) {
      const hasUrl = ar.rating_cover_url ? `✓ ${ar.rating_cover_url}` : "✗ null";
      console.log(
        `   - ID ${ar.id} (org: ${ar.organization}, cat: ${ar.rating_category}): ${hasUrl}`
      );
    }

    // 4. Récupérer les content descriptions
    const allContentDescIds = ageRatings
      .filter((ar) => ar.rating_content_descriptions)
      .flatMap((ar) => ar.rating_content_descriptions);

    if (allContentDescIds.length > 0) {
      console.log(`\n4. Récupération des content descriptions (${allContentDescIds.length} IDs)`);
      const contentDescs = await igdbQuery(
        "age_rating_content_descriptions",
        `fields *; where id = (${[...new Set(allContentDescIds)].join(",")});`,
        token
      );
      console.log(JSON.stringify(contentDescs, null, 2));
    }
  }

  console.log("\n=== Fin du test ===");
}

main().catch(console.error);

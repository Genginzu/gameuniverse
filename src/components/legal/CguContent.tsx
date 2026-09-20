const FR = (
  <>
    <p>
      Les présentes Conditions générales d'utilisation (« CGU ») régissent l'accès et l'usage du site
      et des services de Gamers Universe (« la Plateforme »), exploitée par l'éditeur identifié dans
      les <a href="/mentions-legales">mentions légales</a>.
    </p>

    <h2>1. Objet</h2>
    <p>
      La Plateforme est un site communautaire consacré au jeu vidéo : fiches de jeux et personnages,
      bibliothèque et statistiques de jeu, publications, avis, discussions, esport, et un service
      d'intermédiation de coaching (régi par les <a href="/cgv">CGV</a>).
    </p>

    <h2>2. Accès et inscription</h2>
    <ul>
      <li>La consultation est libre pour la plupart des contenus. Certaines fonctionnalités requièrent un compte.</li>
      <li>L'inscription nécessite une adresse e-mail valide et un pseudonyme. L'utilisateur doit avoir 15 ans révolus (ou disposer de l'accord d'un titulaire de l'autorité parentale).</li>
      <li>L'utilisateur s'engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants.</li>
    </ul>

    <h2>3. Règles d'usage et comportements interdits</h2>
    <p>Sont notamment interdits :</p>
    <ul>
      <li>les contenus illicites, haineux, diffamatoires, harcelants, pornographiques ou portant atteinte aux droits de tiers ;</li>
      <li>la publication de contenus dont l'utilisateur ne détient pas les droits ;</li>
      <li>l'usurpation d'identité, le spam, la fraude, l'atteinte à la sécurité du service ;</li>
      <li>l'extraction automatisée massive de données sans autorisation.</li>
    </ul>

    <h2>4. Contenu publié par les utilisateurs</h2>
    <ul>
      <li>L'utilisateur reste titulaire des droits sur les contenus qu'il publie (posts, avis, commentaires, images).</li>
      <li>Il concède à la Plateforme une licence non exclusive, gratuite, pour héberger et afficher ces contenus dans le cadre du service, pour la durée de leur mise en ligne.</li>
      <li>La Plateforme peut retirer tout contenu manifestement illicite ou contraire aux présentes CGU.</li>
    </ul>

    <h2>5. Propriété intellectuelle de la Plateforme</h2>
    <p>
      La structure, les textes originaux, le logo et la charte graphique de la Plateforme sont
      protégés. Les visuels et données de jeux proviennent de sources tierces (IGDB, PandaScore) et
      appartiennent à leurs ayants droit.
    </p>

    <h2>6. Résiliation</h2>
    <ul>
      <li>L'utilisateur peut supprimer son compte à tout moment. Les données sont alors supprimées ou anonymisées selon la <a href="/confidentialite">politique de confidentialité</a>, sous réserve des obligations légales de conservation.</li>
      <li>La Plateforme peut suspendre ou clôturer un compte en cas de manquement grave aux CGU, après information sauf urgence.</li>
    </ul>

    <h2>7. Responsabilité et disponibilité</h2>
    <ul>
      <li>La Plateforme est fournie « en l'état ». L'éditeur met en œuvre les moyens raisonnables pour assurer sa disponibilité, sans garantie d'absence d'interruption.</li>
      <li>L'éditeur n'est pas responsable des contenus publiés par les utilisateurs ni des prestations réalisées par les Coachs.</li>
    </ul>

    <h2>8. Modification des CGU</h2>
    <p>Les CGU peuvent être modifiées. Les utilisateurs sont informés des changements substantiels ; la poursuite de l'usage vaut acceptation.</p>

    <h2>9. Loi applicable</h2>
    <p>Les présentes CGU sont soumises au droit français.</p>
  </>
);

const EN = (
  <>
    <p>
      These Terms of Use ("Terms") govern access to and use of the Gamers Universe site and services
      ("the Platform"), operated by the publisher identified in the{" "}
      <a href="/mentions-legales">legal notice</a>.
    </p>

    <h2>1. Purpose</h2>
    <p>
      The Platform is a video-game community site: game and character pages, game library and stats,
      posts, reviews, discussions, esports, and a coaching intermediation service (governed by the{" "}
      <a href="/cgv">Terms of Sale</a>).
    </p>

    <h2>2. Access and registration</h2>
    <ul>
      <li>Most content is freely accessible. Some features require an account.</li>
      <li>Registration requires a valid email and a username. Users must be at least 15 (or have parental consent).</li>
      <li>Users must provide accurate information and keep their credentials confidential.</li>
    </ul>

    <h2>3. Usage rules and prohibited behaviour</h2>
    <p>The following are prohibited, among others:</p>
    <ul>
      <li>unlawful, hateful, defamatory, harassing, pornographic content or content infringing third-party rights;</li>
      <li>posting content the user does not have the rights to;</li>
      <li>impersonation, spam, fraud, attacks on service security;</li>
      <li>large-scale automated data extraction without authorisation.</li>
    </ul>

    <h2>4. User-generated content</h2>
    <ul>
      <li>Users retain the rights to the content they post (posts, reviews, comments, images).</li>
      <li>They grant the Platform a non-exclusive, free licence to host and display that content within the service, for as long as it is online.</li>
      <li>The Platform may remove any manifestly unlawful content or content breaching these Terms.</li>
    </ul>

    <h2>5. Platform intellectual property</h2>
    <p>
      The Platform's structure, original texts, logo and visual identity are protected. Game visuals
      and data come from third-party sources (IGDB, PandaScore) and belong to their rights holders.
    </p>

    <h2>6. Termination</h2>
    <ul>
      <li>Users may delete their account at any time. Data is then deleted or anonymised per the <a href="/confidentialite">privacy policy</a>, subject to legal retention obligations.</li>
      <li>The Platform may suspend or close an account for serious breach of the Terms, with prior notice save in emergencies.</li>
    </ul>

    <h2>7. Liability and availability</h2>
    <ul>
      <li>The Platform is provided "as is". The publisher uses reasonable means to ensure availability, without guaranteeing uninterrupted service.</li>
      <li>The publisher is not liable for user-posted content or for services delivered by Coaches.</li>
    </ul>

    <h2>8. Changes to the Terms</h2>
    <p>The Terms may change. Users are informed of substantial changes; continued use constitutes acceptance.</p>

    <h2>9. Governing law</h2>
    <p>These Terms are governed by French law.</p>
  </>
);

export function CguContent({ locale }: { locale: string }) {
  return locale === "en" ? EN : FR;
}

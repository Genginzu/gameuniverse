const FR = (
  <>
    <p>
      Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance
      dans l'économie numérique (LCEN), voici les informations légales relatives au site Gamers
      Universe.
    </p>

    <h2>Éditeur du site</h2>
    <ul>
      <li>Nom et prénom de l'exploitant : [À COMPLÉTER]</li>
      <li>Statut : Entrepreneur individuel (micro-entreprise)</li>
      <li>Adresse de l'établissement : [À COMPLÉTER]</li>
      <li>Numéro SIRET : [À COMPLÉTER]</li>
      <li>Numéro de TVA intracommunautaire : [À COMPLÉTER — ou « Non applicable, TVA non applicable, art. 293 B du CGI »]</li>
      <li>Adresse e-mail de contact : [À COMPLÉTER]</li>
      <li>Téléphone (facultatif) : [À COMPLÉTER]</li>
    </ul>
    <p>
      Le site étant exploité par une micro-entreprise proposant un service payant d'intermédiation
      (coaching), la mention de l'identité de l'exploitant est obligatoire.
    </p>

    <h2>Directeur de la publication</h2>
    <p>[À COMPLÉTER] (généralement l'exploitant nommé ci-dessus).</p>

    <h2>Hébergement</h2>
    <p>Le site est hébergé par :</p>
    <ul>
      <li>
        <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis —
        vercel.com. [À VÉRIFIER]
      </li>
    </ul>
    <p>Prestataires techniques associés :</p>
    <ul>
      <li>
        Base de données et authentification : <strong>Supabase, Inc.</strong> — 970 Toa Payoh North
        #07-04, Singapour / San Francisco (États-Unis) — supabase.com. [À VÉRIFIER — indiquez la
        région de votre projet Supabase]
      </li>
      <li>
        Nom de domaine : <strong>OVH SAS</strong> — 2 rue Kellermann, 59100 Roubaix, France — +33 9
        72 10 10 07 — ovhcloud.com.
      </li>
    </ul>

    <h2>Propriété intellectuelle</h2>
    <p>
      La structure du site, ses textes originaux, son logo et sa charte graphique sont protégés par
      le droit d'auteur. Les visuels de jeux, jaquettes, artworks et données descriptives proviennent
      de bases tierces (notamment IGDB et PandaScore) et restent la propriété de leurs ayants droit
      respectifs ; ils sont affichés à des fins d'information et communautaires. Toute reproduction
      non autorisée est interdite.
    </p>

    <h2>Contact</h2>
    <p>Pour toute question relative au site : [À COMPLÉTER — e-mail de contact].</p>
  </>
);

const EN = (
  <>
    <p>
      In accordance with Articles 6-III and 19 of French Act No. 2004-575 of 21 June 2004 on
      confidence in the digital economy (LCEN), below is the legal information for the Gamers Universe
      website.
    </p>

    <h2>Website publisher</h2>
    <ul>
      <li>Operator's name: [TO BE COMPLETED]</li>
      <li>Status: Sole trader (French micro-enterprise)</li>
      <li>Business address: [TO BE COMPLETED]</li>
      <li>SIRET number: [TO BE COMPLETED]</li>
      <li>Intra-EU VAT number: [TO BE COMPLETED — or "Not applicable, VAT not charged, Art. 293 B CGI"]</li>
      <li>Contact email: [TO BE COMPLETED]</li>
      <li>Phone (optional): [TO BE COMPLETED]</li>
    </ul>

    <h2>Publication director</h2>
    <p>[TO BE COMPLETED] (usually the operator named above).</p>

    <h2>Hosting</h2>
    <p>The website is hosted by:</p>
    <ul>
      <li>
        <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com. [TO
        BE VERIFIED]
      </li>
    </ul>
    <p>Associated technical providers:</p>
    <ul>
      <li>
        Database and authentication: <strong>Supabase, Inc.</strong> — supabase.com. [TO BE VERIFIED
        — state your Supabase project region]
      </li>
      <li>
        Domain name: <strong>OVH SAS</strong> — 2 rue Kellermann, 59100 Roubaix, France — +33 9 72 10
        10 07 — ovhcloud.com.
      </li>
    </ul>

    <h2>Intellectual property</h2>
    <p>
      The site structure, original texts, logo and visual identity are protected by copyright. Game
      artwork, cover images and descriptive data come from third-party databases (notably IGDB and
      PandaScore) and remain the property of their respective rights holders; they are displayed for
      informational and community purposes. Any unauthorised reproduction is prohibited.
    </p>

    <h2>Contact</h2>
    <p>For any question about the site: [TO BE COMPLETED — contact email].</p>
  </>
);

export function MentionsLegalesContent({ locale }: { locale: string }) {
  return locale === "en" ? EN : FR;
}

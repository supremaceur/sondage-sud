export default function MentionsLegalesPage() {
  const sectionStyle = {
    background: "var(--sud-card)",
    borderColor: "var(--sud-border)",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: "var(--sud-black)" }}>
        Mentions légales
      </h1>

      {/* Éditeur */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>1. Éditeur du site</h2>
        <div className="space-y-1 text-sm" style={{ color: "var(--sud-dark)" }}>
          <p>Le présent site est édité par :</p>
          <p className="font-medium mt-2">Syndicat SUD P2ST</p>
          <p>(Solidaires Unitaires Démocratiques — Poste, Télécommunications et Services associés)</p>
          <p>Organisation syndicale régie par la loi du 21 mars 1884 relative aux syndicats professionnels.</p>
          <p className="mt-2">
            Email de contact :{" "}
            <a href="mailto:sudptt@sudptt.org" className="hover:underline" style={{ color: "#E60077" }}>
              sudptt@sudptt.org
            </a>
          </p>
          <p>Directeur de la publication : Kévin Gouche, élu syndical SUD.</p>
        </div>
      </section>

      {/* Hébergement */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>2. Hébergement</h2>
        <div className="space-y-1 text-sm" style={{ color: "var(--sud-dark)" }}>
          <p><strong>Application web :</strong></p>
          <p>Vercel Inc.</p>
          <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
          <p>
            Site :{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#E60077" }}>
              vercel.com
            </a>
          </p>

          <p className="mt-3"><strong>Base de données et authentification :</strong></p>
          <p>Supabase Inc.</p>
          <p>970 Toa Payoh North #07-04, Singapore 318992</p>
          <p>
            Site :{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#E60077" }}>
              supabase.com
            </a>
          </p>
        </div>
      </section>

      {/* Propriété intellectuelle */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>3. Propriété intellectuelle</h2>
        <p className="text-sm" style={{ color: "var(--sud-dark)" }}>
          L'ensemble du contenu de ce site (textes, images, logos, graphismes, icônes) est la propriété exclusive du syndicat SUD P2ST ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de SUD P2ST.
        </p>
      </section>

      {/* RGPD */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>4. Protection des données personnelles (RGPD)</h2>
        <div className="space-y-3 text-sm" style={{ color: "var(--sud-dark)" }}>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, nous vous informons des éléments suivants :
          </p>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.1 Responsable du traitement</h3>
            <p>
              Le responsable du traitement des données est le syndicat SUD P2ST, joignable à l'adresse :{" "}
              <a href="mailto:sudptt@sudptt.org" className="hover:underline" style={{ color: "#E60077" }}>sudptt@sudptt.org</a>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.2 Données collectées</h3>
            <p>Les données personnelles collectées dans le cadre de l'utilisation de cette plateforme sont :</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li>Nom complet</li>
              <li>Adresse email</li>
              <li>Site d'affectation</li>
              <li>Réponses aux sondages</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.3 Finalités du traitement</h3>
            <p>Les données sont collectées aux fins suivantes :</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li>Gestion de l'authentification et de l'accès à la plateforme</li>
              <li>Collecte et analyse des réponses aux sondages syndicaux</li>
              <li>Statistiques internes de participation par site géographique</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.4 Base légale</h3>
            <p>
              Le traitement est fondé sur l'intérêt légitime du syndicat SUD P2ST dans le cadre de sa mission de représentation des salariés (article 6.1.f du RGPD), ainsi que sur le consentement de l'utilisateur lors de son inscription (article 6.1.a du RGPD).
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.5 Durée de conservation</h3>
            <p>
              Les données personnelles sont conservées pendant toute la durée d'utilisation du compte. En cas de suppression du compte, les données sont effacées dans un délai de 30 jours. Les résultats de sondages anonymisés peuvent être conservés sans limitation de durée à des fins statistiques.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.6 Destinataires des données</h3>
            <p>Les données sont accessibles aux personnes suivantes :</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li>Les administrateurs de site (résultats agrégés des sondages de leur site uniquement)</li>
              <li>Les super-administrateurs (résultats agrégés de tous les sites)</li>
              <li>Supabase Inc. (sous-traitant technique pour l'hébergement de la base de données)</li>
              <li>Vercel Inc. (sous-traitant technique pour l'hébergement de l'application)</li>
            </ul>
            <p className="mt-1">
              Aucune donnée n'est transmise à des tiers à des fins commerciales.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.7 Transferts hors UE</h3>
            <p>
              Les sous-traitants Vercel et Supabase opèrent depuis les États-Unis et Singapour. Ces transferts sont encadrés par les clauses contractuelles types (CCT) approuvées par la Commission européenne, conformément à l'article 46 du RGPD.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-1" style={{ color: "var(--sud-black)" }}>4.8 Vos droits</h3>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:sudptt@sudptt.org" className="hover:underline font-medium" style={{ color: "#E60077" }}>
                sudptt@sudptt.org
              </a>
            </p>
            <p className="mt-1">
              En cas de litige, vous pouvez introduire une réclamation auprès de la CNIL :{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#E60077" }}>
                www.cnil.fr
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>5. Cookies</h2>
        <p className="text-sm" style={{ color: "var(--sud-dark)" }}>
          Ce site utilise uniquement des cookies strictement nécessaires au fonctionnement de l'application (cookies de session et d'authentification). Aucun cookie publicitaire, de tracking ou d'analyse n'est utilisé. Conformément à la directive ePrivacy, ces cookies techniques ne nécessitent pas de consentement préalable.
        </p>
      </section>

      {/* Responsabilité */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>6. Limitation de responsabilité</h2>
        <p className="text-sm" style={{ color: "var(--sud-dark)" }}>
          SUD P2ST s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, SUD P2ST ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition. SUD P2ST décline toute responsabilité en cas d'interruption ou d'inaccessibilité du site, de survenance de bugs ou de tout dommage résultant d'une intrusion frauduleuse d'un tiers.
        </p>
      </section>

      {/* Droit applicable */}
      <section className="p-6 rounded-xl border shadow-sm" style={sectionStyle}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--sud-black)" }}>7. Droit applicable</h2>
        <p className="text-sm" style={{ color: "var(--sud-dark)" }}>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <p className="text-xs text-center pb-4" style={{ color: "#999" }}>
        Dernière mise à jour : avril 2026
      </p>
    </div>
  );
}

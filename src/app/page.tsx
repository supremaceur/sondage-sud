export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div
        className="inline-block px-4 py-1 rounded-full text-xs font-medium mb-6"
        style={{ background: "rgba(230,0,119,0.15)", color: "#E60077" }}
      >
        Plateforme de sondages SUD P2ST
      </div>

      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        <span className="text-white">Bienvenue sur </span>
        <span style={{ color: "#E60077" }}>Sondage</span>
        <span style={{ color: "var(--sud-yellow)" }}> SUD</span>
      </h1>

      <p className="text-lg text-gray-400 max-w-xl mb-8">
        Participez aux enquêtes et consultez les résultats en temps réel.
        Une plateforme simple, rapide et sécurisée.
      </p>

      <div className="flex gap-4">
        <a
          href="/signup"
          className="px-6 py-3 rounded-lg font-medium transition text-white"
          style={{ background: "#E60077" }}
        >
          Commencer
        </a>
        <a
          href="/login"
          className="px-6 py-3 rounded-lg font-medium transition text-gray-300 border"
          style={{ borderColor: "var(--sud-border)" }}
        >
          Se connecter
        </a>
      </div>
    </div>
  );
}

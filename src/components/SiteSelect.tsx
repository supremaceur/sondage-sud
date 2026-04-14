"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Site } from "@/types";

// Liste statique de fallback au cas où la requête échoue (utilisateur non connecté)
const FALLBACK_SITES = [
  "Blois", "Clermont", "La Rochelle", "Nancy", "Pau", "Romanville",
  "Rouen", "Saint-Etienne", "Siege", "Tarbes", "Troyes", "Wasquehal",
];

interface Props {
  value: string;
  onChange: (siteId: string) => void;
  showAllOption?: boolean;
}

export default function SiteSelect({ value, onChange, showAllOption = false }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("sites")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setSites((data as Site[]) ?? []);
        setLoaded(true);
      });
  }, []);

  const optionStyle = { background: "#111", color: "white" };

  // Si les sites n'ont pas pu être chargés depuis la DB (pas connecté), on utilise le fallback
  if (loaded && sites.length === 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!showAllOption}
        className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
        style={{ background: "var(--sud-black)", borderColor: "var(--sud-border)", color: "white" }}
      >
        {showAllOption ? (
          <option value="" style={optionStyle}>Tous les sites</option>
        ) : (
          <option value="" style={optionStyle}>Sélectionnez votre site</option>
        )}
        {FALLBACK_SITES.map((name) => (
          <option key={name} value={name} style={optionStyle}>
            {name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={!showAllOption}
      className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 border"
      style={{ background: "var(--sud-black)", borderColor: "var(--sud-border)", color: "white" }}
    >
      {showAllOption ? (
        <option value="" style={optionStyle}>Tous les sites</option>
      ) : (
        <option value="" style={optionStyle}>Sélectionnez votre site</option>
      )}
      {sites.map((site) => (
        <option key={site.id} value={site.id} style={optionStyle}>
          {site.name}
        </option>
      ))}
    </select>
  );
}

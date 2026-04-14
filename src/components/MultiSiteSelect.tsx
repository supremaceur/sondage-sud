"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Site } from "@/types";

interface Props {
  selectedSiteIds: string[];
  onChange: (siteIds: string[]) => void;
  allSites?: boolean;
  onAllSitesChange?: (allSites: boolean) => void;
}

export default function MultiSiteSelect({ selectedSiteIds, onChange, allSites = false, onAllSitesChange }: Props) {
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

  function handleToggleAll() {
    if (onAllSitesChange) {
      onAllSitesChange(!allSites);
      if (!allSites) onChange([]);
    }
  }

  function handleToggleSite(siteId: string) {
    if (allSites && onAllSitesChange) {
      onAllSitesChange(false);
    }
    if (selectedSiteIds.includes(siteId)) {
      onChange(selectedSiteIds.filter((id) => id !== siteId));
    } else {
      onChange([...selectedSiteIds, siteId]);
    }
  }

  if (!loaded) {
    return <div className="py-2 text-sm" style={{ color: "var(--sud-muted)" }}>Chargement des sites...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Tous les sites */}
      <label className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg transition hover:bg-gray-50">
        <input
          type="checkbox"
          checked={allSites}
          onChange={handleToggleAll}
          className="w-4 h-4 rounded accent-pink-600"
        />
        <span className="text-sm font-medium" style={{ color: allSites ? "#E60077" : "var(--sud-black)" }}>
          Tous les sites
        </span>
      </label>

      <div className="border-t" style={{ borderColor: "var(--sud-border)" }} />

      {/* Sites individuels */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {sites.map((site) => {
          const checked = allSites || selectedSiteIds.includes(site.id);
          return (
            <label
              key={site.id}
              className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition hover:bg-gray-50"
              style={{ opacity: allSites ? 0.5 : 1 }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggleSite(site.id)}
                disabled={allSites}
                className="w-4 h-4 rounded accent-pink-600"
              />
              <span className="text-sm" style={{ color: "var(--sud-dark)" }}>
                {site.name}
              </span>
            </label>
          );
        })}
      </div>

      {!allSites && selectedSiteIds.length > 0 && (
        <p className="text-xs px-1" style={{ color: "var(--sud-muted)" }}>
          {selectedSiteIds.length} site{selectedSiteIds.length > 1 ? "s" : ""} sélectionné{selectedSiteIds.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

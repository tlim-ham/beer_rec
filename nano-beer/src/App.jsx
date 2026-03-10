import { useState, useMemo, useRef, useEffect } from "react";

const BEER_OPTIONS = [
  { name: "Select a beer…", body: 5, malty: 5, sour: 3, fruits: 4, hoppy: 6, bitter: 5, spices: 2, salty: 1 },
  { name: "Sierra Nevada Pale Ale", body: 5, malty: 4, sour: 2, fruits: 4, hoppy: 7, bitter: 6, spices: 2, salty: 1 },
  { name: "Allagash White", body: 4, malty: 4, sour: 3, fruits: 6, hoppy: 3, bitter: 2, spices: 7, salty: 1 },
  { name: "Guinness Draught", body: 8, malty: 7, sour: 1, fruits: 2, hoppy: 2, bitter: 5, spices: 1, salty: 2 },
  { name: "Dogfish Head 60 Minute IPA", body: 5, malty: 4, sour: 2, fruits: 5, hoppy: 9, bitter: 8, spices: 2, salty: 1 },
  { name: "Founders Breakfast Stout", body: 9, malty: 8, sour: 1, fruits: 3, hoppy: 2, bitter: 6, spices: 4, salty: 1 },
  { name: "Blue Moon", body: 4, malty: 4, sour: 2, fruits: 5, hoppy: 3, bitter: 2, spices: 5, salty: 1 },
  { name: "Lagunitas IPA", body: 5, malty: 4, sour: 2, fruits: 5, hoppy: 8, bitter: 7, spices: 2, salty: 1 },
  { name: "Heineken", body: 3, malty: 3, sour: 2, fruits: 2, hoppy: 4, bitter: 3, spices: 1, salty: 1 },
  { name: "Modelo Especial", body: 3, malty: 3, sour: 1, fruits: 2, hoppy: 3, bitter: 2, spices: 1, salty: 1 },
];

const VOCABULARY = {
  Body: { def: "Perceived weight or thickness in the mouth.", hint: "Light ↔ full-bodied" },
  Malty: { def: "Grain-derived richness (bready/caramel-like).", hint: "Crackery ↔ caramel/bready" },
  Sour: { def: "Tartness/acidity.", hint: "Smooth ↔ tart" },
  Fruity: { def: "Fruit flavors from additions or fermentation character.", hint: "Neutral ↔ fruity" },
  Hoppy: { def: "Hop aroma/flavor intensity (citrus/pine/floral/herbal).", hint: "Low aroma ↔ punchy hops" },
  Bitter: { def: "Bitterness, usually from hops or roasted ingredients.", hint: "Mild ↔ sharp bitterness" },
  Spices: { def: "Spice-like notes from ingredients or yeast.", hint: "None ↔ clove/pepper/coriander" },
  Salty: { def: "Saltiness (rare; present in styles like Gose).", hint: "None ↔ noticeably saline" },
  Astringency: { def: "Dryness/puckering sensation (often tannins or roasted grains).", hint: "Soft ↔ drying/puckering" },
  Alcohol: { def: "Strength of alcohol perception in taste/aroma (separate from ABV).", hint: "Hidden ↔ warming/boozy" },
};

const DEFAULTS = { body: 5, malty: 5, sour: 3, fruits: 4, hoppy: 6, bitter: 5, spices: 2, salty: 1 };
const TABS = ["Taste", "Matches", "Vocabulary", "Settings"];



// Slider with flash animation on external change
function Slider({ label, value, onChange, left, right, flashing }) {
  return (
    <div style={{
      marginBottom: "1.4rem",
      borderRadius: "8px",
      padding: "0.5rem 0.6rem",
      background: flashing ? "rgba(240,192,64,0.07)" : "transparent",
      transition: "background 0.6s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#e8d5a3" }}>
          {label}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "#f0c040", fontWeight: "700" }}>{value}</span>
      </div>
      <input
        type="range" min="1" max="10" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#f0c040", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
        <span style={{ fontSize: "0.7rem", color: "#8a7a5a" }}>{left}</span>
        <span style={{ fontSize: "0.7rem", color: "#8a7a5a" }}>{right}</span>
      </div>
    </div>
  );
}

function TasteBar({ label, value }) {
  const pct = (value / 10) * 100;
  return (
    <div style={{ marginBottom: "0.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.85rem", color: "#c4b08a" }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#f0c040" }}>{value.toFixed(1)}/10</span>
      </div>
      <div style={{ background: "#1a1208", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #c8860a, #f0c040)", borderRadius: "4px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase",
      color: "#6a5a3a", marginBottom: "0.8rem", marginTop: "1.2rem",
      borderBottom: "1px solid #2a2010", paddingBottom: "0.4rem",
    }}>
      {children}
    </div>
  );
}

function PreferencesTab() {
  const [vals, setVals] = useState(DEFAULTS);
  const [selectedBeer, setSelectedBeer] = useState("Select a beer…");
  const [showResult, setShowResult] = useState(false);
  const [flashing, setFlashing] = useState({});
  const prevVals = useRef(vals);

  const set = k => v => {
    setVals(p => ({ ...p, [k]: v }));
    setShowResult(false);
  };

  function handleBeerSelect(e) {
    const name = e.target.value;
    setSelectedBeer(name);
    setShowResult(false);
    const beer = BEER_OPTIONS.find(b => b.name === name);
    if (beer && name !== "Select a beer…") {
      const { body, malty, sour, fruits, hoppy, bitter, spices, salty } = beer;
      const newVals = { body, malty, sour, fruits, hoppy, bitter, spices, salty };
      // figure out which keys changed
      const changed = {};
      Object.keys(newVals).forEach(k => {
        if (newVals[k] !== prevVals.current[k]) changed[k] = true;
      });
      setFlashing(changed);
      setVals(newVals);
      setTimeout(() => setFlashing({}), 800);
    }
  }

  useEffect(() => { prevVals.current = vals; }, [vals]);

  function handleReset() {
    setVals(DEFAULTS);
    setSelectedBeer("Select a beer…");
    setShowResult(false);
    setFlashing(Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, true])));
    setTimeout(() => setFlashing({}), 800);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "3rem", alignItems: "start" }}>

      {/* Left — beer picker + sliders */}
      <div>
        <SectionLabel>Start with a beer you already enjoy</SectionLabel>
        <p style={{ color: "#8a7a5a", fontSize: "0.82rem", marginBottom: "0.8rem", fontStyle: "italic" }}>
          Pick a beer and we'll pre-fill your preferences. Fine-tune the sliders below.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.8rem" }}>
          <select
            value={selectedBeer}
            onChange={handleBeerSelect}
            style={{
              flex: 1, background: "#1a1208", border: "1px solid #3a2e18",
              color: selectedBeer === "Select a beer…" ? "#8a7a5a" : "#e8d5a3",
              padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.95rem",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {BEER_OPTIONS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
          <button
            onClick={handleReset}
            title="Reset to defaults"
            style={{
              padding: "0.75rem 1rem", background: "none",
              border: "1px solid #3a2e18", borderRadius: "8px",
              color: "#6a5a3a", fontSize: "0.8rem", cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.05em",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.color = "#f0c040"; e.currentTarget.style.borderColor = "#f0c040"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#6a5a3a"; e.currentTarget.style.borderColor = "#3a2e18"; }}
          >
            Reset
          </button>
        </div>

        <SectionLabel>Richness</SectionLabel>
        <Slider label="Body" value={vals.body} onChange={set("body")} left="Light" right="Thick" flashing={flashing.body} />
        <Slider label="Malty" value={vals.malty} onChange={set("malty")} left="Dry" right="Grainy" flashing={flashing.malty} />

        <SectionLabel>Brightness</SectionLabel>
        <Slider label="Sour" value={vals.sour} onChange={set("sour")} left="Not tart" right="Very tart" flashing={flashing.sour} />
        <Slider label="Fruity" value={vals.fruits} onChange={set("fruits")} left="Not fruity" right="Very fruity" flashing={flashing.fruits} />

        <SectionLabel>Hop Character</SectionLabel>
        <Slider label="Hoppy" value={vals.hoppy} onChange={set("hoppy")} left="Low" right="High" flashing={flashing.hoppy} />
        <Slider label="Bitter" value={vals.bitter} onChange={set("bitter")} left="Low" right="High" flashing={flashing.bitter} />

        <SectionLabel>Edge Notes</SectionLabel>
        <Slider label="Spices" value={vals.spices} onChange={set("spices")} left="None" right="Spiced" flashing={flashing.spices} />
        <Slider label="Salty" value={vals.salty} onChange={set("salty")} left="None" right="Salty" flashing={flashing.salty} />
      </div>

      {/* Right — snapshot + CTA */}
      <div style={{ position: "sticky", top: "90px" }}>
        <SectionLabel>Your taste snapshot</SectionLabel>
        <div style={{ background: "#0e0b04", border: "1px solid #2a2010", borderRadius: "12px", padding: "1.4rem", marginBottom: "1.2rem" }}>
          <TasteBar label="Richness" value={(vals.body + vals.malty) / 2} />
          <TasteBar label="Brightness" value={(vals.sour + vals.fruits) / 2} />
          <TasteBar label="Hops" value={(vals.hoppy + vals.bitter) / 2} />
          <TasteBar label="Edge Notes" value={(vals.spices + vals.salty) / 2} />
        </div>

        <p style={{ color: "#6a5a3a", fontSize: "0.78rem", fontStyle: "italic", marginBottom: "1.2rem", lineHeight: 1.5 }}>
          We'll match your profile against our brewery's catalog and surface the beers closest to your palate.
        </p>

        <button
          onClick={() => setShowResult(true)}
          style={{
            width: "100%", padding: "1.1rem", background: "linear-gradient(135deg, #c8860a, #f0c040)",
            border: "none", borderRadius: "10px", color: "#0a0600", fontWeight: "800",
            fontSize: "1.05rem", cursor: "pointer", letterSpacing: "0.04em",
            fontFamily: "'Playfair Display', serif",
            boxShadow: "0 4px 24px rgba(240,192,64,0.3)",
            transition: "opacity 0.2s",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}
        >
          Get My Beer Recommendations →
        </button>

        {showResult && (
          <div style={{ marginTop: "1.2rem", padding: "1.2rem", background: "#1a1208", borderRadius: "10px", border: "1px solid #3a2e18" }}>
            <p style={{ color: "#8a7a5a", fontSize: "0.82rem", textAlign: "center", fontStyle: "italic", margin: 0 }}>
              Recommendation engine coming soon — connect your backend to see results here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchesTab() {
  const placeholders = [
    { name: "Beer Recommendation A", style: "Hoppy Pale Ale", match: "94% match", tags: ["hoppy", "bitter", "citrusy"] },
    { name: "Beer Recommendation B", style: "Wheat Ale", match: "88% match", tags: ["fruity", "spiced", "light"] },
    { name: "Beer Recommendation C", style: "Amber Lager", match: "81% match", tags: ["malty", "smooth", "medium body"] },
  ];
  return (
    <div>
      <p style={{ color: "#8a7a5a", fontSize: "0.85rem", marginBottom: "2rem", fontStyle: "italic" }}>
        Set your preferences on the Taste tab, then hit "Get My Beer Recommendations" to see your matches here.
      </p>
      {placeholders.map((b, i) => (
        <div key={b.name} style={{
          display: "flex", alignItems: "center", gap: "1.4rem",
          padding: "1.3rem 1.6rem", background: "#0e0b04",
          border: "1px solid #2a2010", borderRadius: "10px", marginBottom: "0.8rem",
        }}>
          <span style={{ fontSize: "1.6rem", color: "#f0c040", fontFamily: "monospace", fontWeight: "700", minWidth: "2.5rem" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.8rem", marginBottom: "0.3rem" }}>
              <span style={{ color: "#e8d5a3", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>{b.name}</span>
              <span style={{ color: "#6a5a3a", fontSize: "0.75rem" }}>{b.style}</span>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {b.tags.map(tag => (
                <span key={tag} style={{
                  padding: "0.15rem 0.5rem", background: "#1a1208",
                  border: "1px solid #2a2010", borderRadius: "20px",
                  fontSize: "0.7rem", color: "#8a7a5a",
                }}>{tag}</span>
              ))}
            </div>
          </div>
          <span style={{ color: "#f0c040", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "700" }}>{b.match}</span>
        </div>
      ))}
      <div style={{ marginTop: "1.5rem", padding: "1rem 1.2rem", background: "#1a1208", borderRadius: "10px", border: "1px solid #2a2010" }}>
        <p style={{ color: "#6a5a3a", fontSize: "0.78rem", fontStyle: "italic", margin: 0 }}>
          Matches are ranked by nearest-neighbor similarity across all flavor dimensions. Connect your backend to replace these placeholders with real results.
        </p>
      </div>
    </div>
  );
}

function VocabularyTab() {
  const [search, setSearch] = useState("");
  const entries = Object.entries(VOCABULARY);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(([name, v]) =>
      !q || name.toLowerCase().includes(q) || v.def.toLowerCase().includes(q) || v.hint.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      <input
        placeholder="Search terms (e.g., bitter, body)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "360px", background: "#1a1208", border: "1px solid #3a2e18",
          color: "#e8d5a3", padding: "0.7rem 1rem", borderRadius: "8px",
          fontSize: "0.9rem", marginBottom: "1.5rem", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.8rem" }}>
        {filtered.map(([name, v]) => (
          <div key={name} style={{
            padding: "1rem 1.2rem", background: "#0e0b04",
            border: "1px solid #2a2010", borderRadius: "10px",
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#f0c040", marginBottom: "0.3rem" }}>{name}</div>
            <div style={{ color: "#c4b08a", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{v.def}</div>
            <div style={{ color: "#8a7a5a", fontSize: "0.75rem", fontStyle: "italic" }}>{v.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div style={{ maxWidth: "520px", paddingTop: "1rem" }}>
      <SectionLabel>Display</SectionLabel>
      <SettingRow
        label="Dark mode"
        description="Use dark background theme"
        value={darkMode}
        onChange={setDarkMode}
      />

      <SectionLabel>Sliders</SectionLabel>
      <SettingRow
        label="Show advanced sliders"
        description="Reveal Astringency and Alcohol sliders on the Taste tab"
        value={showAdvanced}
        onChange={setShowAdvanced}
      />

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#0e0b04", border: "1px solid #2a2010", borderRadius: "10px" }}>
        <p style={{ color: "#6a5a3a", fontSize: "0.78rem", fontStyle: "italic", margin: 0 }}>
          Settings are not yet persisted — they'll reset on page refresh. Backend connection coming soon.
        </p>
      </div>
    </div>
  );
}

function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.9rem 0", borderBottom: "1px solid #1a1208",
    }}>
      <div>
        <div style={{ color: "#e8d5a3", fontSize: "0.9rem", marginBottom: "0.15rem" }}>{label}</div>
        <div style={{ color: "#6a5a3a", fontSize: "0.75rem" }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px",
          background: value ? "#f0c040" : "#2a2010",
          border: "none", cursor: "pointer", position: "relative",
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: "3px",
          left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%",
          background: value ? "#0a0600" : "#6a5a3a",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Taste");

  return (
    <div style={{ minHeight: "100vh", background: "#080501", fontFamily: "'DM Sans', sans-serif", color: "#e8d5a3" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <header style={{
        padding: "1rem 3rem",
        borderBottom: "1px solid #2a2010",
        background: "rgba(8,5,1,0.97)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div style={{
            width: "44px", height: "44px", border: "2px dashed #3a2e18",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4a3e28", fontSize: "0.55rem", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.4,
          }}>
            LOGO<br />HERE
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: "1.25rem",
              fontWeight: "900", margin: 0, color: "#f0c040", letterSpacing: "-0.02em",
            }}>
              Hamilton College Nanobrewery
            </h1>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "#6a5a3a", letterSpacing: "0.1em" }}>
              TASTE · DISCOVER · ENJOY
            </p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "0.25rem" }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.5rem 1.1rem",
                background: tab === t ? "#1a1208" : "none",
                border: tab === t ? "1px solid #3a2e18" : "1px solid transparent",
                borderRadius: "6px", cursor: "pointer",
                color: tab === t ? "#f0c040" : "#6a5a3a",
                fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase",
                fontWeight: "600", fontFamily: "inherit", transition: "color 0.2s",
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: "2.5rem 3rem 4rem" }}>
        {tab === "Taste" && <PreferencesTab />}
        {tab === "Matches" && <MatchesTab />}
        {tab === "Vocabulary" && <VocabularyTab />}
        {tab === "Settings" && <SettingsTab />}
      </main>
    </div>
  );
}
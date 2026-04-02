import { useState, useMemo, useRef, useEffect } from "react";

const VOCABULARY = {
  Body: { def: "Perceived weight or thickness in the mouth.", hint: "Light ↔ full-bodied" },
  Malty: { def: "Grain-derived richness (bready/caramel-like).", hint: "Crackery ↔ caramel/bready" },
  Sour: { def: "Tartness/acidity.", hint: "Smooth ↔ tart" },
  Fruity: { def: "Fruit flavors from additions or fermentation character.", hint: "Neutral ↔ fruity" },
  Hoppy: { def: "Hop aroma/flavor intensity (citrus/pine/floral/herbal).", hint: "Low aroma ↔ punchy hops" },
  Bitter: { def: "Bitterness, usually from hops or roasted ingredients.", hint: "Mild ↔ sharp bitterness" },
  Spices: { def: "Spice-like notes from ingredients or yeast.", hint: "None ↔ clove/pepper/coriander" },
  Salty: { def: "Saltiness (rare; present in styles like Gose).", hint: "None ↔ noticeably saline" },
  Sweet: { def: "Residual sweetness from unfermented sugars.", hint: "Dry ↔ sweet" },
  Astringency: { def: "Dryness/puckering sensation (often tannins or roasted grains).", hint: "Soft ↔ drying/puckering" },
  Alcohol: { def: "Strength of alcohol perception in taste/aroma (separate from ABV).", hint: "Hidden ↔ warming/boozy" },
};

const DEFAULTS = { body: 50, malty: 50, sour: 30, fruits: 40, hoppy: 60, bitter: 50, spices: 20, salty: 10, sweet: 50 };

const API_BASE = "http://localhost:8002";

function Slider({ label, value, onChange, left, right, flashing }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const vocabEntry = VOCABULARY[label] || { def: "", hint: "" };

  return (
    <div style={{
      marginBottom: "1.4rem",
      borderRadius: "8px",
      padding: "0.5rem 0.6rem",
      background: flashing ? "rgba(240,192,64,0.07)" : "transparent",
      transition: "background 0.6s ease",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
        <span 
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: "#e8d5a3", cursor: "help", position: "relative" }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {label} <span style={{ fontSize: "0.7rem", color: "#8a7a5a", marginLeft: "0.3rem" }}>?</span>
          
          {/* Tooltip */}
          {showTooltip && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              right: 0,
              background: "#1a1208",
              border: "1px solid #3a2e18",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              color: "#e8d5a3",
              whiteSpace: "normal",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              pointerEvents: "none",
              minWidth: "180px",
            }}>
              <div style={{ color: "#f0c040", fontWeight: "600", marginBottom: "0.3rem" }}>{vocabEntry.def}</div>
              <div style={{ color: "#8a7a5a", fontSize: "0.75rem", fontStyle: "italic" }}>{vocabEntry.hint}</div>
              {/* Arrow pointing down */}
              <div style={{
                position: "absolute",
                bottom: "-6px",
                left: "10px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #1a1208",
              }} />
            </div>
          )}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "#f0c040", fontWeight: "700" }}>{value}</span>
      </div>
      <input
        type="range" min="0" max="100" step="1" value={value}
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
  const pct = (value / 100) * 100;
  return (
    <div style={{ marginBottom: "0.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.85rem", color: "#c4b08a" }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#f0c040" }}>{value.toFixed(1)}/100</span>
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

function InputPage({ onGenerate }) {
  const [vals, setVals] = useState(DEFAULTS);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [beerOptions, setBeerOptions] = useState([]);
  const [flashing, setFlashing] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBeers, setIsLoadingBeers] = useState(true);
  const prevVals = useRef(vals);

  const filteredBeers = useMemo(() => {
    if (!search.trim()) return [];
    return beerOptions
      .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10);
  }, [search, beerOptions]);

  useEffect(() => {
    async function fetchBeers() {
      try {
        const response = await fetch(`${API_BASE}/api/v1/beers`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        setBeerOptions(data.beers);
      } catch (error) {
        console.error('Error fetching beers:', error);
      } finally {
        setIsLoadingBeers(false);
      }
    }
    fetchBeers();
  }, []);

  const set = k => v => setVals(p => ({ ...p, [k]: v }));

  function handleBeerSelect(beer) {
    setSearch(beer.name);
    setShowDropdown(false);
    const { body, malty, sour, fruits, hoppy, bitter, spices, salty } = beer;
    const newVals = { body, malty, sour, fruits, hoppy, bitter, spices, salty, sweet: vals.sweet };
    const changed = {};
    Object.keys(newVals).forEach(k => {
      if (newVals[k] !== prevVals.current[k]) changed[k] = true;
    });
    setFlashing(changed);
    setVals(newVals);
    setTimeout(() => setFlashing({}), 800);
  }

  useEffect(() => { prevVals.current = vals; }, [vals]);

  function handleReset() {
    setVals(DEFAULTS);
    setSearch("");
    setFlashing(Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, true])));
    setTimeout(() => setFlashing({}), 800);
  }

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const flavorProfile = {
        Body: vals.body,
        Alcohol: vals.body,
        Bitter: vals.bitter,
        Sweet: vals.sweet,
        Sour: vals.sour,
        Salty: vals.salty,
        Fruits: vals.fruits,
        Hoppy: vals.hoppy,
        Spices: vals.spices,
        Malty: vals.malty,
      };

      const response = await fetch(`${API_BASE}/api/v1/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flavor_profile: flavorProfile }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      onGenerate(data.session_id, data.intro_message);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "3rem", alignItems: "start" }}>

      {/* Left — beer picker + sliders */}
      <div>
        <SectionLabel>Start with a beer you already enjoy</SectionLabel>
        <p style={{ color: "#8a7a5a", fontSize: "0.82rem", marginBottom: "0.8rem", fontStyle: "italic" }}>
          Search for a beer and we'll pre-fill your preferences. Fine-tune the sliders below.
        </p>

        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.8rem" }}>
          {/* Search input + dropdown */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={isLoadingBeers ? "Loading beers..." : "Search for a beer..."}
              disabled={isLoadingBeers}
              style={{
                width: "100%",
                background: "#1a1208",
                border: "1px solid #3a2e18",
                color: "#e8d5a3",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
                opacity: isLoadingBeers ? 0.6 : 1,
                cursor: isLoadingBeers ? "not-allowed" : "text",
              }}
            />
            {showDropdown && filteredBeers.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#1a1208",
                border: "1px solid #3a2e18",
                borderRadius: "8px",
                marginTop: "0.25rem",
                zIndex: 100,
                maxHeight: "250px",
                overflowY: "auto",
              }}>
                {filteredBeers.map(beer => (
                  <div
                    key={beer.name}
                    onMouseDown={() => handleBeerSelect(beer)}
                    style={{
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      color: "#e8d5a3",
                      fontSize: "0.9rem",
                      borderBottom: "1px solid #2a2010",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "#2a2010"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    {beer.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset button */}
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
        <Slider label="Sweet" value={vals.sweet} onChange={set("sweet")} left="Dry" right="Sweet" flashing={flashing.sweet} />

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
          onClick={handleGenerate}
          disabled={isLoading}
          style={{
            width: "100%", padding: "1.1rem", background: "linear-gradient(135deg, #c8860a, #f0c040)",
            border: "none", borderRadius: "10px", color: "#0a0600", fontWeight: "800",
            fontSize: "1.05rem", cursor: isLoading ? "not-allowed" : "pointer", letterSpacing: "0.04em",
            fontFamily: "'Playfair Display', serif",
            boxShadow: "0 4px 24px rgba(240,192,64,0.3)",
            transition: "opacity 0.2s",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={e => !isLoading && (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={e => !isLoading && (e.currentTarget.style.opacity = "1")}
        >
          {isLoading ? "Generating Recommendations..." : "Generate Recommendations →"}
        </button>
      </div>
    </div>
  );
}

function ChatPage({ sessionId, initialMessage, onBack }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: initialMessage }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem",
        padding: "1rem", background: "#0e0b04", border: "1px solid #2a2010", borderRadius: "10px"
      }}>
        <button
          onClick={onBack}
          style={{
            padding: "0.5rem 1rem", background: "none", border: "1px solid #3a2e18",
            borderRadius: "6px", color: "#6a5a3a", cursor: "pointer",
            fontSize: "0.9rem", fontFamily: "inherit",
          }}
          onMouseOver={e => e.currentTarget.style.color = "#f0c040"}
          onMouseOut={e => e.currentTarget.style.color = "#6a5a3a"}
        >
          ← Back to Input
        </button>
        <div>
          <h2 style={{ margin: 0, color: "#f0c040", fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>
            Beer Recommendations Chat
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "#8a7a5a", fontSize: "0.85rem" }}>
            Ask questions about your beer recommendations!
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        height: "60vh", overflowY: "auto", padding: "1rem",
        background: "#0e0b04", border: "1px solid #2a2010",
        borderRadius: "10px", marginBottom: "1rem"
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{
            marginBottom: "1.5rem", display: "flex",
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: "70%", padding: "1rem 1.2rem",
              background: message.role === 'user' ? "#f0c040" : "#1a1208",
              color: message.role === 'user' ? "#0a0600" : "#e8d5a3",
              borderRadius: "15px",
              border: message.role === 'user' ? "none" : "1px solid #2a2010",
              fontSize: "0.95rem", lineHeight: 1.5, whiteSpace: "pre-wrap"
            }}>
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{
              padding: "1rem 1.2rem", background: "#1a1208",
              border: "1px solid #2a2010", borderRadius: "15px",
              color: "#8a7a5a", fontSize: "0.95rem"
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        display: "flex", gap: "0.5rem", padding: "1rem",
        background: "#0e0b04", border: "1px solid #2a2010", borderRadius: "10px"
      }}>
        <textarea
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your beer recommendations..."
          style={{
            flex: 1, minHeight: "50px", maxHeight: "120px",
            background: "#1a1208", border: "1px solid #3a2e18",
            borderRadius: "8px", color: "#e8d5a3", padding: "0.75rem",
            fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", outline: "none"
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: "0.75rem 1.5rem",
            background: isLoading || !inputMessage.trim() ? "#2a2010" : "linear-gradient(135deg, #c8860a, #f0c040)",
            border: "none", borderRadius: "8px",
            color: isLoading || !inputMessage.trim() ? "#6a5a3a" : "#0a0600",
            fontWeight: "600",
            cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
            fontSize: "0.95rem", fontFamily: "inherit", alignSelf: "flex-end"
          }}
        >
          {isLoading ? "..." : "Send"}
        </button>
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
          Settings are not yet persisted — they'll reset on page refresh.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("input");
  const [chatData, setChatData] = useState(null);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
        setChatData(event.state.chatData || null);
      } else {
        // Default to input page if no state
        setPage("input");
        setChatData(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleGenerate(sessionId, llmMessage) {
    const newChatData = { sessionId, initialMessage: llmMessage };
    setChatData(newChatData);
    setPage("chat");
    
    // Push state to browser history
    window.history.pushState(
      { page: "chat", chatData: newChatData },
      "",
      window.location.href
    );
  }

  function handleBackToInput() {
    setPage("input");
    setChatData(null);
    
    // Go back in browser history
    window.history.back();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080501", fontFamily: "'DM Sans', sans-serif", color: "#e8d5a3" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <header style={{
        padding: "1rem 3rem", borderBottom: "1px solid #2a2010",
        background: "rgba(8,5,1,0.97)", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div style={{
            width: "44px", height: "44px", border: "2px dashed #3a2e18",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4a3e28", fontSize: "0.55rem", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.4,
          }}>
            🍺
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
      </header>

      <main style={{ padding: "2.5rem 3rem 4rem" }}>
        {page === "input" && <InputPage onGenerate={handleGenerate} />}
        {page === "chat" && chatData && (
          <ChatPage
            sessionId={chatData.sessionId}
            initialMessage={chatData.initialMessage}
            onBack={handleBackToInput}
          />
        )}
      </main>
    </div>
  );
}
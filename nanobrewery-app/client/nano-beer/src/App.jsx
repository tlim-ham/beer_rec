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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8002";

// Color palette with improved contrast
const COLORS = {
  primary: "#ffd966",      // Brighter gold
  primaryDark: "#d4a017",  // Darker gold
  text: "#f5f1e8",          // Much lighter text
  textMuted: "#c9bfaa",    // Better contrast for secondary text
  textDim: "#9a8f7a",      // Even darker for hints
  bg: "#0a0703",            // Slightly darker background
  bgAlt: "#13100a",         // Alternate background
  border: "#3a3220",        // Better visible borders
};

function Slider({ label, value, onChange, left, right, flashing }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const vocabEntry = VOCABULARY[label] || { def: "", hint: "" };

  return (
    <div style={{
      marginBottom: "1.4rem",
      borderRadius: "8px",
      padding: "0.5rem 0.6rem",
      background: flashing ? "rgba(255,217,102,0.1)" : "transparent",
      transition: "background 0.6s ease",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
        <span 
          style={{ 
            fontFamily: "'DM Sans', sans-serif", 
            fontSize: "0.95rem", 
            color: COLORS.primary, 
            cursor: "help", 
            position: "relative",
            fontWeight: "600"
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {label} <span style={{ fontSize: "0.7rem", color: COLORS.textDim, marginLeft: "0.3rem" }}>?</span>
          
          {/* Tooltip */}
          {showTooltip && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              right: 0,
              background: COLORS.bgAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              color: COLORS.text,
              whiteSpace: "normal",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              pointerEvents: "none",
              minWidth: "180px",
            }}>
              <div style={{ color: COLORS.primary, fontWeight: "600", marginBottom: "0.3rem" }}>{vocabEntry.def}</div>
              <div style={{ color: COLORS.textDim, fontSize: "0.75rem", fontStyle: "italic" }}>{vocabEntry.hint}</div>
              {/* Arrow pointing down */}
              <div style={{
                position: "absolute",
                bottom: "-6px",
                left: "10px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `6px solid ${COLORS.bgAlt}`,
              }} />
            </div>
          )}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: COLORS.primary, fontWeight: "700" }}>{value}</span>
      </div>
      <input
        type="range" min="0" max="100" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.primary, cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
        <span style={{ fontSize: "0.7rem", color: COLORS.textDim, fontFamily: "'DM Sans', sans-serif" }}>{left}</span>
        <span style={{ fontSize: "0.7rem", color: COLORS.textDim, fontFamily: "'DM Sans', sans-serif" }}>{right}</span>
      </div>
    </div>
  );
}

function TasteBar({ label, value }) {
  const pct = (value / 100) * 100;
  return (
    <div style={{ marginBottom: "0.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.85rem", color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: "500" }}>{label}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: COLORS.primary, fontWeight: "700" }}>{value.toFixed(1)}/100</span>
      </div>
      <div style={{ background: COLORS.bgAlt, borderRadius: "4px", height: "6px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.primaryDark}, ${COLORS.primary})`, borderRadius: "4px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "0.75rem", 
      letterSpacing: "0.15em", 
      textTransform: "uppercase",
      color: COLORS.textDim, 
      marginBottom: "0.8rem", 
      marginTop: "1.2rem",
      borderBottom: `1px solid ${COLORS.border}`, 
      paddingBottom: "0.4rem",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: "600"
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

      if (response.status === 429) {
        const error = await response.json();
        alert(`⏳ ${error.detail}\n\nTake a breath and try again in a moment!`);
        return;
      }

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      onGenerate(data.session_id, data.intro_message, data.suggested_questions);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="input-page-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "3rem", alignItems: "start" }}>

      {/* Left — beer picker + sliders */}
      <div>
        <SectionLabel>Start with a beer you already enjoy</SectionLabel>
        <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.8rem", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>
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
                background: COLORS.bgAlt,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontFamily: "'DM Sans', sans-serif",
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
                background: COLORS.bgAlt,
                border: `1px solid ${COLORS.border}`,
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
                      color: COLORS.text,
                      fontSize: "0.9rem",
                      fontFamily: "'DM Sans', sans-serif",
                      borderBottom: `1px solid ${COLORS.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = COLORS.border}
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
              padding: "0.75rem 1rem", 
              background: "none",
              border: `1px solid ${COLORS.border}`, 
              borderRadius: "8px",
              color: COLORS.textDim, 
              fontSize: "0.8rem", 
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", 
              letterSpacing: "0.05em",
              fontWeight: "600",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.color = COLORS.primary; e.currentTarget.style.borderColor = COLORS.primary; }}
            onMouseOut={e => { e.currentTarget.style.color = COLORS.textDim; e.currentTarget.style.borderColor = COLORS.border; }}
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

        <SectionLabel>Hop</SectionLabel>
        <Slider label="Hoppy" value={vals.hoppy} onChange={set("hoppy")} left="Low" right="High" flashing={flashing.hoppy} />
        <Slider label="Bitter" value={vals.bitter} onChange={set("bitter")} left="Low" right="High" flashing={flashing.bitter} />

        <SectionLabel>Edge</SectionLabel>
        <Slider label="Spices" value={vals.spices} onChange={set("spices")} left="None" right="Spiced" flashing={flashing.spices} />
        <Slider label="Salty" value={vals.salty} onChange={set("salty")} left="None" right="Salty" flashing={flashing.salty} />
      </div>

      {/* Right — snapshot + CTA */}
      <div className="sticky-right" style={{ position: "sticky", top: "90px" }}>
        <SectionLabel>Your taste snapshot</SectionLabel>
        <div style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.4rem", marginBottom: "1.2rem" }}>
          <TasteBar label="Richness" value={(vals.body + vals.malty) / 2} />
          <TasteBar label="Brightness" value={(vals.sour + vals.fruits) / 2} />
          <TasteBar label="Hops" value={(vals.hoppy + vals.bitter) / 2} />
          <TasteBar label="Edge" value={(vals.spices + vals.salty) / 2} />
        </div>

        <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", fontStyle: "italic", marginBottom: "1.2rem", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          We'll match your profile against our brewery's catalog and surface the beers closest to your palate.
        </p>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          style={{
            width: "100%", 
            padding: "1.1rem", 
            background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
            border: "none", 
            borderRadius: "10px", 
            color: "#0a0600", 
            fontWeight: "800",
            fontSize: "1.05rem", 
            cursor: isLoading ? "not-allowed" : "pointer", 
            letterSpacing: "0.04em",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: `0 4px 24px rgba(255,217,102,0.3)`,
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

function ChatPage({ sessionId, initialMessage, suggestedQuestions, onBack }) {
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

      if (response.status === 429) {
        const error = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⏳ ${error.detail}\n\nTake a breath and try again in a moment!`
        }]);
        return;
      }

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
        padding: "1rem", background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, borderRadius: "10px"
      }}>
        <button
          onClick={onBack}
          style={{
            padding: "0.5rem 1rem", 
            background: "none", 
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px", 
            color: COLORS.textDim, 
            cursor: "pointer",
            fontSize: "0.9rem", 
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: "600"
          }}
          onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
          onMouseOut={e => e.currentTarget.style.color = COLORS.textDim}
        >
          ← Back to Input
        </button>
        <div>
          <h2 style={{ margin: 0, color: COLORS.primary, fontFamily: "'DM Sans', sans-serif", fontSize: "1.5rem", fontWeight: "700" }}>
            Beer Recommendations Chat
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", color: COLORS.textMuted, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>
            Ask questions about your beer recommendations!
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        height: "60vh", overflowY: "auto", padding: "1rem",
        background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`,
        borderRadius: "10px", marginBottom: "1rem"
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{
            marginBottom: "1.5rem", display: "flex",
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: "70%", padding: "1rem 1.2rem",
              background: message.role === 'user' ? COLORS.primary : COLORS.bgAlt,
              color: message.role === 'user' ? "#0a0600" : COLORS.text,
              borderRadius: "15px",
              border: message.role === 'user' ? "none" : `1px solid ${COLORS.border}`,
              fontSize: "0.95rem", 
              lineHeight: 1.5, 
              whiteSpace: "pre-wrap",
              fontFamily: "'DM Sans', sans-serif"
            }}>
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{
              padding: "1rem 1.2rem", 
              background: COLORS.bgAlt,
              border: `1px solid ${COLORS.border}`, 
              borderRadius: "15px",
              color: COLORS.textMuted, 
              fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif"
            }}>
              Thinking...
            </div>
          </div>
        )}
        
        {/* Suggested Questions - Quick Reply Buttons */}
        {!isLoading && suggestedQuestions && suggestedQuestions.length > 0 && messages.length === 1 && (
          <div style={{
            marginBottom: "1.5rem", display: "flex",
            justifyContent: "flex-start"
          }}>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "0.5rem", maxWidth: "85%"
            }}>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(question);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  style={{
                    padding: "0.6rem 0.9rem", 
                    background: COLORS.primary,
                    border: `2px solid ${COLORS.primaryDark}`, 
                    borderRadius: "20px",
                    color: "#0a0600", 
                    fontSize: "0.85rem", 
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", 
                    fontWeight: "600", 
                    transition: "all 0.2s ease",
                    boxShadow: `0 2px 6px rgba(255,217,102,0.3)`
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = COLORS.primaryDark;
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 10px rgba(255,217,102,0.5)`;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = COLORS.primary;
                    e.currentTarget.style.borderColor = COLORS.primaryDark;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 2px 6px rgba(255,217,102,0.3)`;
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        display: "flex", gap: "0.5rem", padding: "1rem",
        background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, borderRadius: "10px"
      }}>
        <textarea
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your beer recommendations..."
          style={{
            flex: 1, minHeight: "50px", maxHeight: "120px",
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: "8px", color: COLORS.text, padding: "0.75rem",
            fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none"
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: "0.75rem 1.5rem",
            background: isLoading || !inputMessage.trim() ? COLORS.border : `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
            border: "none", 
            borderRadius: "8px",
            color: isLoading || !inputMessage.trim() ? COLORS.textDim : "#0a0600",
            fontWeight: "600",
            cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
            fontSize: "0.95rem", 
            fontFamily: "'DM Sans', sans-serif", 
            alignSelf: "flex-end"
          }}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>

      {/* Permanent Disclaimer */}
      <div style={{
        marginTop: "1rem",
        padding: "0.75rem",
        background: COLORS.bgAlt,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <p style={{
          margin: 0,
          color: COLORS.textMuted,
          fontSize: "0.8rem",
          fontStyle: "italic",
          lineHeight: 1.4,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          Hoppy can make mistakes. For the most accurate information, please double-check with official sources.
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
          width: "360px", 
          background: COLORS.bgAlt, 
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text, 
          padding: "0.7rem 1rem", 
          borderRadius: "8px",
          fontSize: "0.9rem", 
          marginBottom: "1.5rem", 
          fontFamily: "'DM Sans', sans-serif", 
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.8rem" }}>
        {filtered.map(([name, v]) => (
          <div key={name} style={{
            padding: "1rem 1.2rem", 
            background: COLORS.bgAlt,
            border: `1px solid ${COLORS.border}`, 
            borderRadius: "10px",
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: COLORS.primary, marginBottom: "0.3rem", fontWeight: "700" }}>{name}</div>
            <div style={{ color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.3rem", fontFamily: "'DM Sans', sans-serif" }}>{v.def}</div>
            <div style={{ color: COLORS.textDim, fontSize: "0.75rem", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>{v.hint}</div>
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
      padding: "0.9rem 0", borderBottom: `1px solid ${COLORS.bgAlt}`,
    }}>
      <div>
        <div style={{ color: COLORS.text, fontSize: "0.9rem", marginBottom: "0.15rem", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" }}>{label}</div>
        <div style={{ color: COLORS.textDim, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px",
          background: value ? COLORS.primary : COLORS.border,
          border: "none", cursor: "pointer", position: "relative",
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: "3px",
          left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%",
          background: value ? "#0a0600" : COLORS.textDim,
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
      <div style={{ marginTop: "2rem", padding: "1rem", background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, borderRadius: "10px" }}>
        <p style={{ color: COLORS.textDim, fontSize: "0.78rem", fontStyle: "italic", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Settings are not yet persisted — they'll reset on page refresh.
        </p>
      </div>
    </div>
  );
}

function DisclaimerModal({ onAccept }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: COLORS.bgAlt,
        border: `2px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "2rem",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)"
      }}>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1.8rem",
          color: COLORS.primary,
          margin: "0 0 1.5rem 0",
          textAlign: "center",
          fontWeight: "700"
        }}>
          ⚠️ Important Disclaimers
        </h2>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          {/* Age requirement */}
          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            padding: "1rem",
          }}>
            <h3 style={{
              color: COLORS.primary,
              fontSize: "1rem",
              margin: "0 0 0.5rem 0",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "700"
            }}>
              🔞 Age Restriction
            </h3>
            <p style={{
              color: COLORS.text,
              fontSize: "0.9rem",
              lineHeight: 1.5,
              margin: 0,
              fontFamily: "'DM Sans', sans-serif"
            }}>
              You must be 21 years of age or older to use this application. By accessing this service, you confirm that you meet this age requirement.
            </p>
          </div>

          {/* Responsible drinking */}
          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            padding: "1rem",
          }}>
            <h3 style={{
              color: COLORS.primary,
              fontSize: "1rem",
              margin: "0 0 0.5rem 0",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "700"
            }}>
              🥤 Drink Responsibly
            </h3>
            <p style={{
              color: COLORS.text,
              fontSize: "0.9rem",
              lineHeight: 1.5,
              margin: 0,
              fontFamily: "'DM Sans', sans-serif"
            }}>
              Please drink responsibly. Know your limits, never drink and drive, and always prioritize your health and safety. This tool is for educational purposes only.
            </p>
          </div>

          {/* Non-affiliation */}
          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            padding: "1rem",
          }}>
            <h3 style={{
              color: COLORS.primary,
              fontSize: "1rem",
              margin: "0 0 0.5rem 0",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "700"
            }}>
              🏫 Non-Affiliation Notice
            </h3>
            <p style={{
              color: COLORS.text,
              fontSize: "0.9rem",
              lineHeight: 1.5,
              margin: 0,
              fontFamily: "'DM Sans', sans-serif"
            }}>
              This application is not affiliated with, endorsed by, or associated with Hamilton College. It is an independent project created for educational purposes.
            </p>
          </div>
        </div>

        <button
          onClick={onAccept}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            background: COLORS.primary,
            border: "none",
            borderRadius: "8px",
            color: "#0a0600",
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.2s",
          }}
          onMouseOver={e => e.currentTarget.style.background = COLORS.primaryDark}
          onMouseOut={e => e.currentTarget.style.background = COLORS.primary}
        >
          I Understand & Accept
        </button>

        <p style={{
          color: COLORS.textDim,
          fontSize: "0.75rem",
          textAlign: "center",
          margin: "1rem 0 0 0",
          fontStyle: "italic",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          You must accept these terms to continue
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("input");
  const [chatData, setChatData] = useState(null);
  const [disclaimersAccepted, setDisclaimersAccepted] = useState(false);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
        setChatData(event.state.chatData || null);
      } else {
        setPage("input");
        setChatData(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleAcceptDisclaimers() {
    setDisclaimersAccepted(true);
  }

  function handleGenerate(sessionId, llmMessage, suggestedQuestions) {
    const newChatData = { sessionId, initialMessage: llmMessage, suggestedQuestions };
    setChatData(newChatData);
    setPage("chat");
    
    window.history.pushState(
      { page: "chat", chatData: newChatData },
      "",
      window.location.href
    );
  }

  function handleBackToInput() {
    setPage("input");
    setChatData(null);
    window.history.back();
  }

  if (!disclaimersAccepted) {
    return <DisclaimerModal onAccept={handleAcceptDisclaimers} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'DM Sans', sans-serif", color: COLORS.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{
        padding: "2rem 3rem", 
        borderBottom: `1px solid ${COLORS.border}`,
        background: "rgba(10, 7, 3, 0.97)", 
        position: "sticky", 
        top: 0, 
        zIndex: 100,
        backdropFilter: "blur(8px)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <img
            src="/beer-logo.png"
            alt="Beer Logo"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "8px",
              objectFit: "contain",
            }}
          />
          <div>
            <h1 style={{
              fontFamily: "'DM Sans', sans-serif", 
              fontSize: "2.5rem",
              fontWeight: "900", 
              margin: 0, 
              color: COLORS.primary, 
              letterSpacing: "-0.02em",
            }}>
              Hoppy
            </h1>
            <p style={{ margin: 0, fontSize: "0.9rem", color: COLORS.textDim, letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>
              Know Your Beer • Enjoy Your Beer
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
            suggestedQuestions={chatData.suggestedQuestions}
            onBack={handleBackToInput}
          />
        )}
      </main>
    </div>
  );
}
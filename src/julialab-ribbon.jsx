import { useState } from "react";

// ─── Icon Components ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  newFile:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  open:     "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  save:     "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
  undo:     "M3 7v6h6 M3 13A9 9 0 1 0 5.7 6",
  redo:     "M21 7v6h-6 M21 13A9 9 0 1 1 18.3 6",
  run:      "M5 3l14 9-14 9V3z",
  stop:     "M18 6H6v12h12z",
  step:     "M5 4l10 8-10 8V4z M19 5v14",
  pause:    "M6 4h4v16H6z M14 4h4v16h-4z",
  cut:      "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  copy:     "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  paste:    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z",
  find:     "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M21 21l-4.35-4.35",
  debug:    ["M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z", "M12 8v4 M12 16h.01"],
  pkg:      ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12"],
  terminal: ["M4 17l6-6-6-6", "M12 19h8"],
  notebook: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  plot:     ["M3 3v18h18", "M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"],
  scatter:  ["M3 3v18h18", "M7 16l3-3 M14 9l2 2 M10 12l2-3"],
  surface:  ["M2 12l10-8 10 8 M2 12v8h20v-8", "M2 12l5 5 5-5 5 5 5-5"],
  heatmap:  ["M3 3h5v5H3z M9 3h5v5H9z M15 3h5v5h-5z M3 9h5v5H3z M9 9h5v5H9z M15 9h5v5h-5z M3 15h5v5H3z M9 15h5v5H9z M15 15h5v5h-5z"],
  bode:     ["M3 3v18h18", "M3 15q3-6 6-3t6-6 3 6"],
  layout:   ["M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"],
  ai:       ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M8 14s1.5 2 4 2 4-2 4-2","M9 9h.01 M15 9h.01"],
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  help:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01",
  chevronDown: "M6 9l6 6 6-6",
  expand:   "M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7",
  collapse: "M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  revise:   ["M23 4v6h-6", "M20.49 15a9 9 0 1 1-.49-5"],
  format:   ["M4 6h16","M4 12h10","M4 18h14"],
  section:  ["M3 3h18v4H3z","M3 10h18v4H3z","M3 17h18v4H3z"],
  breakpt:  ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M15 9l-6 6","M9 9l6 6"],
  git:      ["M18 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M9 6h6M6 15v-3"],
  workspace:"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  insert:   ["M12 5v14","M5 12h14"],
  image:    ["M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z","M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z","M21 15l-5-5L5 21"],
  table:    ["M3 3h18v18H3z","M3 9h18","M3 15h18","M9 3v18","M15 3v18"],
  equation: ["M4 7h16","M4 17h16","M8 3v18"],
  camera:   ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  dashboard:["M3 3h7v9H3z","M14 3h7v5h-7z","M14 12h7v9h-7z","M3 16h7v6H3z"],
  gauges:   ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 12l-4.24-4.24","M7 7l1.5 1.5"],
};

// ─── Ribbon Button ────────────────────────────────────────────────────────────
const RibbonBtn = ({ iconKey, label, large = false, disabled = false, onClick, active = false, split = false, dropdown = false }) => {
  const [hovered, setHovered] = useState(false);
  const bg = active ? "rgba(56,152,38,0.18)" : hovered ? "rgba(255,255,255,0.08)" : "transparent";
  const iconColor = disabled ? "#666" : active ? "#4ec832" : hovered ? "#e8e8e8" : "#ccc";
  const textColor = disabled ? "#555" : active ? "#4ec832" : "#bbb";

  if (large) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 4, padding: "6px 8px", minWidth: 52, background: bg,
          border: active ? "1px solid rgba(56,152,38,0.4)" : "1px solid transparent",
          borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.12s ease", opacity: disabled ? 0.45 : 1,
        }}
      >
        <Icon d={icons[iconKey]} size={22} color={iconColor} />
        <span style={{ fontSize: 10, fontFamily: "'IBM Plex Sans', sans-serif", color: textColor, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", flexDirection: "row", alignItems: "center", gap: 5,
          padding: "3px 7px", background: bg,
          border: active ? "1px solid rgba(56,152,38,0.4)" : "1px solid transparent",
          borderRadius: split ? "4px 0 0 4px" : 4,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.12s ease", opacity: disabled ? 0.45 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <Icon d={icons[iconKey]} size={14} color={iconColor} />
        <span style={{ fontSize: 10.5, fontFamily: "'IBM Plex Sans', sans-serif", color: textColor, letterSpacing: "0.01em" }}>
          {label}
        </span>
      </button>
      {dropdown && (
        <button style={{
          display: "flex", alignItems: "center", padding: "3px 3px",
          background: hovered ? "rgba(255,255,255,0.06)" : "transparent",
          border: "1px solid transparent", borderLeft: "1px solid #333",
          borderRadius: "0 4px 4px 0", cursor: "pointer",
        }}>
          <Icon d={icons.chevronDown} size={10} color="#777" />
        </button>
      )}
    </div>
  );
};

// ─── Ribbon Divider ───────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ width: 1, background: "linear-gradient(to bottom, transparent, #3a3a3a, transparent)", margin: "4px 3px", alignSelf: "stretch" }} />
);

// ─── Ribbon Group ─────────────────────────────────────────────────────────────
const RibbonGroup = ({ title, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, flex: 1, padding: "4px 6px 2px" }}>
      {children}
    </div>
    <div style={{
      fontSize: 9.5, color: "#555", textAlign: "center", padding: "1px 6px 3px",
      fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase",
      borderTop: "1px solid #2a2a2a",
    }}>
      {title}
    </div>
  </div>
);

// ─── Tab Content Definitions ──────────────────────────────────────────────────
const tabContents = {
  HOME: () => (
    <>
      <RibbonGroup title="File">
        <RibbonBtn iconKey="newFile" label="New" large />
        <RibbonBtn iconKey="open" label="Open" large dropdown />
        <RibbonBtn iconKey="save" label="Save" large split dropdown />
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Navigate">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="find" label="Find" />
          <RibbonBtn iconKey="find" label="Find Files" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="undo" label="Undo" />
          <RibbonBtn iconKey="redo" label="Redo" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Edit">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="cut" label="Cut" />
          <RibbonBtn iconKey="copy" label="Copy" />
          <RibbonBtn iconKey="paste" label="Paste" dropdown />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Code">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="format" label="Format Code" />
          <RibbonBtn iconKey="section" label="Run Section" />
          <RibbonBtn iconKey="breakpt" label="Breakpoints" dropdown />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Run">
        <RibbonBtn iconKey="run" label="Run" large active />
        <RibbonBtn iconKey="step" label="Step" large />
        <RibbonBtn iconKey="stop" label="Stop" large disabled />
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Environment">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="pkg" label="Packages" dropdown />
          <RibbonBtn iconKey="workspace" label="Workspace" />
        </div>
        <RibbonBtn iconKey="revise" label="Revise ✓" large active />
      </RibbonGroup>
    </>
  ),

  PLOTS: () => (
    <>
      <RibbonGroup title="2D Plots">
        <RibbonBtn iconKey="plot" label="Line" large />
        <RibbonBtn iconKey="scatter" label="Scatter" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="heatmap" label="Heatmap" />
          <RibbonBtn iconKey="heatmap" label="Bar" />
          <RibbonBtn iconKey="heatmap" label="Histogram" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="3D Plots">
        <RibbonBtn iconKey="surface" label="Surface" large />
        <RibbonBtn iconKey="scatter" label="Scatter3D" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="surface" label="Mesh3D" />
          <RibbonBtn iconKey="surface" label="Volume" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Control & Signal">
        <RibbonBtn iconKey="bode" label="Bode" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="bode" label="Nyquist" />
          <RibbonBtn iconKey="bode" label="Step Resp." />
          <RibbonBtn iconKey="bode" label="Root Locus" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Figure Style">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="settings" label="Theme" dropdown />
          <RibbonBtn iconKey="settings" label="Colormap" dropdown />
          <RibbonBtn iconKey="camera" label="Export…" dropdown />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="expand" label="Detach Fig." />
          <RibbonBtn iconKey="camera" label="Copy Code" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Backend">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="settings" label="GLMakie" active dropdown />
          <RibbonBtn iconKey="settings" label="CairoMakie" />
          <RibbonBtn iconKey="settings" label="WGLMakie" />
        </div>
      </RibbonGroup>
    </>
  ),

  APPS: () => (
    <>
      <RibbonGroup title="Launch Apps">
        <RibbonBtn iconKey="dashboard" label="Genie App" large />
        <RibbonBtn iconKey="gauges" label="Dashboard" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="notebook" label="Pluto.jl" dropdown />
          <RibbonBtn iconKey="terminal" label="REPL App" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Build App">
        <RibbonBtn iconKey="dashboard" label="New Genie App" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="layout" label="UI Builder" />
          <RibbonBtn iconKey="insert" label="Add Component" />
          <RibbonBtn iconKey="settings" label="Callbacks" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Interact.jl Widgets">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="insert" label="Slider" />
          <RibbonBtn iconKey="insert" label="Toggle" />
          <RibbonBtn iconKey="insert" label="Dropdown" />
          <RibbonBtn iconKey="insert" label="Text Input" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="App Gallery">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="find" label="Browse Gallery" />
          <RibbonBtn iconKey="pkg" label="Install App" />
          <RibbonBtn iconKey="camera" label="Share App" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Dyad / Modeling">
        <RibbonBtn iconKey="surface" label="Open Dyad" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="settings" label="MTK Model" />
          <RibbonBtn iconKey="bode" label="Control App" />
        </div>
      </RibbonGroup>
    </>
  ),

  "LIVE EDITOR": () => (
    <>
      <RibbonGroup title="File">
        <RibbonBtn iconKey="newFile" label="New" large />
        <RibbonBtn iconKey="save" label="Save" large />
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Navigate">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="find" label="Go To" />
          <RibbonBtn iconKey="find" label="Find" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Text">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {["B","I","U","M"].map(l => (
              <button key={l} style={{
                width: 22, height: 22, fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                background: l === "M" ? "rgba(56,152,38,0.25)" : "transparent",
                border: l === "M" ? "1px solid #389826" : "1px solid #333",
                borderRadius: 3, color: l === "M" ? "#4ec832" : "#aaa", cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#888", fontFamily: "IBM Plex Sans" }}>Normal</span>
            <Icon d={icons.chevronDown} size={10} color="#666" />
          </div>
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Insert">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="equation" label="Equation (LaTeX)" />
          <RibbonBtn iconKey="image" label="Image" />
          <RibbonBtn iconKey="table" label="Table" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="section" label="Section Break" />
          <RibbonBtn iconKey="insert" label="Hyperlink" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Code">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="insert" label="Code Block" />
          <RibbonBtn iconKey="settings" label="Refactor…" dropdown />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="settings" label="Control Flow" dropdown />
          <RibbonBtn iconKey="debug" label="Task…" dropdown />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Analyze">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="debug" label="Section ▶" active />
          <RibbonBtn iconKey="debug" label="All Sections" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Run">
        <RibbonBtn iconKey="run" label="Run" large active />
        <RibbonBtn iconKey="step" label="Step" large />
        <RibbonBtn iconKey="stop" label="Stop" large disabled />
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Publish">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="camera" label="Export PDF" />
          <RibbonBtn iconKey="camera" label="Export HTML" />
          <RibbonBtn iconKey="camera" label="Export Markdown" />
        </div>
      </RibbonGroup>
    </>
  ),

  INSERT: () => (
    <>
      <RibbonGroup title="Inline Code">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="insert" label="Code Block" />
          <RibbonBtn iconKey="section" label="Cell (##)" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Text & Math">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="equation" label="LaTeX Equation" />
          <RibbonBtn iconKey="format" label="Markdown Text" />
          <RibbonBtn iconKey="insert" label="Hyperlink" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Media">
        <RibbonBtn iconKey="image" label="Image" large />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="table" label="Table" />
          <RibbonBtn iconKey="camera" label="Video" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Widgets">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="insert" label="Slider" />
          <RibbonBtn iconKey="insert" label="Dropdown" />
          <RibbonBtn iconKey="insert" label="Button" />
          <RibbonBtn iconKey="gauges" label="Gauge/Knob" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Plot Snippet">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="plot" label="Plot Template" dropdown />
          <RibbonBtn iconKey="surface" label="3D Template" dropdown />
        </div>
      </RibbonGroup>
    </>
  ),

  VIEW: () => (
    <>
      <RibbonGroup title="Layout">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="layout" label="Default Layout" active />
          <RibbonBtn iconKey="layout" label="Wide Editor" />
          <RibbonBtn iconKey="layout" label="Presentation" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Panels">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="eye" label="File Browser" active />
          <RibbonBtn iconKey="eye" label="Workspace" active />
          <RibbonBtn iconKey="eye" label="Command Window" active />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="eye" label="AI Pane" active />
          <RibbonBtn iconKey="eye" label="Help Browser" />
          <RibbonBtn iconKey="eye" label="Plot Panel" active />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Sidebar Panels">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="debug" label="Debugger" />
          <RibbonBtn iconKey="git" label="Git / Source Ctrl" />
          <RibbonBtn iconKey="find" label="Code Issues" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="format" label="Code Outline" active />
          <RibbonBtn iconKey="debug" label="Test Browser" />
          <RibbonBtn iconKey="settings" label="Profiler" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Theme">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="eye" label="Dark (default)" active />
          <RibbonBtn iconKey="eye" label="Light" />
          <RibbonBtn iconKey="eye" label="System" />
        </div>
      </RibbonGroup>
      <Divider />
      <RibbonGroup title="Ribbon">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn iconKey="collapse" label="Hide Ribbon (F2)" />
          <RibbonBtn iconKey="expand" label="Pin Ribbon" active />
        </div>
      </RibbonGroup>
    </>
  ),
};

// ─── Main Ribbon Component ────────────────────────────────────────────────────
export default function JuliaLabRibbon() {
  const TABS = ["HOME", "PLOTS", "APPS", "LIVE EDITOR", "INSERT", "VIEW"];
  const [activeTab, setActiveTab] = useState("LIVE EDITOR");
  const [ribbonVisible, setRibbonVisible] = useState(true);
  const [ribbonPinned, setRibbonPinned] = useState(true);
  const [hoveredTab, setHoveredTab] = useState(null);

  const showRibbon = ribbonVisible || ribbonPinned;
  const TabContent = tabContents[activeTab];

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', sans-serif",
      background: "#1a1a1a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { height: 4px; background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        button { outline: none; }
      `}</style>

      {/* ── Title Bar ─────────────────────────────────────────── */}
      <div style={{
        height: 28, background: "#111", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 12px",
        borderBottom: "1px solid #222",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Julia logo dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {["#cb3c33","#389826","#9558b2"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#666", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
            JuliaLab — mysphere.jl
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button
            onClick={() => setRibbonVisible(v => !v)}
            title="Toggle Ribbon (F2)"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 10, fontFamily: "IBM Plex Sans", letterSpacing: "0.05em" }}
          >
            {ribbonVisible ? "▲ HIDE RIBBON" : "▼ SHOW RIBBON"} · F2
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {["–","□","×"].map((s, i) => (
              <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 13, lineHeight: 1, padding: "0 2px" }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div style={{
        height: 30, background: "#1e1e1e",
        display: "flex", alignItems: "flex-end",
        borderBottom: "1px solid #222",
        padding: "0 4px",
      }}>
        {/* Quick toolbar icons */}
        <div style={{ display: "flex", gap: 2, alignItems: "center", padding: "0 8px 4px", borderRight: "1px solid #2a2a2a", marginRight: 4 }}>
          {[["newFile","New"], ["open","Open"], ["save","Save"], null, ["undo","Undo"], ["redo","Redo"]].map((item, i) =>
            item === null ? <div key={i} style={{ width: 1, height: 16, background: "#2d2d2d", margin: "0 2px" }} /> : (
              <button key={i} title={item[1]} style={{
                background: "none", border: "none", cursor: "pointer", padding: "2px 3px",
                borderRadius: 3, color: "#666",
                transition: "color 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
              onMouseLeave={e => e.currentTarget.style.color = "#666"}
              >
                <Icon d={icons[item[0]]} size={13} color="currentColor" />
              </button>
            )
          )}
        </div>

        {TABS.map(tab => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setRibbonVisible(true); }}
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                height: "100%", padding: "0 14px",
                background: isActive ? "#252525" : "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid #389826" : "2px solid transparent",
                borderTop: "2px solid transparent",
                cursor: "pointer",
                color: isActive ? "#e0e0e0" : hoveredTab === tab ? "#aaa" : "#555",
                fontSize: 11.5, fontWeight: isActive ? 600 : 400,
                fontFamily: "'IBM Plex Sans', sans-serif",
                letterSpacing: "0.04em",
                transition: "all 0.1s",
              }}
            >
              {tab}
            </button>
          );
        })}

        {/* Right-side utilities */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center", paddingBottom: 4, paddingRight: 4 }}>
          {[["find","Search"], ["help","Help"], ["ai","AI Pane"], ["settings","Settings"]].map(([k, label]) => (
            <button key={k} title={label} style={{
              background: "none", border: "none", cursor: "pointer", color: "#555",
              padding: "2px 4px", borderRadius: 3,
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#aaa"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
            >
              <Icon d={icons[k]} size={14} color="currentColor" />
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: "#2d2d2d", margin: "0 4px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {["#cb3c33","#389826","#9558b2"].map((c,i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
            <span style={{ fontSize: 10, color: "#444", fontFamily: "IBM Plex Mono", marginLeft: 2 }}>Julia 1.11</span>
          </div>
        </div>
      </div>

      {/* ── Ribbon ────────────────────────────────────────────── */}
      <div style={{
        height: ribbonVisible ? "auto" : 0,
        overflow: "hidden",
        background: "#252525",
        borderBottom: ribbonVisible ? "1px solid #1a1a1a" : "none",
        transition: "height 0.18s ease",
        boxShadow: ribbonVisible ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
      }}>
        <div style={{
          display: "flex", flexDirection: "row", alignItems: "stretch",
          overflowX: "auto", overflowY: "hidden",
          minHeight: 68, padding: "0 2px",
        }}>
          {TabContent && <TabContent />}
        </div>
      </div>

      {/* ── Path Bar ──────────────────────────────────────────── */}
      <div style={{
        height: 24, background: "#1c1c1c", display: "flex", alignItems: "center",
        padding: "0 10px", gap: 4, borderBottom: "1px solid #181818",
      }}>
        {["~","projects","julialab","mysphere.jl"].map((seg, i, arr) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              fontSize: 11, color: i === arr.length - 1 ? "#ccc" : "#555",
              fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer",
            }}
            onMouseEnter={e => { if (i < arr.length-1) e.target.style.color="#999" }}
            onMouseLeave={e => { if (i < arr.length-1) e.target.style.color="#555" }}
            >{seg}</span>
            {i < arr.length - 1 && <span style={{ color: "#333", fontSize: 11 }}>/</span>}
          </span>
        ))}
        {/* Env indicator */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#389826" }} />
          <span style={{ fontSize: 10, color: "#389826", fontFamily: "IBM Plex Mono" }}>Revise active</span>
          <div style={{ width: 1, height: 12, background: "#2a2a2a", margin: "0 4px" }} />
          <span style={{ fontSize: 10, color: "#555", fontFamily: "IBM Plex Mono" }}>(@v1.11)</span>
        </div>
      </div>

      {/* ── Editor / Content Area ─────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", background: "#1a1a1a" }}>
        {/* Left sidebar rail */}
        <div style={{
          width: 28, background: "#1c1c1c", borderRight: "1px solid #222",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "8px 0", gap: 6,
        }}>
          {[["workspace","Workspace"], ["plot","Plots"], ["pkg","Packages"], ["git","Git"], ["debug","Debug"]].map(([k, label]) => (
            <button key={k} title={label} style={{
              background: "none", border: "none", cursor: "pointer", color: "#444",
              padding: "5px 6px", borderRadius: 3, width: "100%", display: "flex", justifyContent: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#888"}
            onMouseLeave={e => e.currentTarget.style.color = "#444"}
            >
              <Icon d={icons[k]} size={15} color="currentColor" />
            </button>
          ))}
        </div>

        {/* Editor area mock */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* File tabs */}
          <div style={{ height: 30, background: "#1e1e1e", display: "flex", alignItems: "flex-end", borderBottom: "1px solid #181818", padding: "0 4px" }}>
            {["mysphere.jl ×", "analysis.jl"].map((t, i) => (
              <div key={i} style={{
                padding: "5px 14px", fontSize: 11, fontFamily: "IBM Plex Mono",
                color: i === 0 ? "#ddd" : "#555",
                background: i === 0 ? "#1a1a1a" : "transparent",
                borderTop: i === 0 ? "1px solid #389826" : "1px solid transparent",
                borderLeft: i === 0 ? "1px solid #222" : "1px solid transparent",
                borderRight: i === 0 ? "1px solid #222" : "1px solid transparent",
                cursor: "pointer",
              }}>{t}</div>
            ))}
          </div>

          {/* Editor content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Line numbers */}
            <div style={{ width: 40, background: "#1a1a1a", borderRight: "1px solid #222", padding: "16px 0", textAlign: "right" }}>
              {[1,2,3,4,5,"",6,7,8,"",9,10,11,12].map((n, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#3a3a3a", lineHeight: "20px", paddingRight: 8 }}>{n}</div>
              ))}
            </div>

            {/* Code + output */}
            <div style={{ flex: 1, padding: "16px 20px", overflow: "auto" }}>
              {/* Live Editor: text + code mixed */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12.5, color: "#8a9ab0", fontFamily: "IBM Plex Sans", lineHeight: 1.6, marginBottom: 8 }}>
                  Create and plot a sphere with radius <code style={{ fontFamily: "IBM Plex Mono", color: "#9558b2", fontSize: 12 }}>r</code>. The <code style={{ fontFamily: "IBM Plex Mono", color: "#9558b2", fontSize: 12 }}>sphere</code> function creates a unit sphere, which you can then scale and plot with the <code style={{ fontFamily: "IBM Plex Mono", color: "#9558b2", fontSize: 12 }}>surface</code> function.
                </p>
              </div>

              {/* Code block 1 */}
              <div style={{ display: "flex", marginBottom: 24 }}>
                {/* Section run button */}
                <div style={{
                  width: 3, background: "rgba(56,152,38,0.3)", borderRadius: 2,
                  marginRight: 12, flexShrink: 0, cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(56,152,38,0.7)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(56,152,38,0.3)"}
                title="Run Section"
                />
                <div style={{ flex: 1 }}>
                  {[
                    ["(x, y, z)", " = ", "sphere", "()"],
                    ["r", " = ", "2"],
                    ["surface", "(x*r, y*r, z*r)"],
                    ["axis", " ", ":equal"],
                  ].map((tokens, li) => (
                    <div key={li} style={{ lineHeight: "20px", fontSize: 12.5, fontFamily: "IBM Plex Mono" }}>
                      {tokens.map((tok, ti) => {
                        const color = ti === 0 ? "#a0b4d0" : tok.startsWith(":") ? "#cb3c33" : tok === " = " || tok === " " ? "#6a7a8a" : ["sphere","surface","axis"].includes(tok) ? "#9558b2" : "#a0b4d0";
                        return <span key={ti} style={{ color }}>{tok}</span>;
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline output: 3D sphere preview placeholder */}
              <div style={{
                width: 220, height: 180, background: "linear-gradient(135deg, #1e1e2e 0%, #252535 100%)",
                border: "1px solid #2a2a3a", borderRadius: 6, marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
              }}>
                {/* Fake 3D sphere representation */}
                <div style={{ position: "relative", width: 110, height: 110 }}>
                  <div style={{
                    width: 110, height: 110, borderRadius: "50%",
                    background: "conic-gradient(from 200deg, #cb3c33, #389826, #9558b2, #389826, #cb3c33)",
                    opacity: 0.85,
                    boxShadow: "inset -15px -15px 30px rgba(0,0,0,0.6), 0 0 20px rgba(56,152,38,0.2)",
                  }} />
                  {/* Grid lines overlay */}
                  {[0.25, 0.5, 0.75].map(f => (
                    <div key={f} style={{
                      position: "absolute", top: `${f*100}%`, left: "5%", right: "5%", height: 1,
                      background: "rgba(0,0,0,0.3)", transform: "translateY(-50%)",
                    }} />
                  ))}
                  {[0.25, 0.5, 0.75].map(f => (
                    <div key={f} style={{
                      position: "absolute", left: `${f*100}%`, top: "5%", bottom: "5%", width: 1,
                      background: "rgba(0,0,0,0.3)", transform: "translateX(-50%)",
                    }} />
                  ))}
                </div>
                {/* Figure toolbar overlay */}
                <div style={{
                  position: "absolute", top: 6, right: 6, display: "flex", gap: 3,
                }}>
                  {[["expand","Detach"],["camera","Export"],["settings","Style"]].map(([k, label]) => (
                    <button key={k} title={label} style={{
                      background: "rgba(0,0,0,0.5)", border: "1px solid #333",
                      borderRadius: 3, padding: "2px 3px", cursor: "pointer", color: "#666",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color="#aaa"}
                    onMouseLeave={e => e.currentTarget.style.color="#666"}
                    >
                      <Icon d={icons[k]} size={10} color="currentColor" />
                    </button>
                  ))}
                </div>
                <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 9, color: "#444", fontFamily: "IBM Plex Mono" }}>
                  GLMakie · interactive
                </span>
              </div>

              {/* Text block 2 */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12.5, color: "#8a9ab0", fontFamily: "IBM Plex Sans", lineHeight: 1.6 }}>
                  Find the surface area and volume, where{" "}
                  <span style={{ fontFamily: "IBM Plex Mono", color: "#cb3c33", fontSize: 12 }}>A = 4πr²</span>
                  {" "}and{" "}
                  <span style={{ fontFamily: "IBM Plex Mono", color: "#cb3c33", fontSize: 12 }}>V = (4/3)πr³</span>.
                </p>
              </div>

              {/* Code block 2 */}
              <div style={{ display: "flex" }}>
                <div style={{
                  width: 3, background: "rgba(56,152,38,0.3)", borderRadius: 2,
                  marginRight: 12, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  {[
                    ["A", " = ", "4", " * ", "pi", " * ", "r", "^2"],
                    ["V", " = ", "(4/3)", " * ", "pi", " * ", "r", "^3"],
                  ].map((tokens, li) => (
                    <div key={li} style={{ lineHeight: "20px", fontSize: 12.5, fontFamily: "IBM Plex Mono" }}>
                      {tokens.map((tok, ti) => {
                        const color = tok === " = " || tok === " * " ? "#6a7a8a" : tok === "pi" ? "#9558b2" : ["A","V","r"].includes(tok) ? "#a0b4d0" : "#cb3c33";
                        return <span key={ti} style={{ color }}>{tok}</span>;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar rail */}
        <div style={{
          width: 28, background: "#1c1c1c", borderLeft: "1px solid #222",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "8px 0", gap: 6,
        }}>
          {[["ai","AI Pane"], ["find","Search"], ["help","Help"], ["settings","Config"]].map(([k, label]) => (
            <button key={k} title={label} style={{
              background: "none", border: "none", cursor: "pointer", color: "#444",
              padding: "5px 6px", borderRadius: 3, width: "100%", display: "flex", justifyContent: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#888"}
            onMouseLeave={e => e.currentTarget.style.color = "#444"}
            >
              <Icon d={icons[k]} size={15} color="currentColor" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Status Bar ────────────────────────────────────────── */}
      <div style={{
        height: 22, background: "#111", display: "flex", alignItems: "center",
        padding: "0 10px", gap: 16, borderTop: "1px solid #1d1d1d",
      }}>
        {[
          ["#389826", "Julia 1.11.4"],
          ["#555", "UTF-8"],
          ["#555", "JuliaLang"],
          ["#555", "Ln 6, Col 24"],
        ].map(([color, text], i) => (
          <span key={i} style={{ fontSize: 10, color, fontFamily: "IBM Plex Mono", letterSpacing: "0.03em" }}>{text}</span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <span style={{ fontSize: 10, color: "#389826", fontFamily: "IBM Plex Mono" }}>● Revise.jl</span>
          <span style={{ fontSize: 10, color: "#555", fontFamily: "IBM Plex Mono" }}>Gemini AI ●</span>
          <span style={{ fontSize: 10, color: "#555", fontFamily: "IBM Plex Mono" }}>LanguageServer ●</span>
        </div>
      </div>
    </div>
  );
}

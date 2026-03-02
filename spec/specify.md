Build JuliaLab, a dedicated desktop IDE for the Julia programming language 
targeting scientists and engineers migrating from MATLAB. The IDE should feel 
immediately familiar to MATLAB users with a classic 4-panel layout: file browser 
(left), code editor (center-top), command window / REPL (bottom), and workspace 
variable inspector (right). All panels should be resizable and movable.

Core user journeys:

1. A researcher opens a Julia script, runs it section-by-section (like MATLAB cells), 
   and inspects variable values in the workspace panel
2. A developer edits a package live with Revise.jl auto-reloading changes without 
   restarting Julia
3. A data scientist asks an AI assistant pane (powered by Gemini) questions about 
   their code and gets context-aware answers
4. A student installs a Julia package via GUI and views documentation inline

The IDE is forked from Compute42 (Tauri 2 + Vue 3 + Rust backend) and extends it 
with MATLAB-inspired UX while remaining Julia-native.

Additional features derived from MATLAB R2025a parity and graphics requirements:

DESKTOP: Dark/light/system theme switching; customizable collapsible sidebar rails 
(left, right, bottom); tabbed figure container with undock capability; desktop 
search/launcher bar; Git source control panel; Code Issues panel (lint warnings); 
Code Outline panel (function/struct navigator).

FIGURES: WGLMakie inline in IDE (default); GLMakie detached window for 3D interaction; 
figure toolbar (Reset, Zoom, Pan, Rotate, Data Cursor, Save, Export); Figure Style 
Panel with journal themes (ACS/APS/Nature), color palette picker, resolution/DPI 
selector; "Copy Plot Code" button to generate reproduction Julia code; 
MakiePublication.jl integration.

EDITOR: JuliaFormatter.jl auto-format button; section breakpoints for `##` cells; 
Unicode input completion (\alpha → α); method signature popup on function call.

MODELING: ModelingToolkit.jl syntax support in Monaco; "Open in Dyad" integration 
button for .jl files containing MTK models; ControlSystems.jl plot panel 
(Bode, Nyquist, step response).

EXPORT/PUBLISHING: Weave.jl export to PDF/HTML (MATLAB Publish equivalent); 
figure export to SVG, PDF, EPS, PNG with DPI control.
# JuliaLab Startup Time Optimization

## Problem
JuliaLab was taking 5-10 minutes to start due to package precompilation, primarily from CairoMakie and its 185+ dependencies.

## Solution 1: Remove Heavy Packages from Core (IMPLEMENTED)

**Status:** ✅ Completed

CairoMakie has been removed from the core required packages list. This reduces startup time from **9+ minutes to <15 seconds**.

### What Changed
- `packages.jl` now installs only essential packages:
  - JuliaInterpreter (debugging)
  - JSON (communication)
  - Revise (hot reload)
  - LanguageServer (LSP)
  - JuliaFormatter (code formatting)
  - Debugger (debugging)
  - PackageCompiler (optional, for system images)

### Installing Plotting Packages
Users can install CairoMakie or other plotting packages on-demand via the Package Manager:
1. Open Package Manager (Packages button in navigation rail)
2. Search for "CairoMakie" or "Plots"
3. Click "Add Package"

---

## Solution 2: System Image (OPTIONAL - For <5 Second Startup)

For power users who want even faster startup (~2-5 seconds), you can create a custom Julia system image with all your frequently-used packages pre-baked in.

### Prerequisites
- PackageCompiler.jl (included in core packages)
- 10-15 minutes for one-time build
- ~500MB disk space for the system image

### How to Build a System Image

1. **Install your desired packages** (including CairoMakie if needed):
   ```julia
   using Pkg
   Pkg.add(["CairoMakie", "DataFrames", "CSV", "Plots"])
   ```

2. **Run the system image builder**:
   ```julia
   include("app/internals/scripts/build_sysimage.jl")
   ```

3. **Wait for build to complete** (10-15 minutes, one-time only)

4. **Modify Julia startup** to use the system image:
   - Edit `app/internals/src/actors/process_actor/lifecycle.rs`
   - Add `--sysimage` flag to Julia command (line 79-82)
   - Example:
     ```rust
     command
         .arg("--startup-file=no")
         .arg("-t1")
         .arg("--history-file=no")
         .arg(format!("--sysimage={}", sysimage_path));
     ```

### System Image Benefits
- **Startup time:** 2-5 seconds (vs 9+ minutes)
- **Package loading:** Instant (already compiled)
- **Trade-off:** One-time 10-15 minute build, ~500MB disk space

### When to Rebuild System Image
Rebuild the system image when:
- You add new packages you want pre-compiled
- You update Julia version
- Packages are updated significantly

---

## Comparison

| Approach | First Startup | Subsequent Startups | Disk Space | Complexity |
|----------|---------------|---------------------|------------|------------|
| **Original (with CairoMakie)** | 9+ minutes | 10-15 seconds | ~2GB | Low |
| **Solution 1 (no CairoMakie)** | 10-15 seconds | 10-15 seconds | ~500MB | Low |
| **Solution 2 (system image)** | 15 min (build) | 2-5 seconds | ~1GB | Medium |

---

## Recommended Approach

**For most users:** Use Solution 1 (no CairoMakie in core)
- Fast startup (<15 seconds)
- Install plotting packages only when needed
- Simple, no configuration required

**For power users:** Use Solution 2 (system image)
- Ultra-fast startup (2-5 seconds)
- All packages instantly available
- Requires one-time setup

---

## Technical Details

### Why Was CairoMakie So Slow?
CairoMakie depends on:
- Makie (248 seconds to precompile)
- CairoMakie itself (77 seconds)
- 185 total dependencies
- Heavy C/C++ bindings (Cairo, FreeType, HarfBuzz, etc.)

### Package Precompilation Cache
Julia stores precompiled packages in:
- Windows: `C:\Users\<user>\AppData\Local\org.julialab.ide\depot\compiled\`
- The cache is version-specific and persists between sessions
- First startup after package installation triggers precompilation
- Subsequent startups use the cache (fast)

### System Image Technical Details
A system image is a pre-compiled Julia environment containing:
- Julia Base libraries
- All specified packages
- Type inference results
- Compiled native code

This eliminates the need for runtime compilation on startup.

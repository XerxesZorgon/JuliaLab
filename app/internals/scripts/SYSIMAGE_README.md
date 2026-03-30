# JuliaLab Custom Sysimage

## Overview

A custom Julia system image (sysimage) is a precompiled binary that includes all core packages used by JuliaLab. This dramatically reduces startup time by eliminating the need to load and compile these packages on every launch.

## Benefits

- **Faster Startup**: Reduces Julia initialization time by ~3-5 seconds
- **Reduced Memory**: Shared code between packages is optimized
- **Better Performance**: Precompiled code runs faster than interpreted code

## Building the Sysimage

### Prerequisites

1. Julia 1.12.1 or later installed
2. All JuliaLab core packages installed (run JuliaLab once to install them)
3. At least 2GB of free disk space
4. 10-15 minutes of build time

### Build Steps

1. Open a terminal/command prompt
2. Navigate to the scripts directory:
   ```bash
   cd app/internals/scripts
   ```

3. Run the build script:
   ```bash
   julia build_sysimage.jl
   ```

4. Wait for the build to complete (10-15 minutes)

### Build Output

The sysimage will be created at:
- **Windows**: `%LOCALAPPDATA%\org.julialab.ide\julialab.dll`
- **macOS**: `~/Library/Application Support/org.julialab.ide/julialab.dylib`
- **Linux**: `~/.local/share/org.julialab.ide/julialab.so`

Expected file size: 200-300 MB

## Usage

JuliaLab automatically detects and loads the sysimage if it exists. No manual configuration is needed.

To verify the sysimage is being used:
1. Start JuliaLab
2. Check the startup logs for: `Loading sysimage from...`

## Included Packages

The sysimage includes these core packages:
- **JuliaInterpreter**: Code execution and debugging
- **JSON**: Data serialization
- **Revise**: Hot code reloading
- **LanguageServer**: LSP support for editor features
- **JuliaFormatter**: Code formatting
- **Debugger**: Interactive debugging

## Rebuilding

You should rebuild the sysimage when:
- JuliaLab core packages are updated
- Julia version is upgraded
- Performance degrades over time

To rebuild, simply run the build script again. The old sysimage will be overwritten.

## Troubleshooting

### Build Fails

If the build fails:
1. Ensure all packages are installed: `julia -e 'using Pkg; Pkg.instantiate()'`
2. Check you have enough disk space (2GB minimum)
3. Try building with a clean Julia depot: `julia --startup-file=no build_sysimage.jl`

### Sysimage Not Loading

If JuliaLab doesn't use the sysimage:
1. Check the file exists at the expected location
2. Verify file permissions (should be readable)
3. Check logs for error messages about sysimage loading

### Performance Issues

If startup is still slow with the sysimage:
1. Rebuild the sysimage (it may be outdated)
2. Check if additional packages are being loaded that aren't in the sysimage
3. Monitor system resources (CPU, memory, disk)

## Advanced Options

### Custom Package List

To include additional packages in the sysimage:
1. Edit `build_sysimage.jl`
2. Add package names to the `packages` array
3. Rebuild

Note: Adding too many packages will increase build time and file size.

### CPU-Specific Optimization

For better performance on your specific CPU:
1. Edit `build_sysimage.jl`
2. Change `cpu_target="generic"` to `cpu_target="native"`
3. Rebuild

Warning: Native builds won't work on different CPUs.

## Technical Details

- **Build Tool**: PackageCompiler.jl
- **Precompilation**: Includes workload script for common operations
- **Target**: Generic CPU for maximum compatibility
- **Project**: Uses default Julia environment (@.)

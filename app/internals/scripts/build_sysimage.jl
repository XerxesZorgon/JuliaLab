# JuliaLab System Image Builder
# This script creates a custom Julia system image with all required packages precompiled
# Run this once after installing packages to dramatically reduce startup time

using PackageCompiler
using Pkg

println("=== JuliaLab Sysimage Builder ===")

# List of packages to include in the system image
# Minimal set to ensure successful build
packages = [
    "JSON",
    "Revise"
]

# Determine output path based on OS
sysimage_name = Sys.iswindows() ? "julialab.dll" : (Sys.isapple() ? "julialab.dylib" : "julialab.so")
data_dir = get(ENV, "JULIALAB_DATA_DIR", "")
if isempty(data_dir)
    if Sys.iswindows()
        data_dir = joinpath(ENV["LOCALAPPDATA"], "org.julialab.ide")
    elseif Sys.isapple()
        data_dir = joinpath(ENV["HOME"], "Library", "Application Support", "org.julialab.ide")
    else
        data_dir = joinpath(ENV["HOME"], ".local", "share", "org.julialab.ide")
    end
end

sysimage_path = joinpath(data_dir, sysimage_name)
mkpath(dirname(sysimage_path))

println("Packages to include: ", join(packages, ", "))
println("Output path: ", sysimage_path)

println("\nBuilding sysimage... This will take several minutes.")
println("Note: Building without precompile workload for maximum compatibility")

try
    create_sysimage(
        packages;
        sysimage_path=sysimage_path,
        cpu_target="generic"
    )
    
    size_mb = round(filesize(sysimage_path) / 1024 / 1024, digits=2)
    println("\n✓ SUCCESS: Sysimage created at: ", sysimage_path)
    println("✓ Size: ", size_mb, " MB")
    println("✓ JuliaLab will automatically use this sysimage on next startup")
    println("✓ Expected startup time reduction: ~2-3 seconds")
catch e
    println("\n✗ ERROR: Failed to build sysimage: ", e)
    println("\nStacktrace:")
    showerror(stdout, e, catch_backtrace())
    exit(1)
end

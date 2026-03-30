#!/usr/bin/env julia
# Install required packages and build sysimage

using Pkg

println("=== JuliaLab Sysimage Builder - Setup & Build ===\n")

# Step 1: Install required packages
println("Step 1: Installing required packages...")
required_packages = [
    "PackageCompiler",
    "JuliaInterpreter",
    "JSON",
    "Revise",
    "LanguageServer",
    "JuliaFormatter",
    "Debugger"
]

println("Checking and installing packages: ", join(required_packages, ", "))
Pkg.add(required_packages)
println("✓ All packages installed\n")

# Step 2: Instantiate to ensure all dependencies are ready
println("Step 2: Running Pkg.instantiate()...")
Pkg.instantiate()
println("✓ Dependencies ready\n")

# Step 3: Run the build script
println("Step 3: Building sysimage...")
println("This will take 10-15 minutes. Please be patient.\n")

include(joinpath(@__DIR__, "build_sysimage.jl"))

# JuliaLab Sysimage Generator
# Creates a custom system image to accelerate startup time
# Includes: Revise, LanguageServer, JSON, StaticArrays

using Pkg
using PackageCompiler

println("--- JuliaLab Sysimage Generator ---")

# 1. Define paths
output_path = if !isempty(ARGS)
    ARGS[1]
else
    app_data = get(ENV, "JULIALAB_DATA_DIR", "")
    if isempty(app_data)
        # Fallback for local development
        if Sys.iswindows()
            app_data = joinpath(ENV["LOCALAPPDATA"])
        else
            app_data = joinpath(ENV["HOME"], ".local", "share")
        end
    end
    sysimage_name = Sys.iswindows() ? "julialab.dll" : (Sys.isapple() ? "julialab.dylib" : "julialab.so")
    joinpath(app_data, "org.julialab.ide", sysimage_name)
end

output_dir = dirname(output_path)
if !isdir(output_dir)
    mkpath(output_dir)
end

println("Target Output: $output_path")

# 2. Identify packages to include
packages = ["Revise", "LanguageServer", "JSON", "StaticArrays"]
println("Packages to include: ", join(packages, ", "))

# 3. Create precompile script (optional but recommended)
precompile_path = joinpath(@__DIR__, "precompile_workload.jl")
open(precompile_path, "w") do f
    write(
        f,
        """
using Revise
using LanguageServer
using JSON
using StaticArrays

# Simple workload to trigger precompilation
x = SVector(1.0, 2.0, 3.0)
y = x .* 2.0

json_str = JSON.json(Dict("a" => 1, "b" => [1,2,3]))
data = JSON.parse(json_str)

println("Precompile workload completed.")
"""
    )
end

# 4. Generate sysimage
println("Generating sysimage... this will take several minutes.")
println("Note: JuliaLab will automatically load this sysimage from its data directory on next startup.")

try
    create_sysimage(
        packages;
        sysimage_path=output_path,
        precompile_execution_file=precompile_path,
        cpu_target="generic"
    )
    println("\nSUCCESS: Sysimage generated at $output_path")
    println("Julia startup time with this sysimage should be under 2 seconds.")
catch e
    println("\nERROR: Failed to generate sysimage: ", e)
    exit(1)
finally
    # Clean up precompile script
    if isfile(precompile_path)
        rm(precompile_path)
    end
end

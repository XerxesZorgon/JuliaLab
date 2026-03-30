# JuliaLab Main Entry Point
# This file replaces setup.jl and includes all modules in dependency order

# Configure graphics backends to prevent popup windows
# Set GR backend to non-interactive mode to prevent GKS QtTerm window
# "nul" = null device (no output), "100" = file-based backend
try
    ENV["GKSwstype"] = "nul"
catch e
    println(stderr, "JuliaLab: Failed to set GKSwstype: ", sprint(showerror, e))
end

# 1. Load packages and required modules (Main namespace)
include(joinpath(@__DIR__, "core", "packages.jl"))

# 2. Setup display system (Main namespace)
include(joinpath(@__DIR__, "core", "display.jl"))

# 3. Load JuliaLab core functionality (all functions in Main namespace)
include(joinpath(@__DIR__, "core", "core.jl"))

# Initialize both communication channels

# Initialize permanent communication (for sending data TO Julia)
jj_success1 = initialize_permanent_communication("{to_julia_pipe_name}")
if !jj_success1
    println(stderr, "JuliaLab: Failed to initialize permanent communication")
end

# Initialize plot communication (for receiving data FROM Julia)
jj_success2 = initialize_plot_communication("{from_julia_pipe_name}")
if !jj_success2
    println(stderr, "JuliaLab: Failed to initialize plot communication")
end

# Setup display system immediately after communication is established
setup_display_system()
if isdefined(Main, :setup_plotting)
    setup_plotting()
end

println(stderr, "JuliaLab: ALL_PIPES_READY")





















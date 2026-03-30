# JuliaLab Plotting Module
# Handles configuration for various plotting backends, specifically WGLMakie

using Sockets

# Global configuration for WGLMakie
if !@isdefined(JJ_WGLMAKIE_PORT)
    global JJ_WGLMAKIE_PORT = 8081
end

function setup_plotting()
    try
        # We don't want to load WGLMakie by default to save startup time.
        # Instead, we provide a helper to configure it when the user decides to use it.
        # However, the user asked to configure it now.

        println(stderr, "JuliaLab: Plotting system initializing...")

        # Check if WGLMakie is available
        if isdefined(Main, :WGLMakie)
            configure_wglmakie()
        else
            println(stderr, "JuliaLab: WGLMakie not yet loaded. Use `using WGLMakie` to enable interactive plots.")
        end

        # Add a custom display for WGLMakie if it's eventually loaded
        # This is a bit tricky since we don't want to depend on WGLMakie at compile time.
    catch e
        println(stderr, "JuliaLab: Failed to setup plotting: ", e)
    end
end

# This function should be called after 'using WGLMakie'
function enable_wglmakie()
    configure_wglmakie()

    # Send a message to the backend to say we're ready for interactive plots
    Main.send_message_to_backend(Dict(
        "PlotUpdate" => Dict(
            "type" => "InteractiveModeEnabled",
            "port" => JJ_WGLMAKIE_PORT
        )
    ))
end

function configure_wglmakie()
    try
        import WGLMakie
        # Configure WGLMakie to use the reserved port
        # WGLMakie.activate!(port=JJ_WGLMAKIE_PORT, listen_url="127.0.0.1")
        # Note: the exact API might vary based on version, but typically:
        WGLMakie.activate!(port=JJ_WGLMAKIE_PORT)
        println(stderr, "JuliaLab: WGLMakie configured on port ", JJ_WGLMAKIE_PORT)
    catch e
        println(stderr, "JuliaLab: Failed to configure WGLMakie: ", e)
    end
end

# Export a command that can be called from Rust to trigger a plot update 
# or specific interactive setup if needed.
function trigger_interactive_plot(plot_id)
    # This could be used to send a specific signal to the frontend
    # to switch to the Plots tab and iframe the interactive port.
    payload = Dict(
        "type" => "InteractivePlotStarted",
        "plot_id" => plot_id,
        "url" => "http://127.0.0.1:$(JJ_WGLMAKIE_PORT)"
    )
    Main.send_message_to_backend(Dict("PlotUpdate" => payload))
end

# --- Figure Toolbar Backend Functions ---

module JuliaLab
import Main: Makie, MakiePublication

"""
    reset_current_view()
Resets the limits of the current axis in the active figure.
"""
function reset_current_view()
    try
        fig = Makie.current_figure()
        if fig !== nothing
            ax = Makie.current_axis(fig)
            if ax !== nothing
                Makie.reset_limits!(ax)
                return true
            end
        end
    catch e
        println(stderr, "JuliaLab: Reset view failed: ", e)
    end
    return false
end

"""
    toggle_current_grid()
Toggles grid visibility for the current axis.
"""
function toggle_current_grid()
    try
        fig = Makie.current_figure()
        if fig !== nothing
            ax = Makie.current_axis(fig)
            if ax !== nothing
                # Toggle both x and y grid
                current_state = ax.xgridvisible[]
                ax.xgridvisible = !current_state
                ax.ygridvisible = !current_state
                return !current_state
            end
        end
    catch e
        println(stderr, "JuliaLab: Toggle grid failed: ", e)
    end
    return false
end

"""
    export_current_plot(filepath; format="pdf")
Exports the current plot using MakiePublication for high-quality results.
"""
function export_current_plot(filepath; format="pdf")
    try
        # 1. Check if we need CairoMakie for PDF/EPS/Vector formats
        vector_formats = ["pdf", "eps", "svg", "ps"]
        ext = lowercase(splitext(filepath)[2][2:end])

        if (format == "pdf" || ext in vector_formats) && !isdefined(Main, :CairoMakie)
            println(stderr, "JuliaLab: PDF export requires CairoMakie. Attempting to load...")
            try
                Main.eval(:(import CairoMakie))
            catch
                println(stderr, "JuliaLab: ERROR - CairoMakie is not installed. Please run `Pkg.add(\"CairoMakie\")` to enable PDF export.")
                return false
            end
        end

        # 2. Ensure MakiePublication is loaded
        if !isdefined(Main, :MakiePublication)
            println(stderr, "JuliaLab: Loading MakiePublication...")
            try
                Main.eval(:(import MakiePublication))
            catch
                # Fallback to standard Makie if MakiePublication is missing
                println(stderr, "JuliaLab: MakiePublication not found, using standard Makie.save")
            end
        end

        fig = Makie.current_figure()
        if fig === nothing
            println(stderr, "JuliaLab: No active figure to export.")
            return false
        end

        # 3. Export using CairoMakie if needed for PDF
        if (format == "pdf" || ext == "pdf") && isdefined(Main, :CairoMakie)
            # Force CairoMakie for this save call if it's a PDF
            # This is important if WGLMakie is the current active backend
            Main.CairoMakie.activate!()
            Makie.save(filepath, fig)
            # Re-activate WGLMakie if it was active
            if isdefined(Main, :WGLMakie)
                Main.WGLMakie.activate!(port=Main.JJ_WGLMAKIE_PORT)
            end
        else
            Makie.save(filepath, fig)
        end

        println(stderr, "JuliaLab: Plot exported successfully to ", filepath)
        return true
    catch e
        println(stderr, "JuliaLab: Export to $format failed: ", e)
        # Detailed error for the console
        Base.showerror(stderr, e)
    end
    return false
end
end

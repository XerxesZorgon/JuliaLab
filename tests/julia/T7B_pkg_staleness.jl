# T7B — Pkg.instantiate() staleness check unit test
# Run standalone — does NOT call Pkg.instantiate(), only tests the guard logic.
# Usage:
#   julia tests/julia/T7B_pkg_staleness.jl

using Test
import Dates

println("=== T7B Pkg Staleness Tests ===")

# Simulate the staleness check in a temp directory
tmpdir = mktempdir()

stamp_file = joinpath(tmpdir, ".pkg_stamp")
manifest   = joinpath(tmpdir, "Manifest.toml")

# --- TC-7B.1: no stamp file → needs update ---
println("TC-7B.1: no stamp file → needs_update = true")
@test !isfile(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == true
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.2: stamp exists, no manifest → no update needed ---
println("TC-7B.2: stamp exists, no manifest → needs_update = false")
touch(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == false
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.3: manifest newer than stamp → needs update ---
println("TC-7B.3: manifest newer than stamp → needs_update = true")
sleep(0.1)  # ensure mtime difference
write(manifest, "[deps]\n")  # create manifest after stamp
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == true
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.4: touch stamp after update → no update needed ---
println("TC-7B.4: stamp refreshed after update → needs_update = false")
sleep(0.1)
touch(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == false
println("  → needs_update: $(needs_update) ✓")

# Cleanup
rm(tmpdir, recursive=true)
println("=== T7B: ALL PASS ===")

# Precompile workload for JuliaLab sysimage (minimal)
using JSON
using Revise

# Trigger common JSON operations
json_data = JSON.json(Dict("test" => [1, 2, 3], "nested" => Dict("a" => 1)))
parsed = JSON.parse(json_data)

println("Precompile workload completed")

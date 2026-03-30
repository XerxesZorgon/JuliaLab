export interface JuliaLabTip {
    id: number;
    category: 'syntax' | 'performance' | 'workflow' | 'packages' | 'idioms';
    text: string;
    code?: string; // Optional inline snippet to illustrate the tip
}

export const tips: JuliaLabTip[] = [
    // ── Syntax ──────────────────────────────────────────────────────────────────
    {
        id: 1,
        category: 'syntax',
        text: 'In Julia, indices start at 1 — just like MATLAB! Use `end` to reference the last element: `v[end]`.',
        code: 'v = [10, 20, 30]\nv[end]  # → 30',
    },
    {
        id: 2,
        category: 'syntax',
        text: 'Use a dot `.` for element-wise operations, just as in MATLAB: `A .* B`, `sin.(x)`, `f.(v)`.',
        code: 'A = [1 2; 3 4]; B = [2 2; 2 2]\nA .* B  # → [2 4; 6 8]',
    },
    {
        id: 3,
        category: 'syntax',
        text: 'Julia uses `for i in 1:n` instead of MATLAB\'s `for i = 1:n`. Both work, but `in` is idiomatic.',
        code: 'for i in 1:5\n  println(i)\nend',
    },
    {
        id: 4,
        category: 'syntax',
        text: 'String interpolation in Julia uses `$`: `"Hello, $name!"` — no concatenation needed.',
        code: 'name = "Julia"\nprintln("Hello, $name!")  # Hello, Julia!',
    },
    {
        id: 5,
        category: 'syntax',
        text: 'Single quotes `\'a\'` denote a `Char`, not a string. Use `"a"` for a one-character string.',
        code: "typeof('a')  # Char\ntypeof(\"a\") # String",
    },
    {
        id: 6,
        category: 'syntax',
        text: 'Multiple return values are idiomatic in Julia — just return a tuple!',
        code: 'function minmax(v)\n  return minimum(v), maximum(v)\nend\nlo, hi = minmax([3,1,4,1,5])',
    },
    {
        id: 7,
        category: 'syntax',
        text: 'Julia\'s `A\'` is the conjugate transpose (like MATLAB). Use `transpose(A)` for the non-conjugate version.',
        code: "A = [1+1im 2; 3 4]\nA'         # conjugate transpose\ntranspose(A)  # plain transpose",
    },
    {
        id: 8,
        category: 'syntax',
        text: 'The `?` ternary operator lets you write compact conditionals: `x > 0 ? "pos" : "neg"`.',
        code: 'sign_str(x) = x > 0 ? "positive" : x < 0 ? "negative" : "zero"',
    },
    {
        id: 9,
        category: 'syntax',
        text: 'Use `÷` (\\div<Tab>) for integer division and `%` for modulo — two cleaner alternatives to `floor(a/b)` and `mod(a,b)`.',
        code: '17 ÷ 5   # → 3\n17 % 5   # → 2',
    },
    {
        id: 10,
        category: 'syntax',
        text: 'Short-circuit `&&` and `||` work in Julia just like in MATLAB. They are the idiomatic choice for conditionals.',
        code: 'x = 5\nx > 0 && println("positive")  # prints only if x > 0',
    },
    {
        id: 11,
        category: 'syntax',
        text: '`nothing` in Julia is the equivalent of MATLAB\'s empty `[]` or `None` in Python — use it for optional values.',
        code: 'result = nothing\nif result === nothing\n  println("no result yet")\nend',
    },
    {
        id: 12,
        category: 'syntax',
        text: 'Annotate function arguments with types for clarity: `function f(x::Float64)`. Julia will dispatch on them.',
        code: 'function greet(name::String)\n  println("Hello, ", name)\nend',
    },

    // ── Performance ──────────────────────────────────────────────────────────────
    {
        id: 13,
        category: 'performance',
        text: 'Pre-allocate arrays instead of growing them in a loop. Use `zeros(n)` or `Vector{Float64}(undef, n)` up front.',
        code: 'n = 1_000\nresults = Vector{Float64}(undef, n)\nfor i in 1:n\n  results[i] = sin(i)\nend',
    },
    {
        id: 14,
        category: 'performance',
        text: 'Use `@time` or `@benchmark` (BenchmarkTools.jl) to measure execution time. The first call includes JIT compile time — run twice!',
        code: 'using BenchmarkTools\n@benchmark sum(rand(1000))',
    },
    {
        id: 15,
        category: 'performance',
        text: 'Julia is fast when types are concrete. Avoid "type instability" — use `@code_warntype` to spot it.',
        code: 'function bad(x)  # x is Any — slow\n  return x + 1\nend\n@code_warntype bad(1.0)',
    },
    {
        id: 16,
        category: 'performance',
        text: '`StaticArrays.jl` provides fixed-size arrays (`SVector`, `SMatrix`) with zero-allocation stack performance — great for small linear algebra.',
        code: 'using StaticArrays\nv = SVector(1.0, 2.0, 3.0)\nnorm(v)  # heap-free!',
    },
    {
        id: 17,
        category: 'performance',
        text: 'Add `@inbounds` before a loop to skip bounds checking — only safe if you are certain indices are valid!',
        code: 'function fast_sum(v)\n  s = zero(eltype(v))\n  @inbounds for x in v\n    s += x\n  end\n  s\nend',
    },

    // ── Workflow ──────────────────────────────────────────────────────────────────
    {
        id: 18,
        category: 'workflow',
        text: '`Revise.jl` automatically reloads changed source files — no need to restart Julia when you edit a function!',
        code: '# Add to your startup.jl:\nusing Revise',
    },
    {
        id: 19,
        category: 'workflow',
        text: 'Type `?` before any function in the REPL to see inline documentation: `?sin`, `?push!`.',
        code: '?cos   # shows documentation for cos()',
    },
    {
        id: 20,
        category: 'workflow',
        text: 'Use `Ctrl+Enter` in JuliaLab to run the current `##`-delimited code cell — just like MATLAB sections.',
        code: '## Section 1\nx = rand(100)\n\n## Section 2  ← Ctrl+Enter runs from here',
    },
    {
        id: 21,
        category: 'workflow',
        text: 'Unicode math symbols are first-class in Julia. Type `\\alpha<Tab>` to get `α` right in your code.',
        code: 'α = 0.05\np_value = 0.03\np_value < α && println("Reject H₀")',
    },
    {
        id: 22,
        category: 'workflow',
        text: '`@show x` prints both the name and value of a variable — handy for quick debugging.',
        code: 'x = 42\n@show x  # prints: x = 42',
    },
    {
        id: 23,
        category: 'workflow',
        text: 'The `Pkg` REPL mode (press `]`) lets you add, remove, and update packages interactively.',
        code: ']add DataFrames   # equivalent to Pkg.add("DataFrames")\n]status           # show installed packages',
    },

    // ── Packages ─────────────────────────────────────────────────────────────────
    {
        id: 24,
        category: 'packages',
        text: '`DataFrames.jl` is Julia\'s equivalent of MATLAB Tables or pandas. Load it with `using DataFrames`.',
        code: 'using DataFrames\ndf = DataFrame(x=1:5, y=rand(5))\ndf[df.x .> 2, :]  # filter rows',
    },
    {
        id: 25,
        category: 'packages',
        text: '`CSV.jl` reads and writes CSV files blazingly fast. Pair it with DataFrames for complete tabular data support.',
        code: 'using CSV, DataFrames\ndf = CSV.read("data.csv", DataFrame)',
    },
    {
        id: 26,
        category: 'packages',
        text: '`Makie.jl` is Julia\'s premier plotting ecosystem. JuliaLab uses `WGLMakie` for interactive plots and `CairoMakie` for publication-quality PDF export.',
        code: 'using CairoMakie\nfig, ax, plt = lines(1:100, cumsum(randn(100)))\nsave("plot.pdf", fig)',
    },
    {
        id: 27,
        category: 'packages',
        text: '`LinearAlgebra` is in the stdlib — no install needed! It provides `det`, `inv`, `eigen`, `svd`, and more.',
        code: 'using LinearAlgebra\nA = [4.0 3; 6 3]\nvals, vecs = eigen(A)',
    },
    {
        id: 28,
        category: 'packages',
        text: '`JuliaFormatter.jl` auto-formats your code to a consistent style. JuliaLab\'s built-in Format button uses it behind the scenes!',
        code: '# Keyboard shortcut: Home → Format Code\n# Or: JuliaFormatter.format_file("myfile.jl")',
    },

    // ── Idioms ───────────────────────────────────────────────────────────────────
    {
        id: 29,
        category: 'idioms',
        text: 'Functions that mutate their arguments end with `!` by convention: `push!`, `sort!`, `fill!`. This helps readers know side-effects are occurring.',
        code: 'v = [3, 1, 2]\nsort!(v)   # sorts v in-place\nv          # → [1, 2, 3]',
    },
    {
        id: 30,
        category: 'idioms',
        text: 'Use list comprehensions for clean, fast array construction: `[x^2 for x in 1:10 if isodd(x)]`.',
        code: 'squares_of_odds = [x^2 for x in 1:10 if isodd(x)]\n# → [1, 9, 25, 49, 81]',
    },
    {
        id: 31,
        category: 'idioms',
        text: '`eachrow(df)` and `eachcol(df)` let you iterate over DataFrames rows/columns without indexing.',
        code: 'using DataFrames\ndf = DataFrame(a=1:3, b=4:6)\nfor row in eachrow(df)\n  println(row.a + row.b)\nend',
    },
    {
        id: 32,
        category: 'idioms',
        text: '`map`, `filter`, and `reduce` are functional workhorses. They compose cleanly with anonymous functions.',
        code: 'map(x -> x^2, 1:5)       # [1, 4, 9, 16, 25]\nfilter(isodd, 1:10)       # [1, 3, 5, 7, 9]\nreduce(+, 1:100)          # 5050',
    },
    {
        id: 33,
        category: 'idioms',
        text: 'The pipe operator `|>` chains function calls left-to-right for readable data pipelines.',
        code: '1:100 |> collect |> x -> filter(isodd, x) |> sum\n# → 2500',
    },
    {
        id: 34,
        category: 'idioms',
        text: '`enumerate` gives you index–value pairs when iterating — no need for a separate counter variable.',
        code: 'for (i, val) in enumerate(["a", "b", "c"])\n  println(i, ": ", val)\nend',
    },
    {
        id: 35,
        category: 'idioms',
        text: '`zip` combines multiple iterables element-wise — great for iterating over corresponding data arrays in parallel.',
        code: 'names = ["Alice", "Bob"]\nscores = [92, 87]\nfor (n, s) in zip(names, scores)\n  println(n, ": ", s)\nend',
    },
];

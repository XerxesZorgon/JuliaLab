// MATLAB → Julia Cheat Sheet Data
// Each entry has: category, description, matlab code, julia code

export interface CheatSheetEntry {
    category: string;
    description: string;
    matlab: string;
    julia: string;
}

export const categories = [
    'Basics',
    'Arrays & Matrices',
    'Indexing',
    'Linear Algebra',
    'Control Flow',
    'Functions',
    'Strings',
    'File I/O',
    'Plotting',
    'Statistics',
    'Type System',
] as const;

export type Category = (typeof categories)[number];

export const cheatSheetData: CheatSheetEntry[] = [
    // ── Basics ──────────────────────────────────────────────────────────────────
    {
        category: 'Basics',
        description: 'Print to console',
        matlab: "disp('Hello')\nfprintf('Value: %d\\n', x)",
        julia: "println(\"Hello\")\nprintln(\"Value: \", x)",
    },
    {
        category: 'Basics',
        description: 'Variable assignment',
        matlab: 'x = 5;\ny = 3.14;',
        julia: 'x = 5\ny = 3.14',
    },
    {
        category: 'Basics',
        description: 'Suppress output',
        matlab: 'x = 5;',
        julia: 'x = 5;  # semicolon still suppresses in REPL',
    },
    {
        category: 'Basics',
        description: 'Clear all variables',
        matlab: 'clear all',
        julia: '# Use a fresh REPL session; or module-level scoping',
    },
    {
        category: 'Basics',
        description: 'Get help for a function',
        matlab: 'help size\ndoc size',
        julia: '?size\n@doc size',
    },
    {
        category: 'Basics',
        description: 'Check type of variable',
        matlab: 'class(x)',
        julia: 'typeof(x)',
    },
    {
        category: 'Basics',
        description: 'Logical true / false',
        matlab: 'true, false',
        julia: 'true, false',
    },
    {
        category: 'Basics',
        description: 'Modulo / remainder',
        matlab: 'mod(10, 3)',
        julia: '10 % 3\nmod(10, 3)',
    },
    {
        category: 'Basics',
        description: 'Integer division',
        matlab: 'floor(10/3)',
        julia: '10 ÷ 3\ndiv(10, 3)',
    },
    {
        category: 'Basics',
        description: 'Power',
        matlab: '2^10',
        julia: '2^10',
    },
    {
        category: 'Basics',
        description: 'Complex imaginary unit',
        matlab: '1i, 1j',
        julia: '1im',
    },

    // ── Arrays & Matrices ────────────────────────────────────────────────────────
    {
        category: 'Arrays & Matrices',
        description: 'Create a row vector',
        matlab: 'v = [1, 2, 3]',
        julia: 'v = [1, 2, 3]  # column vector!\n# Row: v = [1 2 3]  or  hcat(1, 2, 3)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Create a column vector',
        matlab: 'v = [1; 2; 3]',
        julia: 'v = [1; 2; 3]\n# or: v = [1, 2, 3]',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Create a matrix',
        matlab: 'A = [1 2; 3 4]',
        julia: 'A = [1 2; 3 4]',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Zeros / ones / identity matrix',
        matlab: 'zeros(3,4)\nones(3,4)\neye(3)',
        julia: 'zeros(3,4)\nones(3,4)\nI  # UniformScaling identity\nusing LinearAlgebra; Matrix(I, 3, 3)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Range / linspace',
        matlab: '1:5        % 1,2,3,4,5\n1:2:9      % 1,3,5,7,9\nlinspace(0,1,5)',
        julia: '1:5\n1:2:9\nrange(0, 1, length=5)  # or LinRange(0,1,5)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Get array size',
        matlab: 'size(A)      % [rows, cols]\nsize(A, 1)   % rows\nnumel(A)     % total elements',
        julia: 'size(A)         # (rows, cols)\nsize(A, 1)      # rows\nlength(A)       # total elements\nndims(A)        # number of dimensions',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Concatenation',
        matlab: '[A, B]   % horizontal\n[A; B]   % vertical',
        julia: '[A B]    # horizontal (hcat)\n[A; B]   # vertical  (vcat)\nhcat(A, B)\nvcat(A, B)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Flatten to vector',
        matlab: "A(:)  % column vector\nA(:)' % row vector",
        julia: 'vec(A)   # column vector\nA[:]     # same',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Reshape',
        matlab: 'reshape(A, 2, 3)',
        julia: 'reshape(A, 2, 3)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Transpose / hermitian',
        matlab: "A'    % conjugate transpose\nA.'   % plain transpose",
        julia: "A'   # adjoint (conjugate transpose)\ntranspose(A)  # plain transpose",
    },
    {
        category: 'Arrays & Matrices',
        description: 'Element-wise operations',
        matlab: 'A .* B\nA ./ B\nA .^ 2',
        julia: 'A .* B\nA ./ B\nA .^ 2',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Sort',
        matlab: 'sort(v)\nsort(A, 1)  % sort columns\n[sorted, idx] = sort(v)',
        julia: 'sort(v)\nsort(A, dims=1)\nsortperm(v)  # indices\nsorted = sort(v); idx = sortperm(v)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Find nonzero indices',
        matlab: 'find(v > 3)',
        julia: 'findall(v .> 3)\nfindall(>(3), v)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Unique elements',
        matlab: 'unique(v)',
        julia: 'unique(v)',
    },
    {
        category: 'Arrays & Matrices',
        description: 'Push / append to vector',
        matlab: 'v(end+1) = 5',
        julia: 'push!(v, 5)',
    },

    // ── Indexing ─────────────────────────────────────────────────────────────────
    {
        category: 'Indexing',
        description: 'Index is 1-based',
        matlab: 'A(1, 1)   % first element',
        julia: 'A[1, 1]   # first element',
    },
    {
        category: 'Indexing',
        description: 'Last element',
        matlab: 'v(end)\nA(end, end)',
        julia: 'v[end]\nA[end, end]',
    },
    {
        category: 'Indexing',
        description: 'Slice a row / column',
        matlab: 'A(2, :)   % second row\nA(:, 3)   % third column',
        julia: 'A[2, :]   # second row\nA[:, 3]   # third column',
    },
    {
        category: 'Indexing',
        description: 'Sub-matrix',
        matlab: 'A(1:2, 2:3)',
        julia: 'A[1:2, 2:3]',
    },
    {
        category: 'Indexing',
        description: 'Logical indexing',
        matlab: 'v(v > 3)',
        julia: 'v[v .> 3]',
    },
    {
        category: 'Indexing',
        description: 'Delete element',
        matlab: 'v(3) = []',
        julia: 'deleteat!(v, 3)',
    },

    // ── Linear Algebra ───────────────────────────────────────────────────────────
    {
        category: 'Linear Algebra',
        description: 'Matrix multiply',
        matlab: 'A * B',
        julia: 'A * B',
    },
    {
        category: 'Linear Algebra',
        description: 'Linear solve (A\\b)',
        matlab: 'A \\ b',
        julia: 'A \\ b',
    },
    {
        category: 'Linear Algebra',
        description: 'Determinant',
        matlab: 'det(A)',
        julia: 'using LinearAlgebra\ndet(A)',
    },
    {
        category: 'Linear Algebra',
        description: 'Inverse',
        matlab: 'inv(A)',
        julia: 'using LinearAlgebra\ninv(A)',
    },
    {
        category: 'Linear Algebra',
        description: 'Eigenvalues & vectors',
        matlab: '[V, D] = eig(A)',
        julia: 'using LinearAlgebra\nvals, vecs = eigen(A)',
    },
    {
        category: 'Linear Algebra',
        description: 'SVD',
        matlab: '[U, S, V] = svd(A)',
        julia: 'using LinearAlgebra\nU, S, V = svd(A)',
    },
    {
        category: 'Linear Algebra',
        description: 'Norm',
        matlab: 'norm(v)\nnorm(A, 2)',
        julia: 'using LinearAlgebra\nnorm(v)\nnorm(A, 2)',
    },
    {
        category: 'Linear Algebra',
        description: 'Dot product',
        matlab: "dot(u, v)\nu' * v",
        julia: "using LinearAlgebra\ndot(u, v)\nu' * v",
    },
    {
        category: 'Linear Algebra',
        description: 'Cross product',
        matlab: 'cross(u, v)',
        julia: 'using LinearAlgebra\ncross(u, v)',
    },

    // ── Control Flow ─────────────────────────────────────────────────────────────
    {
        category: 'Control Flow',
        description: 'If / elseif / else',
        matlab: 'if x > 0\n  disp("pos")\nelseif x == 0\n  disp("zero")\nelse\n  disp("neg")\nend',
        julia: 'if x > 0\n  println("pos")\nelseif x == 0\n  println("zero")\nelse\n  println("neg")\nend',
    },
    {
        category: 'Control Flow',
        description: 'For loop',
        matlab: 'for i = 1:10\n  disp(i)\nend',
        julia: 'for i in 1:10\n  println(i)\nend',
    },
    {
        category: 'Control Flow',
        description: 'While loop',
        matlab: 'while x > 0\n  x = x - 1;\nend',
        julia: 'while x > 0\n  x -= 1\nend',
    },
    {
        category: 'Control Flow',
        description: 'Break / continue',
        matlab: 'break\ncontinue',
        julia: 'break\ncontinue',
    },
    {
        category: 'Control Flow',
        description: 'Ternary expression',
        matlab: '% No ternary; use if/else',
        julia: 'x > 0 ? "pos" : "neg"',
    },
    {
        category: 'Control Flow',
        description: 'Short-circuit logical',
        matlab: 'a && b\na || b',
        julia: 'a && b\na || b',
    },
    {
        category: 'Control Flow',
        description: 'Try / catch',
        matlab: 'try\n  risky()\ncatch err\n  disp(err.message)\nend',
        julia: 'try\n  risky()\ncatch err\n  println(err)\nend',
    },

    // ── Functions ────────────────────────────────────────────────────────────────
    {
        category: 'Functions',
        description: 'Define a function',
        matlab: 'function y = square(x)\n  y = x.^2;\nend',
        julia: 'function square(x)\n  return x.^2\nend\n# Short form:\nsquare(x) = x.^2',
    },
    {
        category: 'Functions',
        description: 'Multiple return values',
        matlab: 'function [a, b] = swap(x, y)\n  a = y; b = x;\nend',
        julia: 'function swap(x, y)\n  return y, x\nend\na, b = swap(1, 2)',
    },
    {
        category: 'Functions',
        description: 'Anonymous / lambda',
        matlab: 'f = @(x) x.^2;',
        julia: 'f = x -> x.^2',
    },
    {
        category: 'Functions',
        description: 'Default arguments',
        matlab: '% No native defaults; use nargin\nfunction y = f(x, n)\n  if nargin < 2; n = 1; end\n  y = x^n;\nend',
        julia: 'f(x, n=1) = x^n',
    },
    {
        category: 'Functions',
        description: 'Keyword arguments',
        matlab: '% Not natively supported',
        julia: 'function f(x; tol=1e-8, verbose=false)\n  ...\nend\nf(5; verbose=true)',
    },
    {
        category: 'Functions',
        description: 'Variadic arguments',
        matlab: 'function f(varargin)\n  x = varargin{1};\nend',
        julia: 'function f(args...)\n  x = args[1]\nend',
    },
    {
        category: 'Functions',
        description: 'Apply function element-wise',
        matlab: 'arrayfun(@f, v)',
        julia: 'f.(v)  # broadcasting\nmap(f, v)',
    },

    // ── Strings ──────────────────────────────────────────────────────────────────
    {
        category: 'Strings',
        description: 'String literals',
        matlab: "'hello'",
        julia: '"hello"\n# Note: single quotes are for Chars in Julia: \'a\'',
    },
    {
        category: 'Strings',
        description: 'String interpolation',
        matlab: "['Value is ', num2str(x)]",
        julia: '"Value is $x"\n"Value is $(x + 1)"',
    },
    {
        category: 'Strings',
        description: 'String concatenation',
        matlab: "['hello', ' ', 'world']\nstrcat('hello', ' world')",
        julia: '"hello" * " world"\nstring("hello", " world")',
    },
    {
        category: 'Strings',
        description: 'String length',
        matlab: 'length(s)\nstrlength(s)',
        julia: 'length(s)\nncodeunits(s)  # bytes',
    },
    {
        category: 'Strings',
        description: 'Convert number to string',
        matlab: "num2str(x)",
        julia: 'string(x)\n"$x"',
    },
    {
        category: 'Strings',
        description: 'Parse string to number',
        matlab: "str2num('3.14')\nstr2double('3.14')",
        julia: "parse(Float64, \"3.14\")\nparse(Int, \"42\")",
    },
    {
        category: 'Strings',
        description: 'Split a string',
        matlab: "strsplit(s, ',')",
        julia: "split(s, ',')",
    },
    {
        category: 'Strings',
        description: 'Find / replace in string',
        matlab: "strrep(s, 'old', 'new')\nstrfind(s, 'pat')",
        julia: "replace(s, \"old\" => \"new\")\nfindfirst(\"pat\", s)",
    },
    {
        category: 'Strings',
        description: 'Regular expressions',
        matlab: "regexp(s, '\\d+', 'match')",
        julia: 'using Base: match\nm = match(r"\\d+", s)\nm.match',
    },

    // ── File I/O ─────────────────────────────────────────────────────────────────
    {
        category: 'File I/O',
        description: 'Read text file',
        matlab: "fid = fopen('f.txt');\ndata = fread(fid);\nfclose(fid);",
        julia: 'data = read("f.txt", String)\n# or line by line:\nfor line in eachline("f.txt")\n  println(line)\nend',
    },
    {
        category: 'File I/O',
        description: 'Write text file',
        matlab: "fid = fopen('f.txt','w');\nfprintf(fid,'%s\\n', s);\nfclose(fid);",
        julia: "open(\"f.txt\", \"w\") do io\n  println(io, s)\nend",
    },
    {
        category: 'File I/O',
        description: 'Load CSV / matrix',
        matlab: "readmatrix('data.csv')\ncsvread('data.csv')",
        julia: "using CSV, DataFrames\ndf = CSV.read(\"data.csv\", DataFrame)",
    },
    {
        category: 'File I/O',
        description: 'Save / load .mat file',
        matlab: "save('data.mat', 'A')\nload('data.mat')",
        julia: 'using MAT\nmatwrite("data.mat", Dict("A" => A))\nmatread("data.mat")',
    },

    // ── Plotting ─────────────────────────────────────────────────────────────────
    {
        category: 'Plotting',
        description: 'Basic line plot',
        matlab: 'plot(x, y)',
        julia: 'using Makie, GLMakie\nlines(x, y)',
    },
    {
        category: 'Plotting',
        description: 'Scatter plot',
        matlab: 'scatter(x, y)',
        julia: 'scatter(x, y)',
    },
    {
        category: 'Plotting',
        description: 'Title, labels, legend',
        matlab: "title('T')\nxlabel('x')\nylabel('y')\nlegend('a','b')",
        julia: 'ax = Axis(fig[1,1], title="T", xlabel="x", ylabel="y")\n# Legend added via labels kwarg',
    },
    {
        category: 'Plotting',
        description: 'Multiple plots on one figure',
        matlab: 'hold on\nplot(x, y1)\nplot(x, y2)\nhold off',
        julia: 'lines!(ax, x, y1)  # ! = mutating, adds to existing axis\nlines!(ax, x, y2)',
    },
    {
        category: 'Plotting',
        description: 'Subplots',
        matlab: 'subplot(2,1,1); plot(x,y1)\nsubplot(2,1,2); plot(x,y2)',
        julia: 'fig = Figure()\nax1 = Axis(fig[1,1])\nax2 = Axis(fig[2,1])',
    },
    {
        category: 'Plotting',
        description: 'Save figure',
        matlab: "saveas(gcf, 'fig.png')\nprint('-dpng', 'fig.png')",
        julia: 'save("fig.png", fig)  # CairoMakie for vector/PDF',
    },

    // ── Statistics ───────────────────────────────────────────────────────────────
    {
        category: 'Statistics',
        description: 'Mean / median / std',
        matlab: 'mean(v)\nmedian(v)\nstd(v)',
        julia: 'using Statistics\nmean(v)\nmedian(v)\nstd(v)',
    },
    {
        category: 'Statistics',
        description: 'Min / Max',
        matlab: 'min(v)\nmax(v)\n[m, i] = min(v)  % with index',
        julia: 'minimum(v)\nmaximum(v)\nfindmin(v)   # (val, idx)\nfindmax(v)',
    },
    {
        category: 'Statistics',
        description: 'Sum / product / cumsum',
        matlab: 'sum(v)\nprod(v)\ncumsum(v)',
        julia: 'sum(v)\nprod(v)\ncumsum(v)',
    },
    {
        category: 'Statistics',
        description: 'Correlation / covariance',
        matlab: 'corr(A)\ncov(A)',
        julia: 'using Statistics\ncor(A)\ncov(A)',
    },
    {
        category: 'Statistics',
        description: 'Random numbers',
        matlab: "rand(3,3)       % uniform [0,1]\nrandn(3,3)      % normal N(0,1)\nrandi(10, 3, 3) % int in [1,10]",
        julia: 'rand(3,3)               # uniform [0,1]\nrandn(3,3)             # normal N(0,1)\nrand(1:10, 3, 3)       # int in [1,10]',
    },
    {
        category: 'Statistics',
        description: 'Set random seed',
        matlab: 'rng(42)',
        julia: 'import Random\nRandom.seed!(42)',
    },

    // ── Type System ──────────────────────────────────────────────────────────────
    {
        category: 'Type System',
        description: 'Check / assert type',
        matlab: "isa(x, 'double')",
        julia: 'x isa Float64\nisa(x, Float64)',
    },
    {
        category: 'Type System',
        description: 'Type conversion / casting',
        matlab: "int32(x)\ndouble(x)\nlogical(x)",
        julia: 'Int32(x)\nFloat64(x)\nBool(x)\nconvert(Float64, x)',
    },
    {
        category: 'Type System',
        description: 'Define a struct',
        matlab: '% No struct definition syntax\nS.field = value;',
        julia: 'struct Point\n  x::Float64\n  y::Float64\nend\np = Point(1.0, 2.0)',
    },
    {
        category: 'Type System',
        description: 'Mutable struct',
        matlab: '% All structs are mutable',
        julia: 'mutable struct Counter\n  n::Int\nend\nc = Counter(0)\nc.n += 1',
    },
    {
        category: 'Type System',
        description: 'Abstract / parametric types',
        matlab: '% Not supported',
        julia: 'abstract type Animal end\nstruct Dog{T} <: Animal\n  name::T\nend',
    },
];

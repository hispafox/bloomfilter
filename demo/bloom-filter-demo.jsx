import { useState, useCallback, useRef, useEffect } from "react";

// --- Bloom Filter Engine ---
class BloomFilter {
  constructor(size = 256, hashCount = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Uint8Array(size);
    this.count = 0;
  }

  _hash(str, seed) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    return hash % this.size;
  }

  getPositions(item) {
    const positions = [];
    for (let i = 0; i < this.hashCount; i++) {
      positions.push(this._hash(item.toLowerCase(), (i + 1) * 7919));
    }
    return positions;
  }

  add(item) {
    const positions = this.getPositions(item);
    positions.forEach((pos) => (this.bitArray[pos] = 1));
    this.count++;
    return positions;
  }

  check(item) {
    const positions = this.getPositions(item);
    const allSet = positions.every((pos) => this.bitArray[pos] === 1);
    return { probablyExists: allSet, positions };
  }

  getStats() {
    const bitsSet = this.bitArray.reduce((a, b) => a + b, 0);
    const fillRatio = bitsSet / this.size;
    const falsePositiveRate = Math.pow(fillRatio, this.hashCount);
    return { bitsSet, fillRatio, falsePositiveRate, totalItems: this.count };
  }
}

// --- Preconfigured usernames ---
const SEED_USERNAMES = [
  "pedro", "maria", "carlos", "admin", "root", "test", "user",
  "developer", "garcia", "lopez", "martinez", "fernandez", "gonzalez",
  "rodriguez", "sanchez", "perez", "gomez", "ruiz", "diaz", "moreno",
  "alvarez", "munoz", "romero", "navarro", "torres", "dominguez",
  "vazquez", "ramos", "gil", "serrano", "blanco", "molina", "morales",
  "suarez", "ortega", "delgado", "castro", "ortiz", "rubio", "marin",
];

const HASH_COLORS = ["#e74c3c", "#2ecc71", "#3498db"];
const HASH_NAMES = ["fnv1a", "djb2", "murmur"];

// --- BitGrid Component ---
function BitGrid({ bitArray, highlightPositions, highlightColor, size = 256 }) {
  const cols = 32;
  const rows = Math.ceil(size / cols);
  const cellSize = 14;
  const gap = 2;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: `${gap}px`,
        padding: "12px",
        background: "#0a0a0f",
        borderRadius: "8px",
        border: "1px solid #1a1a2e",
        width: "fit-content",
      }}
    >
      {Array.from({ length: size }, (_, i) => {
        const isHighlighted = highlightPositions?.includes(i);
        const isSet = bitArray[i] === 1;
        return (
          <div
            key={i}
            title={`Bit ${i}: ${isSet ? "1" : "0"}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: "2px",
              background: isHighlighted
                ? highlightColor || "#f1c40f"
                : isSet
                ? "#16a085"
                : "#141422",
              border: isHighlighted
                ? `1px solid ${highlightColor || "#f1c40f"}`
                : isSet
                ? "1px solid #1abc9c"
                : "1px solid #1a1a2e",
              transition: "all 0.2s ease",
              transform: isHighlighted ? "scale(1.3)" : "scale(1)",
              boxShadow: isHighlighted
                ? `0 0 8px ${highlightColor || "#f1c40f"}80`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// --- Hash Visualizer ---
function HashVisualizer({ positions, checking }) {
  if (!positions || positions.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {positions.map((pos, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            background: `${HASH_COLORS[i]}15`,
            border: `1px solid ${HASH_COLORS[i]}40`,
            borderRadius: "6px",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "13px",
          }}
        >
          <span style={{ color: HASH_COLORS[i], fontWeight: 700 }}>
            {HASH_NAMES[i]}()
          </span>
          <span style={{ color: "#8892b0" }}>→</span>
          <span style={{ color: "#ccd6f6", fontWeight: 600 }}>
            bit[{pos}]
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Result Badge ---
function ResultBadge({ result, username }) {
  if (!result || !username) return null;

  const available = !result.probablyExists;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 18px",
        borderRadius: "8px",
        background: available ? "#0d3320" : "#3d1515",
        border: `1px solid ${available ? "#16a085" : "#e74c3c"}60`,
        marginTop: "8px",
      }}
    >
      <span style={{ fontSize: "20px" }}>{available ? "✓" : "✗"}</span>
      <div>
        <div
          style={{
            color: available ? "#2ecc71" : "#e74c3c",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {available ? "Probablemente disponible" : "Probablemente ocupado"}
        </div>
        <div style={{ color: "#8892b0", fontSize: "12px", marginTop: "2px" }}>
          {available
            ? "Ningún bit coincide → 100% seguro de que no existe"
            : "Todos los bits activos → ~99% probabilidad de que existe"}
        </div>
      </div>
    </div>
  );
}

// --- Stats Panel ---
function StatsPanel({ stats, filterSize }) {
  const items = [
    {
      label: "Bits activos",
      value: `${stats.bitsSet} / ${filterSize}`,
      color: "#1abc9c",
    },
    {
      label: "Fill ratio",
      value: `${(stats.fillRatio * 100).toFixed(1)}%`,
      color: "#3498db",
    },
    {
      label: "Falsos positivos",
      value: `~${(stats.falsePositiveRate * 100).toFixed(2)}%`,
      color: "#e74c3c",
    },
    {
      label: "Usernames cargados",
      value: stats.totalItems,
      color: "#f39c12",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "10px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: "12px",
            background: "#0f0f1a",
            borderRadius: "6px",
            border: "1px solid #1a1a2e",
          }}
        >
          <div style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {item.label}
          </div>
          <div
            style={{
              color: item.color,
              fontSize: "20px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: "4px",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Comparison Table ---
function ComparisonTable() {
  const rows = [
    { metric: "Memoria 2B usuarios", bloom: "~2 GB", hashset: "~60-100 GB" },
    { metric: "Velocidad consulta", bloom: "O(k) μs", hashset: "O(1) amort." },
    { metric: "Falsos positivos", bloom: "~1%", hashset: "0%" },
    { metric: "Falsos negativos", bloom: "0% ✓", hashset: "0% ✓" },
    { metric: "Borrar elemento", bloom: "No*", hashset: "Sí" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            {["", "Bloom Filter", "HashSet"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  color: "#8892b0",
                  borderBottom: "1px solid #1a1a2e",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric}>
              <td style={{ padding: "8px 14px", color: "#ccd6f6", borderBottom: "1px solid #0f0f1a" }}>
                {row.metric}
              </td>
              <td style={{ padding: "8px 14px", color: "#1abc9c", borderBottom: "1px solid #0f0f1a" }}>
                {row.bloom}
              </td>
              <td style={{ padding: "8px 14px", color: "#e74c3c", borderBottom: "1px solid #0f0f1a" }}>
                {row.hashset}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Code Preview ---
function CodePreview() {
  const code = `// .NET 10 — BloomFilter<T>
public class BloomFilter<T>
{
    private readonly BitArray _bits;
    private readonly int _hashCount;
    private readonly int _size;

    public BloomFilter(int size = 1_000_000, int hashCount = 3)
    {
        _size = size;
        _hashCount = hashCount;
        _bits = new BitArray(size);
    }

    public void Add(T item)
    {
        foreach (var pos in GetPositions(item))
            _bits[pos] = true;
    }

    public bool ProbablyContains(T item)
        => GetPositions(item).All(pos => _bits[pos]);

    private IEnumerable<int> GetPositions(T item)
    {
        var hash = item!.GetHashCode();
        for (int i = 0; i < _hashCount; i++)
        {
            hash = HashCode.Combine(hash, i * 7919);
            yield return Math.Abs(hash) % _size;
        }
    }
}

// Minimal API endpoint
app.MapGet("/api/username/check/{name}",
    (string name, BloomFilter<string> filter) =>
    Results.Ok(new {
        available = !filter.ProbablyContains(name),
        note = "pre-check — confirmar con DB"
    }));`;

  return (
    <pre
      style={{
        background: "#0a0a0f",
        border: "1px solid #1a1a2e",
        borderRadius: "8px",
        padding: "16px",
        overflowX: "auto",
        fontSize: "12px",
        lineHeight: "1.6",
        color: "#8892b0",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        margin: 0,
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

// --- Architecture Diagram ---
function ArchDiagram() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0",
        padding: "20px 12px",
        overflowX: "auto",
        flexWrap: "nowrap",
      }}
    >
      {[
        { icon: "⌨️", label: "React", sub: "onChange", color: "#3498db" },
        { icon: "→", isArrow: true },
        { icon: "🔍", label: "Bloom Filter", sub: "O(k) · RAM", color: "#1abc9c" },
        { icon: "→", isArrow: true },
        { icon: "🎯", label: "¿Probable?", sub: "Sí → DB check", color: "#f39c12" },
        { icon: "→", isArrow: true },
        { icon: "🗄️", label: "SQL Server", sub: "UNIQUE constraint", color: "#e74c3c" },
      ].map((item, i) =>
        item.isArrow ? (
          <span key={i} style={{ color: "#3a3f58", fontSize: "20px", padding: "0 4px", flexShrink: 0 }}>
            →
          </span>
        ) : (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "14px 16px",
              background: `${item.color}10`,
              border: `1px solid ${item.color}30`,
              borderRadius: "8px",
              minWidth: "110px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: "24px" }}>{item.icon}</div>
            <div style={{ color: item.color, fontWeight: 700, fontSize: "13px", marginTop: "6px" }}>
              {item.label}
            </div>
            <div style={{ color: "#5a6380", fontSize: "11px", marginTop: "2px" }}>
              {item.sub}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// --- Tab Component ---
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #1a1a2e", paddingBottom: "0" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: "10px 18px",
            background: active === tab.id ? "#1a1a2e" : "transparent",
            border: "none",
            borderBottom: active === tab.id ? "2px solid #1abc9c" : "2px solid transparent",
            color: active === tab.id ? "#ccd6f6" : "#5a6380",
            fontWeight: active === tab.id ? 700 : 400,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.2s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// --- Main App ---
export default function BloomFilterApp() {
  const filterRef = useRef(null);
  const registeredRef = useRef(new Set());
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [positions, setPositions] = useState([]);
  const [bitArray, setBitArray] = useState(new Uint8Array(256));
  const [stats, setStats] = useState({ bitsSet: 0, fillRatio: 0, falsePositiveRate: 0, totalItems: 0 });
  const [activeTab, setActiveTab] = useState("demo");
  const [log, setLog] = useState([]);
  const [falsePositiveDemo, setFalsePositiveDemo] = useState(null);

  useEffect(() => {
    const bf = new BloomFilter(256, 3);
    SEED_USERNAMES.forEach((u) => bf.add(u));
    SEED_USERNAMES.forEach((u) => registeredRef.current.add(u.toLowerCase()));
    filterRef.current = bf;
    setBitArray(new Uint8Array(bf.bitArray));
    setStats(bf.getStats());
    setLog([{ type: "info", msg: `${SEED_USERNAMES.length} usernames precargados en el filtro` }]);
  }, []);

  const handleCheck = useCallback((value) => {
    setUsername(value);
    if (!value.trim() || !filterRef.current) {
      setResult(null);
      setPositions([]);
      return;
    }
    const res = filterRef.current.check(value.trim());
    setResult(res);
    setPositions(res.positions);

    // Detect false positive
    if (res.probablyExists && !registeredRef.current.has(value.trim().toLowerCase())) {
      setFalsePositiveDemo(value.trim());
    } else {
      setFalsePositiveDemo(null);
    }
  }, []);

  const handleRegister = useCallback(() => {
    if (!username.trim() || !filterRef.current) return;
    const name = username.trim().toLowerCase();

    if (registeredRef.current.has(name)) {
      setLog((prev) => [...prev, { type: "error", msg: `"${name}" ya existe en la DB → UNIQUE constraint lo rechaza` }]);
      return;
    }

    filterRef.current.add(name);
    registeredRef.current.add(name);
    setBitArray(new Uint8Array(filterRef.current.bitArray));
    setStats(filterRef.current.getStats());
    setLog((prev) => [
      ...prev,
      { type: "success", msg: `"${name}" registrado → bits [${filterRef.current.getPositions(name).join(", ")}] activados` },
    ]);
    setFalsePositiveDemo(null);
    handleCheck(username);
  }, [username, handleCheck]);

  const tabs = [
    { id: "demo", label: "Demo interactiva" },
    { id: "arch", label: "Arquitectura" },
    { id: "code", label: "Código .NET" },
    { id: "compare", label: "Comparativa" },
  ];

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        background: "#0d0d17",
        color: "#ccd6f6",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #1abc9c, #16a085)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            B
          </div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e6f1ff" }}>
            Bloom Filter Explorer
          </h1>
        </div>
        <p style={{ margin: 0, color: "#5a6380", fontSize: "13px" }}>
          Estructura probabilística — como la que usa Gmail para verificar usernames al instante
        </p>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div style={{ marginTop: "20px" }}>
        {activeTab === "demo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Input */}
            <div>
              <label style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                Comprobar username
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleCheck(e.target.value)}
                  placeholder="Escribe un username..."
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#0a0a0f",
                    border: "1px solid #1a1a2e",
                    borderRadius: "6px",
                    color: "#ccd6f6",
                    fontSize: "15px",
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1abc9c")}
                  onBlur={(e) => (e.target.style.borderColor = "#1a1a2e")}
                />
                <button
                  onClick={handleRegister}
                  disabled={!username.trim()}
                  style={{
                    padding: "12px 20px",
                    background: username.trim() ? "#1abc9c" : "#1a1a2e",
                    border: "none",
                    borderRadius: "6px",
                    color: username.trim() ? "#0d0d17" : "#3a3f58",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: username.trim() ? "pointer" : "default",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Registrar
                </button>
              </div>
            </div>

            {/* Hash positions */}
            {positions.length > 0 && (
              <div>
                <div style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  Funciones hash → posiciones
                </div>
                <HashVisualizer positions={positions} />
              </div>
            )}

            {/* Result */}
            <ResultBadge result={result} username={username} />

            {/* False positive alert */}
            {falsePositiveDemo && (
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: "8px",
                  background: "#3d2e15",
                  border: "1px solid #f39c1260",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#f39c12", fontWeight: 700 }}>⚠ ¡Falso positivo detectado!</span>
                <span style={{ color: "#8892b0" }}>
                  {" "}— "{falsePositiveDemo}" no está registrado, pero los bits coinciden con otros usernames. 
                  Por eso la DB con UNIQUE constraint es la que decide de verdad.
                </span>
              </div>
            )}

            {/* Bit array */}
            <div>
              <div style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Array de bits ({bitArray.length} bits)
              </div>
              <BitGrid
                bitArray={bitArray}
                highlightPositions={positions}
                highlightColor={result?.probablyExists ? "#e74c3c" : "#2ecc71"}
              />
            </div>

            {/* Stats */}
            <StatsPanel stats={stats} filterSize={256} />

            {/* Log */}
            {log.length > 0 && (
              <div>
                <div style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  Log de operaciones
                </div>
                <div
                  style={{
                    maxHeight: "160px",
                    overflowY: "auto",
                    background: "#0a0a0f",
                    borderRadius: "6px",
                    border: "1px solid #1a1a2e",
                    padding: "8px 12px",
                  }}
                >
                  {log.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "12px",
                        padding: "4px 0",
                        color: entry.type === "error" ? "#e74c3c" : entry.type === "success" ? "#2ecc71" : "#5a6380",
                        borderBottom: i < log.length - 1 ? "1px solid #0f0f1a" : "none",
                      }}
                    >
                      <span style={{ color: "#3a3f58", marginRight: "8px" }}>{String(i).padStart(2, "0")}</span>
                      {entry.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seed list */}
            <div>
              <div style={{ color: "#5a6380", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Usernames precargados (prueba con estos)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {SEED_USERNAMES.map((u) => (
                  <button
                    key={u}
                    onClick={() => handleCheck(u)}
                    style={{
                      padding: "4px 10px",
                      background: "#141422",
                      border: "1px solid #1a1a2e",
                      borderRadius: "4px",
                      color: "#5a6380",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "arch" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ color: "#8892b0", fontSize: "14px", lineHeight: 1.7 }}>
              <strong style={{ color: "#e6f1ff" }}>Flujo completo</strong> — el Bloom Filter es solo la primera capa.
              El usuario escribe, React lanza el check contra el filtro en RAM del servidor. Si el filtro dice "no existe",
              se responde al instante. Si dice "probablemente sí", se consulta la base de datos real.
              La decisión final siempre la tiene el UNIQUE constraint de SQL Server.
            </div>
            <ArchDiagram />
            <div
              style={{
                padding: "16px",
                background: "#0f0f1a",
                borderRadius: "8px",
                border: "1px solid #1a1a2e",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#8892b0",
              }}
            >
              <div style={{ color: "#1abc9c", fontWeight: 700, marginBottom: "8px" }}>
                ¿Por qué dos capas?
              </div>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong style={{ color: "#ccd6f6" }}>Velocidad</strong> → el Bloom Filter. 
                Consulta O(k) en microsegundos, sin tocar disco ni red a la DB.
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong style={{ color: "#ccd6f6" }}>Consistencia</strong> → la base de datos. 
                UNIQUE constraint + transacción = imposible duplicar, incluso con race conditions.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "#ccd6f6" }}>Concurrencia</strong> → si dos INSERTs llegan a la vez, 
                solo uno hace commit. El otro recibe una violación de constraint. Sin Bloom Filter, 
                ambos habrían viajado hasta la DB para nada.
              </p>
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ color: "#8892b0", fontSize: "13px", lineHeight: 1.6 }}>
              Implementación mínima con <strong style={{ color: "#ccd6f6" }}>.NET 10</strong> Minimal API. 
              El BloomFilter se registra como Singleton en DI y se precarga al arrancar.
            </div>
            <CodePreview />
          </div>
        )}

        {activeTab === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ color: "#8892b0", fontSize: "14px", lineHeight: 1.7 }}>
              Con 2.000 millones de usernames, un HashSet ocuparía ~60-100 GB. 
              El Bloom Filter lo resuelve en ~2 GB a cambio de un ~1% de falsos positivos. 
              Nunca da falsos negativos: si dice que no existe, es 100% seguro.
            </div>
            <ComparisonTable />
            <div
              style={{
                padding: "16px",
                background: "#0f0f1a",
                borderRadius: "8px",
                border: "1px solid #1a1a2e",
                fontSize: "12px",
                color: "#5a6380",
              }}
            >
              * Los Bloom Filters clásicos no soportan borrado. Para eso existe el{" "}
              <strong style={{ color: "#8892b0" }}>Counting Bloom Filter</strong>{" "}
              (cada posición es un contador en vez de un bit) o el{" "}
              <strong style={{ color: "#8892b0" }}>Cuckoo Filter</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

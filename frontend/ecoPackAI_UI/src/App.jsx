import { useState } from "react";
import { useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {

  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(5);
  const [weight, setWeight] = useState("");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("eco_history");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("eco_history", JSON.stringify(history));
  }, [history]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setResults([]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/recommend-material",
        {
          product_type: product,
          strength: strength ? parseInt(strength) : 5,
          weight_capacity: weight ? parseFloat(weight) : 10,
        }
      );

      const data = response.data.results || [];
      setResults(data);
      setMessage(response.data.message || "");

      // Save to history (max 8, newest first, no duplicate product names)
      if (data.length > 0) {
        setHistory((prev) => {
          const filtered = prev.filter(
            (h) => h.product.toLowerCase() !== product.toLowerCase()
          );
          const newEntry = {
            product,
            strength: parseInt(strength),
            weight: parseFloat(weight) || 10,
            topMaterial: data[0].Material_Type,
          };
          return [newEntry, ...filtered].slice(0, 10);
        });
      }
    } catch (error) {
      console.error(error);
      setMessage("Error connecting to backend.");
    }

    setLoading(false);
  };

  // ── Load history item into form (does NOT submit) ────────────────────────
  const handleHistoryClick = (item) => {
    setProduct(item.product);
    setStrength(item.strength);
    setWeight(item.weight);
  };

  // ── Clear History ────────────────────────────────────────────────────────
    const clearHistory = () => {
      const confirmDelete = window.confirm(
        "Are you sure you want to clear your search history?"
      );

      if (!confirmDelete) return;

      setHistory([]);
      localStorage.removeItem("eco_history");
    };

  // ── CSV Download ─────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const headers = ["Rank", "Material", "Predicted Cost (USD)", "CO2 Emission (kg CO2/kg)", "Sustainability Score (%)"];
    const rows = results.map((item, i) => [
      `#${i + 1}`,
      item.Material_Type,
      item.predicted_cost.toFixed(2),
      item.predicted_co2.toFixed(2),
      (item.final_score * 100).toFixed(0) + "%",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EcoPackAI_${product.replace(/\s+/g, "_")}_Report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF Download ─────────────────────────────────────────────────────────
  const downloadPDF = async () => {
  // Create a hidden container
  const element = document.createElement("div");

  const rows = results
    .map(
      (item, i) => `
      <tr>
        <td>#${i + 1}</td>
        <td><strong>${item.Material_Type}</strong></td>
        <td>$${item.predicted_cost.toFixed(2)}</td>
        <td>${item.predicted_co2.toFixed(2)} kg</td>
        <td>${(item.final_score * 100).toFixed(0)}%</td>
      </tr>`
    )
    .join("");

  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; width: 100%;">
      <h1 style="color:#198754; margin-bottom:4px; font-size:100px">🌿 EcoPackAI</h1>
      <h2 style="color:#666; margin-top:20px; font-size:50px">
        AI-Powered Sustainable Packaging Recommendation Report
      </h2>

      <div style="margin:20px 0; font-size:40px;">
        <span style="margin-right:24px;"><strong>Product:</strong> ${product}</span>
        <span style="margin-right:24px;"><strong>Strength:</strong> ${strength}(on the range of 1-10)</span>
        <span><strong>Weight-Capacity:</strong> ${weight} kg</span>
      </div>

      <table style="width:100%; border-collapse: collapse; margin-top:50px; font-size: 40px;">
        <thead>
          <tr style="background:#198754; color:white;">
            <th style="padding:10px;">Rank</th>
            <th style="padding:10px;">Material</th>
            <th style="padding:10px;">Cost</th>
            <th style="padding:10px;">CO₂</th>
            <th style="padding:10px;">Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:40px; font-size:40px; color:#999; text-align:center;">
        Generated by EcoPackAI | ${new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })}
      </div>
    </div>
  `;

  document.body.appendChild(element);

  // Convert to canvas
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

  pdf.save(`EcoPackAI_${product.replace(/\s+/g, "_")}.pdf`);

  document.body.removeChild(element);
};

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container-fluid px-4">

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold text-success">EcoPackAI</h1>
          <p className="text-muted">AI-Powered Sustainable Material Recommendation</p>
        </div>

        <div className="row g-4">

          {/* ── LEFT SIDEBAR: History ── */}
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0"
                style={{
                  borderRadius: "16px",
                  position: "sticky",
                  top: "20px"
                }}
              >
              <div className="card-body p-3">
                <h6 className="fw-bold text-success mb-3">
                  🕘 Recent Searches
                </h6>
                {history.length === 0 ? (
                  <p className="text-muted small">
                    Your recent searches will appear here.
                  </p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(item)}
                      className="p-2 mb-2 rounded"
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#f0faf3",
                        border: "1px solid #c3e6cb",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d4edda"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0faf3"}
                    >
                      <div className="fw-semibold text-dark small">{item.product}</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Top: {item.topMaterial}
                      </div>
                    </div>
                  ))
                )}
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="btn btn-sm btn-outline-danger"
                      style={{ fontSize: "11px" }}
                    >
                      Clear History
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="col-md-6">

            {/* Form Card */}
            <div className="card shadow-lg border-0 mx-auto mb-4" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>

                  {/* Product Input */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Product Type</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Example: Pizza Box, Laptop, Water Bottle"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      required
                    />
                  </div>

                  {/* Strength + Weight */}
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Strength: {strength}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="form-range"
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        style={{ width: "90%" }}
                        required
                      />
                      <div className="d-flex justify-content-between small text-muted px-1">
                        <span>Fragile</span>
                        <span>Medium</span>
                        <span>Heavy</span>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Weight Capacity (kg)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 1, 5, 20"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                      <small className="text-muted">
                        Light (1kg), Medium (5kg), Heavy (20kg+)
                      </small>
                    </div>

                  </div>

                  {/* Submit */}
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-success btn-lg">
                      Get Sustainable Material
                    </button>
                  </div>

                </form>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center mt-4">
                <div className="spinner-border text-success"></div>
              </div>
            )}

            {/* Warning message */}
            {message && results.length === 0 && (
              <div className="alert alert-warning text-center mt-4">
                {message}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-2">

                {/* Results header + download buttons */}
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="fw-bold mb-0">Recommended Materials</h4>
                    <p className="text-muted small mb-0">
                      Ranked by <b>recyclability</b>, <b>biodegradability</b> and <b>carbon footprint</b>.
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={downloadCSV}
                      className="btn btn-outline-success btn-sm"
                    >
                      ⬇ Download CSV
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="btn btn-success btn-sm"
                    >
                      ⬇ Download PDF
                    </button>
                  </div>
                </div>

                {/* Result cards */}
                <div className="row g-4">
                  {[...results].map((item, index) => (
                    <div className="col-md-4" key={index}>
                      <div className="card shadow-sm border-0 h-100 text-center">
                        <div className="card-body">

                          <h6 className="text-muted">#{index + 1} Best Match</h6>

                          <h5 className="text-success fw-bold">
                            {item.Material_Type}
                          </h5>

                          <hr />

                          <p className="mb-1">
                            <strong>Cost:</strong> ${item.predicted_cost.toFixed(2)}
                          </p>
                          <small className="text-muted">
                            Estimated packaging cost per unit
                          </small>

                          <p className="mb-1 mt-2">
                            <strong>CO₂:</strong> {item.predicted_co2.toFixed(2)}
                          </p>
                          <small className="text-muted">
                            Lower values indicate more eco-friendly materials
                          </small>

                          <div className="mt-3">
                            <small className="fw-semibold">Sustainability Score</small>
                            <div className="progress mt-1">
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${item.final_score * 100}%` }}
                              >
                                {(item.final_score * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

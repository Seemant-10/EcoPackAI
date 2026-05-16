import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

function App() {

  const [product, setProduct] = useState("");
  const reportRef = useRef(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(5);
  const [weight, setWeight] = useState("");
  const username = localStorage.getItem("username") || "User";
  const historyKey = `eco_history_${username}`;
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/login");
  };
  useEffect(() => {
    const saved = localStorage.getItem(historyKey);

    if (saved) {
      setHistory(JSON.parse(saved).slice(0, 8));
    } else {
      setHistory([]);
    }

    setHistoryLoaded(true);
  }, [historyKey]);

  useEffect(() => {
    if (!historyLoaded) return;

    localStorage.setItem(
      historyKey,
      JSON.stringify(history)
    );
  }, [history, historyKey, historyLoaded]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    setResults([]);
    setMessage("");
    setLoading(true);

    const payload = {
      product_type: product,
      strength: Number(strength),
      weight_capacity: Number(weight)
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/recommend-material",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = response.data.results || [];

      setResults(data);
      setMessage(response.data.message || "");

      if (data.length > 0) {
        setHistory((prev) => {
          const filtered = prev.filter(
            (h) =>
              h.product.toLowerCase() !==
              product.toLowerCase()
          );

          const newEntry = {
            product,
            strength: Number(strength),
            weight: Number(weight),
            topMaterial: data[0].Material_Type
          };

          return [newEntry, ...filtered].slice(0, 8);
        });
      }

    } catch (error) {
      console.log(error);

      if (error.response) {
        setMessage(
          error.response.data.detail ||
          error.response.data.message ||
          "Request failed"
        );
      } else {
        setMessage("Backend not reachable");
      }

    } finally {
      setLoading(false);
    }
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
      localStorage.removeItem(historyKey);
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
    // Capture live visible results section (cards + charts)
    const element = reportRef.current;

    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;

    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // ---------- COVER HEADER ----------
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(25, 135, 84);
    pdf.text("EcoPackAI", 105, 18, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(
      "AI-Powered Sustainable Packaging Recommendation Report",
      105,
      25,
      { align: "center" }
    );

    pdf.setTextColor(40);
    pdf.setFontSize(11);

    pdf.text(`Product: ${product}`, 10, 35);
    pdf.text(`Strength: ${strength}/10`, 10, 42);
    pdf.text(`Weight Capacity: ${weight} kg`, 10, 49);

    // ---------- MULTI PAGE IMAGE ----------
    let position = 58;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position - 10);

    while (heightLeft > 0) {
      pdf.addPage();

      const nextY = heightLeft - imgHeight + 10;
      pdf.addImage(imgData, "PNG", margin, nextY, imgWidth, imgHeight);

      heightLeft -= (pageHeight - 20);
    }

    // ---------- FOOTER ----------
    const totalPages = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      pdf.setFontSize(9);
      pdf.setTextColor(130);

      pdf.text(
        `Generated on ${new Date().toLocaleDateString("en-GB")}`,
        10,
        292
      );

      pdf.text(
        `Page ${i} of ${totalPages}`,
        200,
        292,
        { align: "right" }
      );
    }

    pdf.save(`EcoPackAI_${product.replace(/\s+/g, "_")}.pdf`);
  };

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container-fluid px-4">

        {/* Header */}
        <div className="d-flex align-items-center mb-5 flex-wrap gap-3">
        {/* Left */}
        <div style={{marginLeft: "35vw",marginRight: "15vw", textAlign: "center"}}>
          <h1 className="fw-bold text-success mb-1">
            EcoPackAI
          </h1>

          <p className="text-muted mb-0">
            AI-Powered Sustainable Material Recommendation
          </p>
        </div>

        {/* Right */}
        <div className="dropdown">

          <button
            className="btn btn-success dropdown-toggle px-3"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            👤 {username}
          </button>

          <ul
            className="dropdown-menu dropdown-menu-end shadow"
            style={{ minWidth: "240px" }}
          >

            <li className="px-3 pt-2">
              <div className="fw-bold">
                {username}
              </div>
            </li>

            <li className="px-3 pb-2">
              <small className="text-muted">
                {localStorage.getItem("email") || "No email"}
              </small>
            </li>

            <li>
              <hr className="dropdown-divider" />
            </li>

            <li>
              <button
                className="dropdown-item"
                onClick={() => navigate("/app")}
              >
                Home
              </button>
            </li>

            <li>
              <button
                className="dropdown-item"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
            </li>

            <li>
              <hr className="dropdown-divider" />
            </li>

            <li>
              <button
                className="dropdown-item text-danger"
                onClick={logout}
              >
                Logout
              </button>
            </li>

          </ul>
        </div>

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
              <div className="card-body p-3 text-center">
                <h6 className="fw-bold text-success mb-3">
                  🕘 Recent Searches
                </h6>
                {history.length === 0 ? (
                  <p className="text-muted small">
                    Your recent searches will appear here.
                  </p>
                ) : (
                  history.slice(0, 8).map((item, index) => (
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
                        Light (1), Medium (5), Heavy (20+)
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
                <div ref={reportRef}>
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
                              <small className="text-muted">
                                <strong>Why this material?</strong>
                              </small>
                            </div>
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
                            <div className="mt-4">
                              <small className="fw-semibold text-muted d-block mb-2">
                                Top factors driving this prediction
                              </small>

                              {/* Cost SHAP Drivers Breakdown */}
                                {item.shap_cost && item.shap_cost.length > 0 && (
                                  <div className="mt-2 text-start bg-light p-2 rounded" style={{ fontSize: "12px" }}>
                                    <div className="fw-bold text-secondary mb-1">Cost Impact Factors:</div>
                                    {item.shap_cost.map((feat, idx) => {
                                      const val = item.shap_cost_vals[idx];
                                      const numericVal = Number(val);
                                      const isPositive = numericVal > 0;
                                      return (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="text-muted">{feat}</span>
                                          <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'}`}>
                                            {isPositive ? '↑ +' : '↓ -'}{Math.abs(numericVal).toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* CO2 SHAP Drivers Breakdown */}
                                {item.shap_co2 && item.shap_co2.length > 0 && (
                                  <div className="mt-2 text-start bg-light p-2 rounded" style={{ fontSize: "12px" }}>
                                    <div className="fw-bold text-secondary mb-1">CO₂ Impact Factors:</div>
                                    {item.shap_co2.map((feat, idx) => {
                                      const val = item.shap_co2_vals[idx];
                                      const isPositive = val > 0; // Positive means it increases emissions (bad)
                                      return (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="text-muted">{feat}</span>
                                          <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'}`}>
                                            {isPositive ? '↑ +' : '↓ -'}{Math.abs(val).toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card shadow-sm border-0 mt-5 p-4">
                    <h4 className="fw-bold text-success mb-2">
                      Compare Recommended Materials
                    </h4>

                    <p className="text-muted small mb-4">
                      Side-by-side comparison of estimated cost and carbon footprint.
                    </p>

                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart
                        data={results.map((item) => ({
                          name: item.Material_Type,
                          Cost: Number(item.predicted_cost.toFixed(2)),
                          CO2: Number(item.predicted_co2.toFixed(2))
                        }))}
                        margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                      >
                        <XAxis
                          dataKey="name"
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                          height={70}
                        />

                        <YAxis />
                        <Tooltip />
                        <Legend />

                        <Bar
                          dataKey="Cost"
                          fill="#198754"
                          radius={[4,4,0,0]}
                        />

                        <Bar
                          dataKey="CO2"
                          fill="#0d6efd"
                          radius={[4,4,0,0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

          </div>
          {/* Right Sidebar */}
          <div
            className="col-md-3"
            style={{
              position: "sticky",
              top: "20px",
              alignSelf: "flex-start",
              height: "fit-content" 
            }}
          >
            <div className="card shadow-sm border-0 p-2">
              <h4 className="fw-bold text-success mb-3">
                Smart Material Comparison
              </h4>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-success">
                    <tr>
                      <th>Material</th>
                      <th>Cost ($)</th>
                      <th>CO₂</th>
                      <th>Score</th>
                      <th>Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, index) => {
                      const minCost = Math.min(...results.map(r => r.predicted_cost));
                      const minCO2 = Math.min(...results.map(r => r.predicted_co2));
                      const maxScore = Math.max(...results.map(r => r.final_score));

                      let tag = "Balanced Choice";

                      if (item.predicted_cost === minCost)
                        tag = "Budget Friendly";
                      else if (item.predicted_co2 === minCO2)
                        tag = "Eco Friendly";
                      else if (item.final_score === maxScore)
                        tag = "Best Overall";

                      return (
                        <tr key={index}>
                          <td className="fw-semibold">{item.Material_Type}</td>
                          <td>{item.predicted_cost.toFixed(2)}</td>
                          <td>{item.predicted_co2.toFixed(2)}</td>
                          <td>{(item.final_score * 100).toFixed(0)}%</td>
                          <td>{tag}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;

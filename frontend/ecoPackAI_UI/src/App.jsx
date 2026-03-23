import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {

  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(5);
  const [weight, setWeight] = useState("");

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
          weight_capacity: weight ? parseFloat(weight) : 10
        }
      );

      setResults(response.data.results || []);
      setMessage(response.data.message || "");

    } catch (error) {
      console.error(error);
      setMessage("Error connecting to backend.");
    }

    setLoading(false);
  };

  return (
    <div className="bg-light min-vh-100 py-5">

      <div className="container">

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold text-success">EcoPackAI</h1>
          <p className="text-muted">
            AI-Powered Sustainable Material Recommendation
          </p>
        </div>

        {/* FORM */}
        <div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: "700px", borderRadius: "16px" }}>

          <div className="card-body p-4">

            <form onSubmit={handleSubmit}>

              {/* Product Input */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Product Type
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Example: Pizza Box, Water Bottle"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  required
                />
              </div>

              {/* Row for inputs */}
              <div className="row g-3">

                {/* Strength */}
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

                {/* Weight */}
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

              {/* Button */}
              <div className="d-grid mt-4">
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                >
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

        {/* Message */}
        {message && results.length === 0 && (
          <div className="alert alert-warning text-center mt-4">
            {message}
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (

          <div className="mt-5">

            <h4 className="text-center fw-bold mb-4">
              Recommended Materials
            </h4>
                <p>
                  Sustainable packaging options based on <b>recyclability</b>,
                  <b>biodegradability</b> and <b>carbon footprint</b>.
                </p>             

            <div className="row g-4">

              {[...results].map((item, index) => (

                <div className="col-md-4" key={index}>

                  <div className="card shadow-sm border-0 h-100 text-center">

                    <div className="card-body">

                      <h6 className="text-muted">
                        #{index + 1} Best Match
                      </h6>

                      <h5 className="text-success fw-bold">
                        {item.Material_Type}
                      </h5>

                      <hr />

                      <p className="mb-1">
                        <strong>Cost:</strong> $
                        {item.predicted_cost.toFixed(2)}
                      </p>
                      <small className="text-muted">
                        Estimated packaging cost per unit
                      </small>


                      <p className="mb-1">
                        <strong>CO₂:</strong>{" "}
                        {item.predicted_co2.toFixed(2)}
                      </p>
                      <small className="text-muted">
                        Lower values indicate more eco-friendly materials
                      </small>


                      <div className="mt-3">

                        <small className="fw-semibold">
                          Sustainability Score
                        </small>

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
  );
}

export default App;
import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {

  const [product, setProduct] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // clear previous results
    setResults([]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/recommend-material",
        {
          product_type: product
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
    <div className="bg-light min-vh-100 py-4">
      <div className="container-fluid px-2">
        <div className="row">
          <div className="col-12">

            {/* Header */}
            <div className="text-center mb-4">

              <h1 className="fw-bold text-success">
                EcoPackAI
              </h1>

              <p className="text-muted">
                AI-Powered Sustainable Packaging Recommendation System
              </p>

            </div>

            {/* Input Card */}
            <div className="card shadow-lg border-0 mb-4">

              <div className="card-body p-4">

                <form onSubmit={handleSubmit}>

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Enter Product Type
                    </label>

                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Example: Laptop Box"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      required
                    />

                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 btn-lg"
                  >
                    Recommend Sustainable Material
                  </button>

                </form>

              </div>

            </div>

            {/* Loading Spinner */}
            {loading && (
              <div className="text-center mt-4">
                <div className="spinner-border text-success"></div>
              </div>
            )}

            {message && results.length === 0 && (
              <div className="alert alert-warning text-center mt-4">
                {message}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (

              <div className="mt-5">

                <h4 className="mb-4 text-center fw-bold">
                   Recommended Sustainable Materials
                </h4>
                <p>
                  Sustainable packaging options based on <b>recyclability</b>,
                  <b>biodegradability</b> and <b>carbon footprint</b>.
                </p>                

                <div className="row">

                  {[...results]
                    .sort((a, b) => b.score - a.score)
                    .map((item, index) => (

                      <div className="col" key={index}>

                        <div className="card shadow-sm h-100 border-0 w-100">

                          <div className="card-body text-center p-3">

                            <h6 className="text-muted">
                              #{index + 1} Recommended
                            </h6>

                            <h5 className="card-title text-success">
                              {item.Material_Type}
                            </h5>
                            <hr />

                            <p className="mb-1">
                              <strong>Estimated Cost:</strong> $
                              {item.predicted_cost.toFixed(2)}
                            </p>

                            <small className="text-muted">
                              Estimated packaging cost per unit
                            </small>

                            <p className="mt-2 mb-1">
                              <strong>Carbon Footprint:</strong>{" "}
                              {item.predicted_co2.toFixed(2)}
                            </p>

                            <small className="text-muted">
                              Lower values indicate more eco-friendly materials
                            </small>

                            <div className="mt-3">

                              <strong>Sustainability Score</strong>

                              <div className="progress mt-1">

                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${item.score * 100}%` }}
                                >
                                  {(item.score * 100).toFixed(0)}%
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
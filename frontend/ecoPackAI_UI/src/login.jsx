import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const res = await axios.post(
        "http://127.0.0.1:8000/login",
        { email, password }
        );

        if (!res.data.access_token) {
        setMsg("Invalid credentials");
        return;
        }

        localStorage.setItem(
        "token",
        res.data.access_token
        );

        localStorage.setItem(
        "username",
        res.data.username
        );
        localStorage.setItem("email", email);
        navigate("/app");

    } catch (err) {
        setMsg("Invalid credentials");
    }
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">

        {/* Left */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-white">
          <div style={{ width: "420px" }}>

            <h1 className="fw-bold text-success">
              EcoPackAI
            </h1>

            <p className="text-muted mb-4">
              AI-Powered Sustainable Packaging Recommendation Platform
            </p>

            <form onSubmit={handleLogin}>
              <input
                className="form-control mb-3"
                placeholder="Email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="input-group mb-3">
                <input
                    className="form-control"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                    setShowPassword(!showPassword)
                    }
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
                </div>

              <button className="btn btn-success w-100">
                Login
              </button>
            </form>

            {msg && (
              <p className="text-danger mt-3">{msg}</p>
            )}

            <p className="mt-3">
              New user? <Link to="/register">Register</Link>
            </p>

          </div>
        </div>

        {/* Right */}
        <div className="col-md-6 d-none d-md-flex bg-success text-white align-items-center justify-content-center">
          <div className="text-center px-5">
            <h2 className="fw-bold">
              Smart Sustainable Packaging
            </h2>

            <p className="mt-3">
              Reduce waste, compare materials,
              optimize eco decisions using AI.
            </p>

            <img
              src="/image.jpeg"
              className="img-fluid rounded shadow"
              style={{maxHeight: "80vh"}}
              alt="eco"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
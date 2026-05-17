import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
        const res = await axios.post(
        "http://127.0.0.1:8000/register",
        {
            username,
            email,
            password
        }
        );

        if (
        res.data.message !==
        "Registration successful"
        ) {
        setMsg(res.data.message);
        return;
        }

        navigate("/login");

    } catch {
        setMsg("Registration failed");
    }
    };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">

        {/* Left Side */}
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-white">
          <div style={{ width: "420px" }}>

            <h1 className="fw-bold text-success">
              EcoPackAI
            </h1>

            <p className="text-muted mb-4">
              Create your account and start using AI-powered sustainable packaging recommendations.
            </p>

            <form onSubmit={handleRegister}>
              <input
                className="form-control mb-3"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
              />

              <input
                className="form-control mb-3"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
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
                Register
              </button>
            </form>

            {msg && (
              <p className="text-danger mt-3">
                {msg}
              </p>
            )}

            <p className="mt-3">
              Already have an account?{" "}
              <Link to="/login">
                Login
              </Link>
            </p>

          </div>
        </div>

        {/* Right Side */}
        <div className="col-md-6 d-none d-md-flex bg-success text-white align-items-center justify-content-center">
          <div className="text-center px-5">

            <h2 className="fw-bold">
              Join the Sustainable Future
            </h2>

            <p className="mt-3">
              Discover smarter packaging materials,
              reduce carbon impact, and make eco-conscious choices.
            </p>

            <img
              src="/image.jpeg"
              alt="eco"
              className="img-fluid rounded shadow"
              style={{maxHeight: "80vh"}}
            />

          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;
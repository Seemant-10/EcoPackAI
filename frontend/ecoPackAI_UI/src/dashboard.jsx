import { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend
} from "recharts";

function Dashboard() {
  const [data, setData] = useState(null);
  const pieData = data?.top_products?.map((item, index) => {
  const colors = [
    "#198754",
    "#20c997",
    "#0d6efd",
    "#ffc107",
    "#dc3545",
    "#6f42c1"
  ];

  return {
    ...item,
    fill: colors[index % colors.length]
  };
});

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/analytics")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-5">
        <div className="container py-5">
        <h1 className="text-success fw-bold mb-4">
            EcoPackAI Analytics Dashboard
        </h1>
        <div className="mb-3">
            <a
              href="/"
              className="btn btn-success btn-lg mt-2"
              >
              Home
            </a>
          </div>
        {/* KPI Cards */}
        <div className="row g-4 mb-5">
            <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
                <h6>Total Recommendations</h6>
                <h3>{data.total_predictions}</h3>
            </div>
            </div>

            <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
                <h6>Avg Cost</h6>
                <h3>${data.avg_cost}</h3>
            </div>
            </div>

            <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
                <h6>Avg CO₂</h6>
                <h3>{data.avg_co2}</h3>
            </div>
            </div>

            <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
                <h6>Avg Score</h6>
                <h3>{data.avg_score}%</h3>
            </div>
            </div>
        </div>

        {/* Chart Area */}
        <div className="row g-4 mb-5">

            {/* Bar Chart */}
            <div className="col-md-7">
                <div className="card shadow-sm p-4">
                <h5 className="text-success mb-3">Top Materials Usage</h5>

                <ResponsiveContainer width="100%" height={310}>
                    <BarChart data={data.top_materials}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#198754" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="col-md-5">
                <div className="card shadow-sm p-4">
                <h5 className="text-success mb-4">Product Search Share</h5>

                <ResponsiveContainer width="100%" height={304}>
                    <PieChart>
                    <Pie
                        data={pieData}
                        dataKey="count"
                        nameKey="name"
                        outerRadius={100}
                        label
                    />

                    <Tooltip />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </div>

            </div>

        {/* Top Lists */}
        <div className="row g-4">

            <div className="col-md-6">
            <div className="card shadow-sm p-4">
                <h5 className="text-success mb-3">Top Materials</h5>

                {data.top_materials.map((item, index) => (
                <div key={index} className="d-flex justify-content-between border-bottom py-2">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                </div>
                ))}
            </div>
            </div>

            <div className="col-md-6">
            <div className="card shadow-sm p-4">
                <h5 className="text-success mb-3">Top Products</h5>

                {data.top_products.map((item, index) => (
                <div key={index} className="d-flex justify-content-between border-bottom py-2">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                </div>
                ))}
            </div>
            </div>

        </div>
        </div>
    </div>
  );
}

export default Dashboard;
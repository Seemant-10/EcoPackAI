# 🌿 EcoPackAI : AI Powered Sustainable Packaging Recommendation System

> A machine learning powered web application that recommends the most sustainable and cost-effective packaging materials for any product type.

---

## 📌 Project Overview

EcoPackAI helps businesses and individuals make smarter, greener packaging decisions. Given a product type, required strength, and weight capacity, the system uses trained ML models to predict cost and CO₂ emissions for available materials, then ranks them using a combined sustainability and compatibility score.

The system covers **70 product types** across **12 industries** and evaluates **19 packaging materials** — scoring each based on biodegradability, recyclability, carbon footprint, and physical compatibility.

---

## ✨ Features

- 🔍 **Fuzzy product matching** — handles typos and partial inputs using RapidFuzz

- 🤖 **ML-based predictions** — Random Forest for cost, XGBoost for CO₂ emissions

- 🌱 **Sustainability scoring** — weighted ranking based on CO₂, biodegradability, and recyclability

- ⚖️ **Compatibility scoring** — matches materials to user's strength and weight requirements

- 🏆 **Top 3 recommendations** — ranked by a combined final score

- 🕘 **Search history sidebar** — shows last 8 searches with top material, click to reload into form

- 📥 **Report download** — export current results as PDF or CSV

- 🗄️ **Prediction logging** — every recommendation is stored in a PostgreSQL database

- 🖥️ **Clean React frontend** — form-based UI with visual progress bars and sidebar layout

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Bootstrap 5, Axios |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (via pgAdmin 4) |
| ORM | SQLAlchemy |
| ML Models | Random Forest (cost), XGBoost (CO₂) |
| Fuzzy Matching | RapidFuzz |
| Model Serialization | Joblib |
| Data Processing | Pandas, NumPy, Scikit-learn |

---

## 📁 Project Structure

```
EcoPackAI/
│
├── backend/
│   ├── main.py                   # FastAPI app & recommendation endpoint
│   ├── ranking.py                # Sustainability + compatibility scoring logic
│   ├── models.py                 # SQLAlchemy table definitions
│   ├── database.py               # PostgreSQL connection setup
│   └── schema.py                 # Pydantic request schema
│
├── frontend/
│   └── ecoPackAI_UI/
│       ├── src/
│       │   └── App.jsx           # React UI (form, sidebar, results, download)
│       ├── public/
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
│
├── trained_models/
│   ├── cost_model.pkl
│   ├── co2_model.pkl
│   ├── cost_feature_columns.pkl
│   └── co2_feature_columns.pkl
│
├── dataset/
│   ├── EcoPackAI_Final_7.csv     # Master dataset (19,600 rows)
│   └── ecoPackAI_db.csv          # DB-ready version (for pgAdmin import)
│
└── main.ipynb                    # Model training notebook
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- pgAdmin 4

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd EcoPackAI
```

### 2. Backend Setup

```bash
cd backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas numpy scikit-learn xgboost joblib rapidfuzz
```

Update the database URL in `database.py`:

```python
DATABASE_URL = "postgresql://<username>:<password>@localhost/ecoPackAI"
```

### 3. Database Setup

Create the database in pgAdmin 4:

```sql
CREATE DATABASE "ecoPackAI";
```

Then create the tables:

```bash
python -c "from database import engine; from models import Base; Base.metadata.create_all(engine)"
```

Import the dataset into the `materials` table via pgAdmin 4:

- Right-click `materials` table → **Import/Export Data**
- Select `dataset/ecoPackAI_db.csv`
- Go to the **Columns** tab and **uncheck `material_id`** (auto-generated)
- Click **OK**

### 4. Train the Models

Open and run all cells in `main.ipynb`. This will:

- Train the Random Forest (cost) and XGBoost (CO₂) models
- Save `.pkl` files to `trained_models/`
- Save the processed DB CSV to `dataset/`

### 5. Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

### 6. Frontend Setup

```bash
cd frontend/ecoPackAI_UI
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

### `GET /`

Health check.

**Response:**

```json
{ "message": "EcoPackAI backend running" }
```

---

### `POST /recommend-material`

Returns top 3 recommended packaging materials for a given product.

**Request Body:**

```json
{
  "product_type": "Water Bottle",
  "strength": 7,
  "weight_capacity": 1.5
}
```

**Response:**

```json
{
  "results": [
    {
      "Material_Type": "Aluminum",
      "predicted_cost": 2.14,
      "predicted_co2": 1.87,
      "final_score": 0.82
    }
  ],
  "message": "Recommendations generated successfully"
}
```

**Fields:**

| Field | Type | Description |
|---|---|---|
| `product_type` | string | Name of the product (fuzzy matched) |
| `strength` | int | Required strength on a scale of 1–10 |
| `weight_capacity` | float | Required weight capacity in kg |

---

## 📊 Dataset Info

| Property | Value |
|---|---|
| Total Rows | 19,600 |
| Product Types | 70 |
| Industries | 12 |
| Materials | 19 |
| Materials per Product | 5 (every product) |

**Industries covered:** Food & Beverage, Cosmetics, Personal Care, Electronics, Logistics, Pharmaceuticals, Chemicals, Agriculture, Retail, Healthcare, Household, Pet Care

**Materials included:** Aluminum, Bioplastic (PLA), Recycled Plastic, PP Plastic, Corrugated Cardboard, Kraft Paper, Glass, Tempered Glass, Bamboo, Jute, Mushroom Packaging, Foam, Steel, Wood, Molded Pulp, Bagasse Fiber, HDPE Plastic, PET Plastic, Cardboard

Each row contains: `Material_Type`, `Product_Type`, `Industry`, `Strength (1-10)`, `Weight Capacity (kg)`, `Biodegradability Score (1-10)`, `Recyclability (%)`, `Cost (USD)`, `CO2 Emission (kg CO2/kg)`

---

## 🚀 Future Improvements

- [ ] Add user authentication and saved recommendation history across sessions
- [ ] Expand dataset with real-world supplier pricing data
- [ ] Add a comparison view to visualize materials side by side
- [ ] Support bulk product recommendations via CSV upload
- [ ] Deploy backend on Railway / Render and frontend on Vercel
- [ ] Add region-based recommendations (material availability varies by country)
- [ ] Integrate a carbon offset calculator based on predicted CO₂

---

## 👤 Author

**Seemant**

College / University Project

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License — free to use, modify, and distribute with attribution.
```

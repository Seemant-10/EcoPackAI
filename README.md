# 🌿 EcoPackAI : AI Powered Sustainable Packaging Recommendation System

> A machine learning powered web application that recommends the most sustainable and cost-effective packaging materials for any product type.

---

## 📌 Project Overview

EcoPackAI helps businesses and individuals make smarter, greener packaging decisions. Given a product type, required strength, and weight capacity, the system uses trained ML models to predict cost and CO₂ emissions for available materials, then ranks them using a combined sustainability and compatibility score.

The system covers **70 product types** across **12 industries** and evaluates **19 packaging materials** — scoring each based on biodegradability, recyclability, carbon footprint, and physical compatibility.

---

## ✨ Features

- 🔍 **Fuzzy product matching** — handles typos and partial inputs using RapidFuzz

- 🤖 **ML-based predictions** — Random Forest for cost prediction and XGBoost for CO₂ emission prediction

- 🌱 **Sustainability scoring** — weighted ranking based on CO₂ emissions, biodegradability, and recyclability

- ⚖️ **Compatibility scoring** — matches packaging materials to user strength and weight requirements

- 🧠 **Explainable AI (SHAP)** — displays top factors influencing predicted cost and CO₂ emissions

- 🏆 **Top 3 recommendations** — ranked by a combined sustainability + compatibility score

- 📊 **Analytics dashboard** — visual insights including top materials, product trends, average cost, CO₂, and sustainability score

- 🔐 **JWT authentication system** — secure login and registration with hashed passwords using Passlib bcrypt

- 👤 **Protected routes** — authenticated users only can access recommendations and analytics

- 🕘 **Search history sidebar** — stores and reloads last 8 searches per user

- 📥 **Report download** — export recommendation reports as PDF or CSV

- 📈 **Interactive charts** — Bar charts, radar charts, pie charts, and comparison visualizations using Recharts

- 🗄️ **Prediction logging** — every recommendation is stored in PostgreSQL for analytics tracking

- 🖥️ **Modern React frontend** — responsive UI with dashboards, progress indicators, dropdown profile menu, and visual scoring system

- 🌐 **REST API architecture** — FastAPI backend with modular endpoints and SQLAlchemy ORM

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Bootstrap 5, Axios |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (via pgAdmin 4) |
| ORM | SQLAlchemy |
| ML Models | Random Forest (Cost), XGBoost (CO₂) |
| Explainable AI | SHAP |
| Authentication | JWT Tokens, Passlib bcrypt |
| Visualization | Recharts, html2canvas, jsPDF |
| Fuzzy Matching | RapidFuzz |
| Model Serialization | Joblib |
| Data Processing | Pandas, NumPy, Scikit-learn |

---

## 📁 Project Structure

```text
EcoPackAI/
│
├── backend/
│   ├── main.py                   # FastAPI app, authentication & recommendation endpoints
│   ├── ranking.py                # Sustainability + compatibility scoring logic
│   ├── models.py                 # SQLAlchemy database models
│   ├── database.py               # PostgreSQL connection setup
│   └── schema.py                 # Pydantic request schemas
│
├── frontend/
│   └── ecoPackAI_UI/
│       ├── src/
│       │   ├── App.jsx           # Recommendation interface & SHAP explanations
│       │   ├── Dashboard.jsx     # Analytics dashboard & charts
│       │   ├── Login.jsx         # User login page
│       │   ├── Register.jsx      # User registration page
│       │   └── main.jsx          # Routing & protected routes
│       │
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
│   ├── EcoPackAI_Final_7.csv
│   └── ecoPackAI_db.csv
│
└── main.ipynb                    # ML model training notebook
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

**Industries covered:** Food & Beverage, Cosmetics, Personal Care, Electronics, Logistics, Pharmaceuticals, Chemicals, Agriculture, Retail, Healthcare, Household, Pet Care

**Materials included:** Aluminum, Bioplastic (PLA), Recycled Plastic, PP Plastic, Corrugated Cardboard, Kraft Paper, Glass, Tempered Glass, Bamboo, Jute, Mushroom Packaging, Foam, Steel, Wood, Molded Pulp, Bagasse Fiber, HDPE Plastic, PET Plastic, Cardboard

Each row contains: `Material_Type`, `Product_Type`, `Industry`, `Strength (1-10)`, `Weight Capacity (kg)`, `Biodegradability Score (1-10)`, `Recyclability (%)`, `Cost (USD)`, `CO2 Emission (kg CO2/kg)`

---

## 🧠 Explainable AI (SHAP)

EcoPackAI integrates SHAP (SHapley Additive exPlanations) to improve transparency and interpretability of ML predictions.

For each recommended material, the system displays:

- Cost impact factors
- CO₂ impact factors
- Positive and negative feature contributions
- Feature influence magnitude

This allows users to understand WHY a particular material was recommended instead of receiving black-box predictions.

Example SHAP insights:

- Higher recyclability improved sustainability score
- Lower CO₂ emissions reduced environmental impact
- Better strength compatibility increased recommendation ranking

---

## 🚀 Future Improvements

- [ ] Add forgot-password email recovery system
- [ ] Add user profile customization & saved preferences
- [ ] Improve ML accuracy using CatBoost and feature engineering
- [ ] Add NLP-based product understanding
- [ ] Expand dataset with real-world supplier pricing data
- [ ] Add bulk product recommendation via CSV upload
- [ ] Add carbon footprint forecasting
- [ ] Deploy backend on Railway/Render and frontend on Vercel
- [ ] Add region-based packaging recommendations
- [ ] Integrate live sustainability APIs

---

## 🔒 Security Features

- Passwords securely hashed using Passlib bcrypt
- JWT-based authentication system
- Protected API routes
- Secure user-specific analytics access
- Session-based frontend route protection

---

## 👤 Author

**Seemant**

---

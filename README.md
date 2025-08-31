# CLAIRE AI - Enterprise MMM Platform

**CLAIRE AI** is an autonomous AI-powered Marketing Mix Modeling (MMM) platform specifically designed for pharmaceutical and CPG industries. Built with Orbit-ML for time-varying coefficient modeling, FastAPI for scalable APIs, and comprehensive optimization capabilities.

## 🚀 Key Features

### **🤖 Autonomous AI Agent**
- **Prompt-driven operation** for natural language interaction
- **End-to-end pipeline** from data ingestion to optimization
- **Pharma-specific safeguards** with elasticity norms and compliance checks
- **Automatic model versioning** with MLflow integration

### **📊 Advanced Analytics**
- **Orbit-ML Integration** with DLT/KTR models for time-varying coefficients
- **Bayesian priors** for pharmaceutical elasticities
- **Multi-objective optimization** (TMB/TSV scenarios)
- **Real-time insights** with bilingual support (EN/RU)

### **🏗️ Enterprise Architecture**
- **FastAPI backend** with async/await support
- **Supabase integration** for real-time database
- **Background task processing** for model retraining
- **Comprehensive logging** and audit trails

## 📁 Project Structure

```
claire-ai/
├── claire_ai_agent.py      # Core AI agent with Orbit-ML integration
├── claire_ai_api.py        # FastAPI application with endpoints
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── .env.example           # Environment variables template
└── examples/
    ├── sample_data.csv    # Sample pharmaceutical data
    └── api_examples.py    # API usage examples
```

## 🛠️ Installation

### Prerequisites
- Python 3.11+
- PostgreSQL (for Supabase)
- MLflow server (optional, for model versioning)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd claire-ai
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start the API server**
```bash
python claire_ai_api.py
```

## 🚀 Quick Start

### 1. Basic Agent Usage

```python
from claire_ai_agent import PharmaMMMAgent

# Create agent
agent = PharmaMMMAgent(project_id=123)

# Process natural language prompt
result = agent.run("Build model and optimize budget of 1000000")
print(result)
```

### 2. API Usage

```python
import requests

# Train model
response = requests.post("http://localhost:8000/model/train", json={
    "project_id": 123,
    "model_type": "DLT",
    "data_path": "sample_data.csv"
})

# Run optimization
response = requests.post("http://localhost:8000/optimize/scenario", json={
    "project_id": 123,
    "scenario_type": "tmb",
    "total_budget": 1000000
})

# Generate insights
response = requests.post("http://localhost:8000/insights/generate", json={
    "project_id": 123,
    "language": "en"
})
```

### 3. Natural Language Processing

```python
# Process natural language prompt
response = requests.post("http://localhost:8000/agent/process", json={
    "project_id": 123,
    "prompt": "Build model and optimize budget of 1000000 for digital channels"
})
```

## 📊 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/model/train` | POST | Train new MMM model |
| `/optimize/scenario` | POST | Run budget optimization |
| `/insights/generate` | POST | Generate insights and recommendations |
| `/agent/process` | POST | Process natural language prompts |

### Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/{id}/status` | GET | Get project status |
| `/projects/{id}` | DELETE | Clear project cache |
| `/model/retrain` | POST | Background model retraining |
| `/health` | GET | Health check |

## 🏗️ Architecture

### **Core Components**

1. **PharmaMMMAgent**: Autonomous AI agent with Orbit-ML integration
2. **UtilityEngine**: Data processing and validation utilities
3. **OptimizerEngine**: Budget optimization and scenario planning
4. **FastAPI Application**: RESTful API with async support

### **Data Flow**

```
Data Source → Validation → Cleaning → Orbit-ML Model → Optimization → Insights
     ↓              ↓           ↓           ↓              ↓           ↓
  Supabase    Pharma Rules  Adstock    DLT/KTR      TMB/TSV    Bilingual
```

### **Model Architecture**

- **Orbit-ML DLT/KTR**: Time-varying coefficient models
- **Bayesian Priors**: Pharmaceutical elasticity constraints
- **Adstock Modeling**: Decay rate analysis
- **Seasonal Decomposition**: Trend and seasonal components

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_URL=postgresql://user:pass@localhost:5432/claire_ai

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
```

### Model Configuration

```python
from claire_ai_agent import ModelConfig, ModelType

config = ModelConfig(
    model_type=ModelType.DLT,
    seasonality=12,
    regressor_col=['digital_spend', 'f2f_spend', 'email_spend']
)
```

## 📈 Usage Examples

### 1. Training a Model

```python
# Via API
import requests

response = requests.post("http://localhost:8000/model/train", json={
    "project_id": 123,
    "model_type": "DLT",
    "priors": {
        "regressor_col": ["digital_spend", "f2f_spend"]
    }
})

print(response.json())
```

### 2. Budget Optimization

```python
# Total Media Budget (TMB) optimization
response = requests.post("http://localhost:8000/optimize/scenario", json={
    "project_id": 123,
    "scenario_type": "tmb",
    "total_budget": 1000000,
    "channel_constraints": {
        "digital_spend": [100000, 500000],
        "f2f_spend": [200000, 600000]
    }
})
```

### 3. Generating Insights

```python
# Bilingual insights
response = requests.post("http://localhost:8000/insights/generate", json={
    "project_id": 123,
    "analysis_type": "comprehensive",
    "language": "ru"  # Russian
})
```

## 🔒 Security & Compliance

### **Pharma-Specific Safeguards**

- **Data Leakage Prevention**: Future data detection
- **Elasticity Norms**: Industry-standard constraints
- **Audit Trails**: Comprehensive logging
- **Compliance Checks**: Regulatory validation

### **Business Rules**

```python
elasticity_norms = {
    'sales_force': (0.02, 0.15),
    'digital': (0.01, 0.08),
    'email': (0.04, 0.25),
    'f2f': (0.03, 0.12)
}
```

## 🧪 Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/

# Run with coverage
pytest --cov=claire_ai tests/
```

### Example Test

```python
import pytest
from claire_ai_agent import PharmaMMMAgent

def test_agent_initialization():
    agent = PharmaMMMAgent(project_id=123)
    assert agent.project_id == 123
    assert agent.data is None
    assert agent.model is None

def test_data_validation():
    agent = PharmaMMMAgent(project_id=123)
    agent.connect_to_data_source()
    validation = agent.validate_data()
    assert 'valid' in validation
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "claire_ai_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Considerations

1. **Database**: Use Supabase or PostgreSQL with connection pooling
2. **Caching**: Implement Redis for agent caching
3. **Monitoring**: Add Prometheus/Grafana for metrics
4. **Security**: Implement JWT authentication
5. **Scaling**: Use Kubernetes for horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] **Advanced S-curve modeling**
- [ ] **Multi-regional optimization**
- [ ] **Real-time data streaming**
- [ ] **Advanced visualization dashboard**
- [ ] **Machine learning model explainability**
- [ ] **Integration with external data sources**

---

**CLAIRE AI** - Transforming pharmaceutical analytics with autonomous AI-powered insights.

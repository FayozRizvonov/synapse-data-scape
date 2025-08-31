# claire_ai_api.py: FastAPI Integration for CLAIRE AI MMM Agent
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime
import asyncio
from claire_ai_agent import PharmaMMMAgent, ModelConfig, OptimizationConfig, ModelType, ScenarioType

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="CLAIRE AI MMM Agent",
    description="Autonomous AI Agent for Pharmaceutical Marketing Mix Modeling",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class ModelRequest(BaseModel):
    project_id: int
    model_type: str = 'DLT'  # 'DLT' or 'KTR'
    data_path: Optional[str] = None
    priors: Optional[Dict[str, Any]] = None

class OptimizationRequest(BaseModel):
    project_id: int
    scenario_type: str  # 'tmb' or 'tsv'
    total_budget: Optional[float] = None
    target_sales: Optional[float] = None
    channel_constraints: Optional[Dict[str, List[float]]] = None
    data_path: Optional[str] = None

class InsightRequest(BaseModel):
    project_id: int
    analysis_type: str = 'comprehensive'  # 'contribution', 'elasticity', 'roi', 'comprehensive'
    language: str = 'en'  # 'en' or 'ru'
    data_path: Optional[str] = None

class AgentPromptRequest(BaseModel):
    project_id: int
    prompt: str
    data_path: Optional[str] = None

class ResponseModel(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = datetime.now().isoformat()

# Global agent cache (in production, use Redis or database)
agent_cache = {}

def get_or_create_agent(project_id: int, data_path: Optional[str] = None) -> PharmaMMMAgent:
    """Get existing agent or create new one"""
    cache_key = f"{project_id}_{data_path or 'default'}"
    
    if cache_key not in agent_cache:
        agent_cache[cache_key] = PharmaMMMAgent(project_id)
        logger.info(f"Created new agent for project {project_id}")
    
    return agent_cache[cache_key]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CLAIRE AI MMM Agent",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/model/train", response_model=ResponseModel)
async def train_model(request: ModelRequest):
    """Train a new MMM model"""
    try:
        logger.info(f"Training model for project {request.project_id}")
        
        # Get or create agent
        agent = get_or_create_agent(request.project_id, request.data_path)
        
        # Connect to data source
        agent.connect_to_data_source(request.data_path)
        
        # Validate data
        validation = agent.validate_data()
        if not validation['valid']:
            return ResponseModel(
                status="error",
                message=f"Data validation failed: {validation['issues']}",
                data={"validation": validation}
            )
        
        # Clean data
        agent.clean_data()
        
        # Configure model
        model_config = ModelConfig(
            model_type=ModelType(request.model_type.upper()),
            regressor_col=request.priors.get('regressor_col') if request.priors else None
        )
        
        # Fit model
        agent.fit_tvc_model(model_config)
        
        # Validate model
        model_validation = agent.validate_model()
        if not model_validation['valid']:
            return ResponseModel(
                status="warning",
                message="Model built but validation issues found",
                data={
                    "validation": model_validation,
                    "model_type": request.model_type
                }
            )
        
        # Generate outputs
        outputs = agent.generate_outputs()
        
        return ResponseModel(
            status="success",
            message="Model trained and validated successfully",
            data={
                "project_id": request.project_id,
                "model_type": request.model_type,
                "validation": model_validation,
                "outputs": outputs
            }
        )
        
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize/scenario", response_model=ResponseModel)
async def create_optimization_scenario(request: OptimizationRequest):
    """Create and run optimization scenario"""
    try:
        logger.info(f"Running optimization for project {request.project_id}")
        
        # Get or create agent with default data path
        data_path = request.data_path or "examples/sample_data.csv"
        agent = get_or_create_agent(request.project_id, data_path)
        
        # Connect to data source if not already done
        if agent.data is None:
            agent.connect_to_data_source(data_path)
            agent.clean_data()
        
        # Build model if not available
        if agent.model is None:
            model_config = ModelConfig(model_type=ModelType.DLT)
            agent.fit_tvc_model(model_config)
        
        # Convert channel constraints format
        channel_constraints = None
        if request.channel_constraints:
            channel_constraints = {
                channel: (constraints[0], constraints[1]) 
                for channel, constraints in request.channel_constraints.items()
            }
        
        # Configure optimization
        optimization_config = OptimizationConfig(
            scenario_type=ScenarioType(request.scenario_type.lower()),
            total_budget=request.total_budget,
            target_sales=request.target_sales,
            channel_constraints=channel_constraints
        )
        
        # Run optimization
        results = agent.run_optimization(optimization_config)
        
        return ResponseModel(
            status="success",
            message="Optimization completed successfully",
            data={
                "project_id": request.project_id,
                "scenario_type": request.scenario_type,
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Error in optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights/generate", response_model=ResponseModel)
async def generate_insights(request: InsightRequest):
    """Generate insights and recommendations"""
    try:
        logger.info(f"Generating insights for project {request.project_id}")
        
        # Get or create agent
        agent = get_or_create_agent(request.project_id, request.data_path)
        
        # Connect to data source if not already done
        if agent.data is None:
            agent.connect_to_data_source(request.data_path)
            agent.clean_data()
        
        # Build model if not available
        if agent.model is None:
            model_config = ModelConfig(model_type=ModelType.DLT)
            agent.fit_tvc_model(model_config)
        
        # Generate insights
        insights = agent.summarize_insights(request.language)
        
        # Add analysis type specific data
        if request.analysis_type == 'comprehensive':
            outputs = agent.generate_outputs()
            insights['outputs'] = outputs
        
        return ResponseModel(
            status="success",
            message="Insights generated successfully",
            data={
                "project_id": request.project_id,
                "analysis_type": request.analysis_type,
                "language": request.language,
                "insights": insights
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/process", response_model=ResponseModel)
async def process_agent_prompt(request: AgentPromptRequest):
    """Process natural language prompt with the agent"""
    try:
        logger.info(f"Processing prompt for project {request.project_id}: {request.prompt}")
        
        # Get or create agent
        agent = get_or_create_agent(request.project_id, request.data_path)
        
        # Process prompt
        result = agent.run(request.prompt)
        
        return ResponseModel(
            status=result['status'],
            message=result['message'],
            data={
                "project_id": request.project_id,
                "prompt": request.prompt,
                "result": result
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/status")
async def get_project_status(project_id: int):
    """Get status of a project"""
    try:
        # Check if agent exists in cache
        cache_key = f"{project_id}_default"
        if cache_key in agent_cache:
            agent = agent_cache[cache_key]
            return {
                "project_id": project_id,
                "has_data": agent.data is not None,
                "has_model": agent.model is not None,
                "data_shape": agent.data.shape if agent.data is not None else None,
                "model_type": agent.model_config.model_type.value if agent.model_config else None
            }
        else:
            return {
                "project_id": project_id,
                "has_data": False,
                "has_model": False,
                "data_shape": None,
                "model_type": None
            }
    except Exception as e:
        logger.error(f"Error getting project status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/projects/{project_id}")
async def clear_project_cache(project_id: int):
    """Clear project from cache"""
    try:
        # Remove all cache entries for this project
        keys_to_remove = [key for key in agent_cache.keys() if key.startswith(f"{project_id}_")]
        for key in keys_to_remove:
            del agent_cache[key]
        
        return {
            "status": "success",
            "message": f"Cleared cache for project {project_id}",
            "cleared_entries": len(keys_to_remove)
        }
    except Exception as e:
        logger.error(f"Error clearing project cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "CLAIRE AI MMM Agent",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "cache_size": len(agent_cache),
        "endpoints": [
            "/model/train",
            "/optimize/scenario", 
            "/insights/generate",
            "/agent/process",
            "/projects/{project_id}/status"
        ]
    }

# Background task for model retraining
@app.post("/model/retrain")
async def retrain_model_background(
    background_tasks: BackgroundTasks,
    project_id: int,
    data_path: Optional[str] = None
):
    """Retrain model in background"""
    try:
        background_tasks.add_task(retrain_model_task, project_id, data_path)
        return {
            "status": "accepted",
            "message": f"Model retraining started for project {project_id}",
            "project_id": project_id
        }
    except Exception as e:
        logger.error(f"Error starting retrain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def retrain_model_task(project_id: int, data_path: Optional[str] = None):
    """Background task for model retraining"""
    try:
        logger.info(f"Starting background retrain for project {project_id}")
        
        # Clear existing agent
        cache_key = f"{project_id}_{data_path or 'default'}"
        if cache_key in agent_cache:
            del agent_cache[cache_key]
        
        # Create new agent and train
        agent = get_or_create_agent(project_id, data_path)
        agent.connect_to_data_source(data_path)
        agent.clean_data()
        
        model_config = ModelConfig(model_type=ModelType.DLT)
        agent.fit_tvc_model(model_config)
        
        logger.info(f"Background retrain completed for project {project_id}")
        
    except Exception as e:
        logger.error(f"Error in background retrain: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

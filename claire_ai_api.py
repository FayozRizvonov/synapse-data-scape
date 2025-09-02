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
    project_id: str
    model_type: str = 'DLT'  # 'DLT' or 'KTR'
    data_path: Optional[str] = None
    priors: Optional[Dict[str, Any]] = None

class OptimizationRequest(BaseModel):
    project_id: str
    scenario_type: str  # 'tmb' or 'tsv'
    total_budget: Optional[float] = None
    target_sales: Optional[float] = None
    channel_constraints: Optional[Dict[str, List[float]]] = None
    data_path: Optional[str] = None

class SalesForceOptimizationRequest(BaseModel):
    project_id: str
    target_revenue: float
    current_sales_force: int
    external_factors: Optional[Dict[str, bool]] = None
    cost_per_rep: Optional[float] = 150000
    data_path: Optional[str] = None

class InsightRequest(BaseModel):
    project_id: str
    analysis_type: str = 'comprehensive'  # 'contribution', 'elasticity', 'roi', 'comprehensive'
    language: str = 'en'  # 'en' or 'ru'
    data_path: Optional[str] = None

class AgentPromptRequest(BaseModel):
    project_id: str
    prompt: str
    data_path: Optional[str] = None

class ResponseModel(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = datetime.now().isoformat()

# Global agent cache (in production, use Redis or database)
agent_cache = {}

def get_or_create_agent(project_id: str, data_path: Optional[str] = None) -> PharmaMMMAgent:
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
        
        # Save scenario to Supabase if available
        try:
            from supabase_client import supabase_mmm_client
            if supabase_mmm_client.is_connected():
                scenario_data = {
                    'scenario_name': f'Optimization_{request.scenario_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                    'scenario_type': request.scenario_type,
                    'scenario_config': {
                        'scenario_type': request.scenario_type,
                        'total_budget': request.total_budget,
                        'target_sales': request.target_sales,
                        'channel_constraints': request.channel_constraints
                    },
                    'optimization_results': results,
                    'total_budget': results.get('total_budget'),
                    'expected_sales': results.get('expected_sales'),
                    'roi_metrics': results.get('roi', {}),
                    'allocation_breakdown': results.get('allocation', {})
                }
                
                model_id = getattr(agent, 'saved_model_id', None)
                if model_id:
                    scenario_id = supabase_mmm_client.save_optimization_scenario(
                        request.project_id, model_id, scenario_data
                    )
                    if scenario_id:
                        logger.info(f"Optimization scenario saved to Supabase with ID: {scenario_id}")
                        results['scenario_id'] = scenario_id
        except Exception as e:
            logger.warning(f"Failed to save scenario to Supabase: {e}")
        
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

@app.post("/optimize/sales-force", response_model=ResponseModel)
async def optimize_sales_force(request: SalesForceOptimizationRequest):
    """Run sales force optimization based on MMM model outputs"""
    try:
        logger.info(f"Running sales force optimization for project {request.project_id}")
        
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
        
        # Create sales force optimization config
        from claire_ai_agent import SalesForceOptimizationConfig
        config = SalesForceOptimizationConfig(
            target_revenue=request.target_revenue,
            current_sales_force=request.current_sales_force,
            external_factors=request.external_factors,
            cost_per_rep=request.cost_per_rep
        )
        
        # Run sales force optimization
        results = agent.run_sales_force_optimization(config)
        
        # Save sales force scenario to Supabase if available
        try:
            from supabase_client import supabase_mmm_client
            if supabase_mmm_client.is_connected():
                scenario_data = {
                    'scenario_name': f'SalesForce_{request.target_revenue}M_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                    'target_revenue': request.target_revenue,
                    'current_sales_force': request.current_sales_force,
                    'optimal_sales_force': results.get('optimal_sales_force'),
                    'optimal_range': results.get('optimal_range', []),
                    'projected_revenue': results.get('projected_revenue'),
                    'projected_profit': results.get('projected_profit'),
                    'overall_roi': results.get('overall_roi'),
                    'monthly_forecast': results.get('monthly_forecast', []),
                    'productivity_per_rep': results.get('productivity_per_rep'),
                    'total_cost': results.get('total_cost'),
                    'external_factors': request.external_factors,
                    'model_confidence': results.get('model_confidence'),
                    'scenario_config': {
                        'target_revenue': request.target_revenue,
                        'current_sales_force': request.current_sales_force,
                        'external_factors': request.external_factors,
                        'cost_per_rep': request.cost_per_rep
                    }
                }
                
                model_id = getattr(agent, 'saved_model_id', None)
                if model_id:
                    scenario_id = supabase_mmm_client.save_sales_force_scenario(
                        request.project_id, model_id, scenario_data
                    )
                    if scenario_id:
                        logger.info(f"Sales force scenario saved to Supabase with ID: {scenario_id}")
                        results['scenario_id'] = scenario_id
        except Exception as e:
            logger.warning(f"Failed to save sales force scenario to Supabase: {e}")
        
        return ResponseModel(
            status="success",
            message="Sales force optimization completed successfully",
            data={
                "project_id": request.project_id,
                "scenario_type": "sales_force_optimization",
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Error in sales force optimization: {e}")
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
async def get_project_status(project_id: str):
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
async def clear_project_cache(project_id: str):
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
            "/optimize/sales-force",
            "/insights/generate",
            "/agent/process",
            "/projects/{project_id}/status",
            "/models/{project_id}/latest",
            "/scenarios/{project_id}/optimization",
            "/scenarios/{project_id}/sales-force",
            "/models/{model_id}/approve"
        ]
    }

# Background task for model retraining
@app.post("/model/retrain")
async def retrain_model_background(
    background_tasks: BackgroundTasks,
    project_id: str,
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

async def retrain_model_task(project_id: str, data_path: Optional[str] = None):
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

@app.get("/models/{project_id}/latest", response_model=ResponseModel)
async def get_latest_approved_model(project_id: str):
    """Get the latest approved model for a project"""
    try:
        from supabase_client import supabase_mmm_client
        if not supabase_mmm_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not connected")
        
        model = supabase_mmm_client.get_latest_approved_model(project_id)
        
        if not model:
            raise HTTPException(status_code=404, detail="No approved model found for this project")
        
        return ResponseModel(
            status="success",
            message="Latest approved model retrieved successfully",
            data=model
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving latest approved model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scenarios/{project_id}/optimization", response_model=ResponseModel)
async def get_optimization_scenarios(project_id: str, scenario_type: Optional[str] = None):
    """Get approved optimization scenarios for a project"""
    try:
        from supabase_client import supabase_mmm_client
        if not supabase_mmm_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not connected")
        
        scenarios = supabase_mmm_client.get_approved_scenarios(project_id, scenario_type)
        
        return ResponseModel(
            status="success",
            message=f"Retrieved {len(scenarios)} optimization scenarios",
            data={"scenarios": scenarios}
        )
        
    except Exception as e:
        logger.error(f"Error retrieving optimization scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scenarios/{project_id}/sales-force", response_model=ResponseModel)
async def get_sales_force_scenarios(project_id: str):
    """Get approved sales force scenarios for a project"""
    try:
        from supabase_client import supabase_mmm_client
        if not supabase_mmm_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not connected")
        
        scenarios = supabase_mmm_client.get_approved_sales_force_scenarios(project_id)
        
        return ResponseModel(
            status="success",
            message=f"Retrieved {len(scenarios)} sales force scenarios",
            data={"scenarios": scenarios}
        )
        
    except Exception as e:
        logger.error(f"Error retrieving sales force scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/models/{model_id}/approve", response_model=ResponseModel)
async def approve_model(model_id: str, approval_notes: Optional[str] = None):
    """Approve a model for use in scenarios"""
    try:
        from supabase_client import supabase_mmm_client
        if not supabase_mmm_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not connected")
        
        # Note: In a real implementation, you'd get the user_id from authentication
        user_id = "admin"  # Placeholder
        
        success = supabase_mmm_client.approve_model(model_id, user_id, approval_notes)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to approve model")
        
        return ResponseModel(
            status="success",
            message="Model approved successfully",
            data={"model_id": model_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

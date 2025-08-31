# api_examples.py: Comprehensive API Usage Examples for CLAIRE AI
import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
PROJECT_ID = 123
SAMPLE_DATA_PATH = "examples/sample_data.csv"

def print_response(response: requests.Response, title: str = "Response"):
    """Pretty print API response"""
    print(f"\n{'='*50}")
    print(f"{title}")
    print(f"{'='*50}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2, default=str))

def test_health_check():
    """Test health check endpoint"""
    print("\n🔍 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "Health Check")

def test_model_training():
    """Test model training endpoint"""
    print("\n🤖 Testing Model Training...")
    
    payload = {
        "project_id": PROJECT_ID,
        "model_type": "DLT",
        "data_path": SAMPLE_DATA_PATH,
        "priors": {
            "regressor_col": ["digital_spend", "f2f_spend", "email_spend"]
        }
    }
    
    response = requests.post(f"{BASE_URL}/model/train", json=payload)
    print_response(response, "Model Training")
    return response.json()

def test_optimization_scenario():
    """Test optimization scenario endpoint"""
    print("\n📊 Testing Optimization Scenario...")
    
    payload = {
        "project_id": PROJECT_ID,
        "scenario_type": "tmb",  # Total Media Budget
        "total_budget": 1000000,
        "channel_constraints": {
            "digital_spend": [100000, 500000],
            "f2f_spend": [200000, 600000],
            "email_spend": [50000, 200000]
        },
        "data_path": SAMPLE_DATA_PATH
    }
    
    response = requests.post(f"{BASE_URL}/optimize/scenario", json=payload)
    print_response(response, "Optimization Scenario")
    return response.json()

def test_insights_generation():
    """Test insights generation endpoint"""
    print("\n💡 Testing Insights Generation...")
    
    # English insights
    payload_en = {
        "project_id": PROJECT_ID,
        "analysis_type": "comprehensive",
        "language": "en",
        "data_path": SAMPLE_DATA_PATH
    }
    
    response_en = requests.post(f"{BASE_URL}/insights/generate", json=payload_en)
    print_response(response_en, "English Insights")
    
for     return response_en.json()

def test_agent_prompt():
    """Test natural language prompt processing"""
    print("\n🤖 Testing Agent Prompt Processing...")
    
    prompts = [
        "Build model and optimize budget of 1000000",
        "Generate insights",
        "What is the ROI for digital channels?",
        "Show me the top performing channels"
    ]
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n--- Prompt {i}: {prompt} ---")
        
        payload = {
            "project_id": PROJECT_ID,
            "prompt": prompt,
            "data_path": SAMPLE_DATA_PATH
        }
        
        response = requests.post(f"{BASE_URL}/agent/process", json=payload)
        print_response(response, f"Agent Response - Prompt {i}")

def test_project_status():
    """Test project status endpoint"""
    print("\n📋 Testing Project Status...")
    
    response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}/status")
    print_response(response, "Project Status")

def test_tsv_optimization():
    """Test Total Sales Value optimization"""
    print("\n🎯 Testing TSV Optimization...")
    
    payload = {
        "project_id": PROJECT_ID,
        "scenario_type": "tsv",  # Total Sales Value
        "target_sales": 250000,
        "data_path": SAMPLE_DATA_PATH
    }
    
    response = requests.post(f"{BASE_URL}/optimize/scenario", json=payload)
    print_response(response, "TSV Optimization")

def test_model_retraining():
    """Test background model retraining"""
    print("\n🔄 Testing Model Retraining...")
    
    response = requests.post(
        f"{BASE_URL}/model/retrain",
        params={
            "project_id": PROJECT_ID,
            "data_path": SAMPLE_DATA_PATH
        }
    )
    print_response(response, "Model Retraining")
    
    # Wait a bit for background task
    print("\n⏳ Waiting for background task to complete...")
    time.sleep(2)

def test_error_handling():
    """Test error handling scenarios"""
    print("\n⚠️ Testing Error Handling...")
    
    # Test with invalid project ID
    payload = {
        "project_id": 999999,
        "model_type": "DLT"
    }
    
    response = requests.post(f"{BASE_URL}/model/train", json=payload)
    print_response(response, "Error Handling - Invalid Project")

def test_comprehensive_workflow():
    """Test complete workflow from training to optimization"""
    print("\n🔄 Testing Complete Workflow...")
    
    # Step 1: Train model
    print("\n1️⃣ Training Model...")
    train_response = requests.post(f"{BASE_URL}/model/train", json={
        "project_id": PROJECT_ID,
        "model_type": "DLT",
        "data_path": SAMPLE_DATA_PATH
    })
    
    if train_response.status_code == 200:
        print("✅ Model training successful")
        
        # Step 2: Check project status
        print("\n2️⃣ Checking Project Status...")
        status_response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}/status")
        print(f"Project has model: {status_response.json().get('has_model', False)}")
        
        # Step 3: Run optimization
        print("\n3️⃣ Running Optimization...")
        opt_response = requests.post(f"{BASE_URL}/optimize/scenario", json={
            "project_id": PROJECT_ID,
            "scenario_type": "tmb",
            "total_budget": 1000000,
            "data_path": SAMPLE_DATA_PATH
        })
        
        if opt_response.status_code == 200:
            print("✅ Optimization successful")
            
            # Step 4: Generate insights
            print("\n4️⃣ Generating Insights...")
            insights_response = requests.post(f"{BASE_URL}/insights/generate", json={
                "project_id": PROJECT_ID,
                "analysis_type": "comprehensive",
                "language": "en",
                "data_path": SAMPLE_DATA_PATH
            })
            
            if insights_response.status_code == 200:
                print("✅ Insights generation successful")
                print("🎉 Complete workflow successful!")
            else:
                print("❌ Insights generation failed")
        else:
            print("❌ Optimization failed")
    else:
        print("❌ Model training failed")

def test_performance_metrics():
    """Test performance and timing"""
    print("\n⏱️ Testing Performance Metrics...")
    
    start_time = time.time()
    
    # Train model
    response = requests.post(f"{BASE_URL}/model/train", json={
        "project_id": PROJECT_ID,
        "model_type": "DLT",
        "data_path": SAMPLE_DATA_PATH
    })
    
    end_time = time.time()
    training_time = end_time - start_time
    
    print(f"Model training time: {training_time:.2f} seconds")
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Performance test passed")
    else:
        print("❌ Performance test failed")

def main():
    """Run all API examples"""
    print("🚀 CLAIRE AI API Examples")
    print("=" * 50)
    
    try:
        # Basic health check
        test_health_check()
        
        # Core functionality tests
        test_model_training()
        test_optimization_scenario()
        test_insights_generation()
        test_agent_prompt()
        test_project_status()
        
        # Advanced tests
        test_tsv_optimization()
        test_model_retraining()
        test_error_handling()
        
        # Performance and workflow tests
        test_performance_metrics()
        test_comprehensive_workflow()
        
        print("\n🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()

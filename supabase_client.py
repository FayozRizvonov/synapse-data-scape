# supabase_client.py: Supabase integration for CLAIRE AI MMM
import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from supabase import create_client, Client
from dotenv import load_dotenv
from io import BytesIO
import pandas as pd

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SupabaseMMMClient:
    """Supabase client for MMM model and scenario management"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        # Prefer service role key for server-side writes; fallback to anon for read-only
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            logger.warning("Supabase credentials not found. Database operations will be disabled.")
            self.client = None
        else:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None
    
    def is_connected(self) -> bool:
        """Check if Supabase client is connected"""
        return self.client is not None
    
    # Model Management
    def save_model(self, project_id: str, model_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[str]:
        """Save trained MMM model to database"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Model not saved.")
            return None
        
        try:
            model_record = {
                'project_id': project_id,
                'model_name': model_data.get('model_name', f'MMM_Model_{datetime.now().strftime("%Y%m%d_%H%M%S")}'),
                'model_type': model_data.get('model_type', 'DLT'),
                'model_version': model_data.get('model_version', '1.0.0'),
                'model_config': model_data.get('model_config', {}),
                'model_metrics': model_data.get('model_metrics', {}),
                'detected_channels': model_data.get('detected_channels', {}),
                'data_source': model_data.get('data_source'),
                'created_by': user_id,
                'is_approved': False
            }
            
            result = self.client.table('mmm_models').insert(model_record).execute()
            
            if result.data:
                model_id = result.data[0]['id']
                logger.info(f"Model saved successfully with ID: {model_id}")
                return model_id
            else:
                logger.error("Failed to save model: No data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return None
    
    def save_model_output(self, model_id: str, project_id: str, output_type: str, output_data: Dict[str, Any]) -> bool:
        """Save model output to database"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Model output not saved.")
            return False
        
        try:
            output_record = {
                'model_id': model_id,
                'project_id': project_id,
                'output_type': output_type,
                'output_data': output_data
            }
            
            result = self.client.table('mmm_model_outputs').insert(output_record).execute()
            
            if result.data:
                logger.info(f"Model output saved successfully for type: {output_type}")
                return True
            else:
                logger.error("Failed to save model output: No data returned")
                return False
                
        except Exception as e:
            logger.error(f"Error saving model output: {e}")
            return False
    
    def approve_model(self, model_id: str, user_id: str, approval_notes: Optional[str] = None) -> bool:
        """Approve a model for use in scenarios"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Model approval failed.")
            return False
        
        try:
            # Call the approval function
            result = self.client.rpc('approve_mmm_model', {
                'model_uuid': model_id,
                'approval_notes': approval_notes
            }).execute()
            
            if result.data:
                logger.info(f"Model {model_id} approved successfully")
                return True
            else:
                logger.error("Failed to approve model: No data returned")
                return False
                
        except Exception as e:
            logger.error(f"Error approving model: {e}")
            return False
    
    def get_latest_approved_model(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get the latest approved model for a project"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Cannot retrieve model.")
            return None
        
        try:
            result = self.client.rpc('get_latest_approved_model', {
                'project_id_param': project_id
            }).execute()
            
            if result.data:
                logger.info(f"Retrieved latest approved model for project {project_id}")
                return result.data[0]
            else:
                logger.info(f"No approved model found for project {project_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving latest approved model: {e}")
            return None
    
    # Optimization Scenarios
    def save_optimization_scenario(self, project_id: str, model_id: str, scenario_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[str]:
        """Save optimization scenario to database"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Scenario not saved.")
            return None
        
        try:
            scenario_record = {
                'project_id': project_id,
                'model_id': model_id,
                'scenario_name': scenario_data.get('scenario_name', f'Scenario_{datetime.now().strftime("%Y%m%d_%H%M%S")}'),
                'scenario_type': scenario_data.get('scenario_type', 'tmb'),
                'scenario_config': scenario_data.get('scenario_config', {}),
                'optimization_results': scenario_data.get('optimization_results', {}),
                'total_budget': scenario_data.get('total_budget'),
                'expected_sales': scenario_data.get('expected_sales'),
                'roi_metrics': scenario_data.get('roi_metrics', {}),
                'allocation_breakdown': scenario_data.get('allocation_breakdown', {}),
                'created_by': user_id,
                'is_approved': False
            }
            
            result = self.client.table('optimization_scenarios').insert(scenario_record).execute()
            
            if result.data:
                scenario_id = result.data[0]['id']
                logger.info(f"Optimization scenario saved successfully with ID: {scenario_id}")
                return scenario_id
            else:
                logger.error("Failed to save optimization scenario: No data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error saving optimization scenario: {e}")
            return None
    
    # Sales Force Scenarios
    def save_sales_force_scenario(self, project_id: str, model_id: str, scenario_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[str]:
        """Save sales force optimization scenario to database"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Sales force scenario not saved.")
            return None
        
        try:
            scenario_record = {
                'project_id': project_id,
                'model_id': model_id,
                'scenario_name': scenario_data.get('scenario_name', f'SalesForce_Scenario_{datetime.now().strftime("%Y%m%d_%H%M%S")}'),
                'target_revenue': scenario_data.get('target_revenue'),
                'current_sales_force': scenario_data.get('current_sales_force'),
                'optimal_sales_force': scenario_data.get('optimal_sales_force'),
                'optimal_range': scenario_data.get('optimal_range', []),
                'projected_revenue': scenario_data.get('projected_revenue'),
                'projected_profit': scenario_data.get('projected_profit'),
                'overall_roi': scenario_data.get('overall_roi'),
                'monthly_forecast': scenario_data.get('monthly_forecast', []),
                'productivity_per_rep': scenario_data.get('productivity_per_rep'),
                'total_cost': scenario_data.get('total_cost'),
                'external_factors': scenario_data.get('external_factors', {}),
                'model_confidence': scenario_data.get('model_confidence'),
                'scenario_config': scenario_data.get('scenario_config', {}),
                'created_by': user_id,
                'is_approved': False
            }
            
            result = self.client.table('sales_force_scenarios').insert(scenario_record).execute()
            
            if result.data:
                scenario_id = result.data[0]['id']
                logger.info(f"Sales force scenario saved successfully with ID: {scenario_id}")
                return scenario_id
            else:
                logger.error("Failed to save sales force scenario: No data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error saving sales force scenario: {e}")
            return None
    
    def get_approved_scenarios(self, project_id: str, scenario_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get approved scenarios for a project"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Cannot retrieve scenarios.")
            return []
        
        try:
            query = self.client.table('optimization_scenarios').select('*').eq('project_id', project_id).eq('is_approved', True)
            
            if scenario_type:
                query = query.eq('scenario_type', scenario_type)
            
            result = query.execute()
            
            if result.data:
                logger.info(f"Retrieved {len(result.data)} approved scenarios for project {project_id}")
                return result.data
            else:
                logger.info(f"No approved scenarios found for project {project_id}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving approved scenarios: {e}")
            return []
    
    def get_approved_sales_force_scenarios(self, project_id: str) -> List[Dict[str, Any]]:
        """Get approved sales force scenarios for a project"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Cannot retrieve sales force scenarios.")
            return []
        
        try:
            result = self.client.table('sales_force_scenarios').select('*').eq('project_id', project_id).eq('is_approved', True).execute()
            
            if result.data:
                logger.info(f"Retrieved {len(result.data)} approved sales force scenarios for project {project_id}")
                return result.data
            else:
                logger.info(f"No approved sales force scenarios found for project {project_id}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving approved sales force scenarios: {e}")
            return []

    # UI Key Metrics
    def insert_ui_key_metrics(self, payload: Dict[str, Any]) -> bool:
        if not self.is_connected():
            logger.warning("Supabase not connected. UI key metrics not saved.")
            return False
        try:
            result = self.client.table('mmm_ui_key_metrics').insert(payload).execute()
            if result.data:
                logger.info("UI key metrics snapshot saved")
                return True
            logger.error("Failed to save UI key metrics: No data returned")
            return False
        except Exception as e:
            logger.error(f"Error saving UI key metrics: {e}")
            return False

    # Dataset Loading
    def load_training_dataframe(self, project_id: str, bucket: Optional[str] = None, path: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Load training dataset from Supabase Storage if configured.

        Tries explicit bucket/path; otherwise uses SUPABASE_DATASET_BUCKET and SUPABASE_DATASET_PATH.
        Returns a pandas DataFrame, or None if unavailable.
        """
        if not self.is_connected():
            logger.warning("Supabase not connected. Cannot load dataset.")
            return None
        try:
            bucket_name = bucket or os.getenv('SUPABASE_DATASET_BUCKET')
            object_path = path or os.getenv('SUPABASE_DATASET_PATH')
            if not bucket_name or not object_path:
                logger.info("No dataset bucket/path configured; skipping Supabase dataset load")
                return None
            resp = self.client.storage.from_(bucket_name).download(object_path)
            if not resp:
                logger.error(f"Failed to download dataset from {bucket_name}/{object_path}")
                return None
            bytes_io = BytesIO(resp)
            # Try CSV first; could be extended to parquet based on extension
            try:
                df = pd.read_csv(bytes_io)
                logger.info(f"Loaded dataset from storage: {bucket_name}/{object_path} ({len(df)} rows)")
                return df
            except Exception as e:
                logger.error(f"Error parsing CSV dataset: {e}")
                return None
        except Exception as e:
            logger.error(f"Error loading dataset from Supabase storage: {e}")
            return None
    
    # Scenario Comparisons
    def save_scenario_comparison(self, project_id: str, comparison_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[str]:
        """Save scenario comparison to database"""
        if not self.is_connected():
            logger.warning("Supabase not connected. Comparison not saved.")
            return None
        
        try:
            comparison_record = {
                'project_id': project_id,
                'comparison_name': comparison_data.get('comparison_name', f'Comparison_{datetime.now().strftime("%Y%m%d_%H%M%S")}'),
                'scenario_ids': comparison_data.get('scenario_ids', []),
                'comparison_metrics': comparison_data.get('comparison_metrics', {}),
                'created_by': user_id
            }
            
            result = self.client.table('scenario_comparisons').insert(comparison_record).execute()
            
            if result.data:
                comparison_id = result.data[0]['id']
                logger.info(f"Scenario comparison saved successfully with ID: {comparison_id}")
                return comparison_id
            else:
                logger.error("Failed to save scenario comparison: No data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error saving scenario comparison: {e}")
            return None

# Global instance
supabase_mmm_client = SupabaseMMMClient()

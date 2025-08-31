-- MMM Model Storage and Scenario Management
-- Migration: 20250831143000_mmm_model_storage.sql

-- 1. MMM Models table - stores trained models
CREATE TABLE IF NOT EXISTS public.mmm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'DLT', 'KTR', 'LINEAR'
    model_version VARCHAR(50) NOT NULL,
    model_config JSONB NOT NULL, -- Model configuration parameters
    model_metrics JSONB NOT NULL, -- R², MAPE, coefficients, etc.
    detected_channels JSONB NOT NULL, -- Detected marketing channels
    data_source VARCHAR(500), -- Path to training data
    training_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Model Outputs table - stores model predictions and insights
CREATE TABLE IF NOT EXISTS public.mmm_model_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES public.mmm_models(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL,
    output_type VARCHAR(50) NOT NULL, -- 'predictions', 'insights', 'contributions'
    output_data JSONB NOT NULL, -- Actual output data
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Optimization Scenarios table - stores budget optimization scenarios
CREATE TABLE IF NOT EXISTS public.optimization_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    model_id UUID REFERENCES public.mmm_models(id),
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- 'tmb', 'tsv', 'sales_force'
    scenario_config JSONB NOT NULL, -- Input parameters
    optimization_results JSONB NOT NULL, -- Output results
    total_budget DECIMAL(15,2),
    expected_sales DECIMAL(15,2),
    roi_metrics JSONB,
    allocation_breakdown JSONB,
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales Force Optimization table - stores sales force scenarios
CREATE TABLE IF NOT EXISTS public.sales_force_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    model_id UUID REFERENCES public.mmm_models(id),
    scenario_name VARCHAR(255) NOT NULL,
    target_revenue DECIMAL(15,2) NOT NULL,
    current_sales_force INTEGER NOT NULL,
    optimal_sales_force INTEGER NOT NULL,
    optimal_range INTEGER[] NOT NULL, -- [min, max] range
    projected_revenue DECIMAL(15,2) NOT NULL,
    projected_profit DECIMAL(15,2) NOT NULL,
    overall_roi DECIMAL(10,4) NOT NULL,
    monthly_forecast JSONB NOT NULL, -- 12-month forecast
    productivity_per_rep DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    external_factors JSONB, -- Competitor, recession flags
    model_confidence DECIMAL(5,4) NOT NULL,
    scenario_config JSONB NOT NULL, -- Full input configuration
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scenario Comparisons table - for comparing multiple scenarios
CREATE TABLE IF NOT EXISTS public.scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL,
    comparison_name VARCHAR(255) NOT NULL,
    scenario_ids UUID[] NOT NULL, -- Array of scenario IDs to compare
    comparison_metrics JSONB NOT NULL, -- Comparison results
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Model Approval Workflow table
CREATE TABLE IF NOT EXISTS public.model_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES public.mmm_models(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES auth.users(id),
    approval_status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected'
    approval_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mmm_models_project_id ON public.mmm_models(project_id);
CREATE INDEX IF NOT EXISTS idx_mmm_models_approved ON public.mmm_models(is_approved);
CREATE INDEX IF NOT EXISTS idx_model_outputs_model_id ON public.mmm_model_outputs(model_id);
CREATE INDEX IF NOT EXISTS idx_optimization_scenarios_project_id ON public.optimization_scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_sales_force_scenarios_project_id ON public.sales_force_scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_project_id ON public.scenario_comparisons(project_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.mmm_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmm_model_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_force_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MMM Models
CREATE POLICY "Users can view approved models from their company" ON public.mmm_models
    FOR SELECT USING (
        is_approved = true AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.company_id = project_id
        )
    );

CREATE POLICY "Admins can manage models for their company" ON public.mmm_models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() 
            AND cm.company_id = project_id 
            AND cm.role = 'admin'
        )
    );

-- RLS Policies for Model Outputs
CREATE POLICY "Users can view outputs from approved models" ON public.mmm_model_outputs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mmm_models mm
            JOIN public.company_members cm ON cm.company_id = mm.project_id
            WHERE mm.id = mmm_model_outputs.model_id
            AND mm.is_approved = true
            AND cm.user_id = auth.uid()
        )
    );

-- RLS Policies for Optimization Scenarios
CREATE POLICY "Users can view approved scenarios from their company" ON public.optimization_scenarios
    FOR SELECT USING (
        is_approved = true AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.company_id = project_id
        )
    );

CREATE POLICY "Admins can manage scenarios for their company" ON public.optimization_scenarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() 
            AND cm.company_id = project_id 
            AND cm.role = 'admin'
        )
    );

-- RLS Policies for Sales Force Scenarios
CREATE POLICY "Users can view approved sales force scenarios from their company" ON public.sales_force_scenarios
    FOR SELECT USING (
        is_approved = true AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.company_id = project_id
        )
    );

CREATE POLICY "Admins can manage sales force scenarios for their company" ON public.sales_force_scenarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() 
            AND cm.company_id = project_id 
            AND cm.role = 'admin'
        )
    );

-- RLS Policies for Scenario Comparisons
CREATE POLICY "Users can view comparisons from their company" ON public.scenario_comparisons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.user_id = auth.uid() AND cm.company_id = project_id
        )
    );

-- RLS Policies for Model Approvals
CREATE POLICY "Admins can manage approvals for their company" ON public.model_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mmm_models mm
            JOIN public.company_members cm ON cm.company_id = mm.project_id
            WHERE mm.id = model_approvals.model_id
            AND cm.user_id = auth.uid() 
            AND cm.role = 'admin'
        )
    );

-- Functions for managing model approvals
CREATE OR REPLACE FUNCTION public.approve_mmm_model(
    model_uuid UUID,
    approval_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin for the model's project
    IF NOT EXISTS (
        SELECT 1 FROM public.mmm_models mm
        JOIN public.company_members cm ON cm.company_id = mm.project_id
        WHERE mm.id = model_uuid
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can approve models';
    END IF;

    -- Update model approval status
    UPDATE public.mmm_models 
    SET is_approved = true,
        approved_by = auth.uid(),
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = model_uuid;

    -- Insert approval record
    INSERT INTO public.model_approvals (model_id, approver_id, approval_status, approval_notes)
    VALUES (model_uuid, auth.uid(), 'approved', approval_notes);

    RETURN TRUE;
END;
$$;

-- Function to get latest approved model for a project
CREATE OR REPLACE FUNCTION public.get_latest_approved_model(project_id_param INTEGER)
RETURNS TABLE (
    id UUID,
    model_name VARCHAR(255),
    model_type VARCHAR(50),
    model_version VARCHAR(50),
    model_metrics JSONB,
    detected_channels JSONB,
    training_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT mm.id, mm.model_name, mm.model_type, mm.model_version, 
           mm.model_metrics, mm.detected_channels, mm.training_date
    FROM public.mmm_models mm
    WHERE mm.project_id = project_id_param
    AND mm.is_approved = true
    ORDER BY mm.training_date DESC
    LIMIT 1;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.mmm_models TO authenticated;
GRANT ALL ON public.mmm_model_outputs TO authenticated;
GRANT ALL ON public.optimization_scenarios TO authenticated;
GRANT ALL ON public.sales_force_scenarios TO authenticated;
GRANT ALL ON public.scenario_comparisons TO authenticated;
GRANT ALL ON public.model_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_mmm_model TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_approved_model TO authenticated;

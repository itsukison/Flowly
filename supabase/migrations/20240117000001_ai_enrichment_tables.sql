-- AI Enrichment System Migration
-- Add tables for tracking AI conversations and generated data

-- AI enrichment sessions for tracking conversations
CREATE TABLE ai_enrichment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Conversation state
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_step TEXT NOT NULL DEFAULT 'greeting',
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),

  -- Processing metadata
  records_generated INTEGER DEFAULT 0,
  records_completed INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI generated records with source attribution
CREATE TABLE ai_enrichment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_enrichment_sessions(id) ON DELETE CASCADE,
  record_id UUID REFERENCES records(id) ON DELETE SET NULL,

  -- Enrichment data
  field_name TEXT NOT NULL,
  field_value JSONB NOT NULL,
  data_type TEXT NOT NULL,

  -- Quality and source tracking
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'invalid')),

  -- Agent information
  agent_type TEXT NOT NULL,
  processing_time_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_enrichment_sessions_user_id ON ai_enrichment_sessions(user_id);
CREATE INDEX idx_ai_enrichment_sessions_table_id ON ai_enrichment_sessions(table_id);
CREATE INDEX idx_ai_enrichment_sessions_org_id ON ai_enrichment_sessions(organization_id);
CREATE INDEX idx_ai_enrichment_sessions_status ON ai_enrichment_sessions(status);
CREATE INDEX idx_ai_enrichment_sessions_created_at ON ai_enrichment_sessions(created_at);

CREATE INDEX idx_ai_enrichment_records_session_id ON ai_enrichment_records(session_id);
CREATE INDEX idx_ai_enrichment_records_record_id ON ai_enrichment_records(record_id);
CREATE INDEX idx_ai_enrichment_records_field_name ON ai_enrichment_records(field_name);
CREATE INDEX idx_ai_enrichment_records_agent_type ON ai_enrichment_records(agent_type);

-- Row Level Security Policies
ALTER TABLE ai_enrichment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_records ENABLE ROW LEVEL SECURITY;

-- AI enrichment sessions policies
CREATE POLICY "Users can view own organization AI sessions"
  ON ai_enrichment_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own organization AI sessions"
  ON ai_enrichment_sessions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own organization AI sessions"
  ON ai_enrichment_sessions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- AI enrichment records policies
CREATE POLICY "Users can view records from own organization sessions"
  ON ai_enrichment_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_enrichment_sessions
      WHERE ai_enrichment_sessions.id = ai_enrichment_records.session_id
      AND ai_enrichment_sessions.organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create records for own organization sessions"
  ON ai_enrichment_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_enrichment_sessions
      WHERE ai_enrichment_sessions.id = ai_enrichment_records.session_id
      AND ai_enrichment_sessions.organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_enrichment_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_ai_enrichment_sessions_updated_at_trigger
  BEFORE UPDATE ON ai_enrichment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_enrichment_sessions_updated_at();

-- View for session statistics
CREATE VIEW ai_enrichment_session_stats AS
SELECT
  s.id,
  s.user_id,
  s.table_id,
  s.organization_id,
  s.status,
  COUNT(r.id) as total_records,
  COUNT(CASE WHEN r.validation_status = 'validated' THEN 1 END) as validated_records,
  AVG(r.confidence_score) as avg_confidence_score,
  SUM(r.processing_time_ms) as total_processing_time_ms,
  s.started_at,
  s.completed_at,
  EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) as duration_seconds
FROM ai_enrichment_sessions s
LEFT JOIN ai_enrichment_records r ON s.id = r.session_id
GROUP BY s.id, s.user_id, s.table_id, s.organization_id, s.status, s.started_at, s.completed_at;

-- Add comments for documentation
COMMENT ON TABLE ai_enrichment_sessions IS 'Tracks AI enrichment conversations and user requirements';
COMMENT ON TABLE ai_enrichment_records IS 'Stores AI-generated data with source attribution and quality metrics';
COMMENT ON VIEW ai_enrichment_session_stats IS 'Aggregated statistics for AI enrichment sessions';
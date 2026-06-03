export const up = `
  CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{"urls:read","urls:write"}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);
  CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys (is_active) WHERE is_active = TRUE;
`;

export const down = `
  DROP TABLE IF EXISTS api_keys CASCADE;
`;

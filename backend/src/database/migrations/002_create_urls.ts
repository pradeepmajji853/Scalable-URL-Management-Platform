export const up = `
  CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    custom_alias VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    max_clicks INTEGER,
    click_count INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls (short_code);
  CREATE INDEX IF NOT EXISTS idx_urls_custom_alias ON urls (custom_alias) WHERE custom_alias IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls (user_id);
  CREATE INDEX IF NOT EXISTS idx_urls_user_id_active ON urls (user_id, is_active) WHERE is_deleted = FALSE;
  CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls (expires_at) WHERE expires_at IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_urls_is_deleted ON urls (is_deleted) WHERE is_deleted = FALSE;
`;

export const down = `
  DROP TABLE IF EXISTS urls CASCADE;
`;

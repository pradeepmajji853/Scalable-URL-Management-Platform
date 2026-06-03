export const up = `
  CREATE TABLE IF NOT EXISTS url_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    device_type VARCHAR(50),
    country VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_url_clicks_url_id ON url_clicks (url_id);
  CREATE INDEX IF NOT EXISTS idx_url_clicks_clicked_at ON url_clicks (clicked_at DESC);
  CREATE INDEX IF NOT EXISTS idx_url_clicks_url_id_clicked_at ON url_clicks (url_id, clicked_at DESC);
  CREATE INDEX IF NOT EXISTS idx_url_clicks_country ON url_clicks (country) WHERE country IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_url_clicks_browser ON url_clicks (browser) WHERE browser IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_url_clicks_device_type ON url_clicks (device_type) WHERE device_type IS NOT NULL;
`;

export const down = `
  DROP TABLE IF EXISTS url_clicks CASCADE;
`;

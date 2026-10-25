CREATE TABLE IF NOT EXISTS skyroute.snipers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES skyroute.users (id),
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    match_mode VARCHAR(8) NOT NULL,
    conditions TEXT NOT NULL,
    snapshot_price NUMERIC(12, 2) NOT NULL,
    snapshot_date DATE,
    status VARCHAR(16) NOT NULL,
    last_price NUMERIC(12, 2),
    last_offer_id TEXT,
    last_polled_at TIMESTAMPTZ,
    last_error TEXT,
    triggered_price NUMERIC(12, 2),
    triggered_offer_id TEXT,
    triggered_at TIMESTAMPTZ,
    cheapest_date DATE,
    armed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snipers_user_idx ON skyroute.snipers (user_id);

CREATE INDEX IF NOT EXISTS snipers_armed_poll_idx
    ON skyroute.snipers (last_polled_at)
    WHERE status = 'ARMED';

CREATE TABLE IF NOT EXISTS skyroute.sniper_notifications (
    id UUID PRIMARY KEY,
    sniper_id UUID NOT NULL REFERENCES skyroute.snipers (id),
    user_id UUID NOT NULL REFERENCES skyroute.users (id),
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sniper_notifications_sniper_idx
    ON skyroute.sniper_notifications (sniper_id);

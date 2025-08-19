-- Payment Requests Table for Request-to-Pay Feature
CREATE TABLE IF NOT EXISTS payment_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id VARCHAR NOT NULL REFERENCES users(id),
  recipient_id VARCHAR NOT NULL REFERENCES users(id),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  bill_type VARCHAR(50) NOT NULL CHECK (bill_type IN ('Bus Ticket', 'Groceries', 'Utility Bill', 'Shared Ride', 'Other')),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  transaction_id VARCHAR REFERENCES transactions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_recipient ON payment_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_sender ON payment_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON payment_requests(created_at);

-- Notifications table for push notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

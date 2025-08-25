-- PayPass Database Indexing Strategy
-- Optimized indexes for high-performance queries
-- Database Indexing configuration for performance optimization

-- =============================================================================
-- USER-RELATED INDEXES
-- =============================================================================

-- Primary user lookup index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users USING btree (email);

-- User authentication index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status 
ON users USING btree (email, status) 
WHERE status = 'active';

-- User profile lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone 
ON users USING btree (phone_number);

-- User creation timeline index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
ON users USING btree (created_at DESC);

-- Composite index for user filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_type_created 
ON users USING btree (status, user_type, created_at DESC);

-- =============================================================================
-- PAYMENT-RELATED INDEXES
-- =============================================================================

-- Primary payment lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id 
ON payments USING btree (user_id);

-- Payment status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created 
ON payments USING btree (status, created_at DESC);

-- Transaction reference lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_transaction_ref 
ON payments USING btree (transaction_reference);

-- Payment method analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_method_amount 
ON payments USING btree (payment_method, amount DESC);

-- Date range queries for reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_amount 
ON payments USING btree (created_at DESC, amount DESC);

-- Merchant payment tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_merchant_status 
ON payments USING btree (merchant_id, status, created_at DESC);

-- Failed payment analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_failed 
ON payments USING btree (created_at DESC) 
WHERE status = 'failed';

-- =============================================================================
-- WALLET-RELATED INDEXES
-- =============================================================================

-- Wallet balance lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_currency 
ON wallets USING btree (user_id, currency);

-- Wallet transaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_wallet_id 
ON wallet_transactions USING btree (wallet_id, created_at DESC);

-- Transaction type analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_type_amount 
ON wallet_transactions USING btree (transaction_type, amount DESC, created_at DESC);

-- Wallet activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_status 
ON wallet_transactions USING btree (status, created_at DESC);

-- =============================================================================
-- MERCHANT-RELATED INDEXES
-- =============================================================================

-- Merchant lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_business_name 
ON merchants USING btree (business_name);

-- Merchant verification status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_verification_status 
ON merchants USING btree (verification_status, created_at DESC);

-- Merchant location-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_country_city 
ON merchants USING btree (country, city);

-- Merchant revenue tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchant_payments_revenue 
ON payments USING btree (merchant_id, created_at DESC, amount DESC) 
WHERE status = 'completed';

-- =============================================================================
-- ANALYTICS AND REPORTING INDEXES
-- =============================================================================

-- Daily transaction volume
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_daily_volume 
ON payments USING btree (DATE(created_at), status) 
WHERE status IN ('completed', 'pending');

-- Hourly transaction patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_hourly_patterns 
ON payments USING btree (EXTRACT(hour FROM created_at), created_at DESC);

-- Geographic transaction analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_geographic 
ON payments USING btree (country, city, created_at DESC);

-- Payment method popularity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_payment_methods 
ON payments USING btree (payment_method, created_at DESC, amount);

-- =============================================================================
-- FRAUD DETECTION INDEXES
-- =============================================================================

-- Suspicious activity detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_user_amount_time 
ON payments USING btree (user_id, amount DESC, created_at DESC);

-- IP-based fraud detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_ip_tracking 
ON user_sessions USING btree (ip_address, created_at DESC);

-- Device fingerprinting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_device_tracking 
ON user_sessions USING btree (device_fingerprint, user_id, created_at DESC);

-- Multiple failed attempts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_failed_attempts 
ON payment_attempts USING btree (user_id, status, created_at DESC) 
WHERE status = 'failed';

-- =============================================================================
-- COMPLIANCE AND AUDIT INDEXES
-- =============================================================================

-- AML transaction monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_large_transactions 
ON payments USING btree (amount DESC, created_at DESC) 
WHERE amount >= 10000;

-- Audit trail lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs USING btree (entity_type, entity_id, created_at DESC);

-- Compliance reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_reporting 
ON payments USING btree (created_at DESC, amount DESC, status) 
WHERE status = 'completed';

-- KYC verification tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kyc_verification_status 
ON user_verifications USING btree (verification_type, status, created_at DESC);

-- =============================================================================
-- NOTIFICATION AND COMMUNICATION INDEXES
-- =============================================================================

-- Notification delivery tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_status 
ON notifications USING btree (user_id, status, created_at DESC);

-- Email delivery status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_status 
ON notifications USING btree (notification_type, delivery_status, created_at DESC);

-- Pending notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_pending 
ON notifications USING btree (created_at ASC) 
WHERE delivery_status = 'pending';

-- =============================================================================
-- SESSION AND SECURITY INDEXES
-- =============================================================================

-- Active session tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active 
ON user_sessions USING btree (user_id, is_active, last_activity DESC);

-- Session expiry cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at 
ON user_sessions USING btree (expires_at ASC) 
WHERE is_active = true;

-- Security event tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user 
ON security_events USING btree (user_id, event_type, created_at DESC);

-- =============================================================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- =============================================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_users_email 
ON users USING btree (email) 
WHERE status = 'active' AND deleted_at IS NULL;

-- Recent transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recent_payments 
ON payments USING btree (created_at DESC, amount DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- High-value transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_value_payments 
ON payments USING btree (created_at DESC, user_id) 
WHERE amount > 1000;

-- =============================================================================
-- FUNCTIONAL INDEXES
-- =============================================================================

-- Case-insensitive email lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users USING btree (LOWER(email));

-- Full-text search for merchant names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_name_gin 
ON merchants USING gin (to_tsvector('english', business_name));

-- JSON field indexing (if using JSONB)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_metadata_gin 
-- ON payments USING gin (metadata);

-- =============================================================================
-- MAINTENANCE QUERIES
-- =============================================================================

-- Monitor index usage
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;

-- Find unused indexes
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;

-- Index size monitoring
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes 
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================================================
-- INDEX MAINTENANCE SCHEDULE
-- =============================================================================

-- Daily: REINDEX CONCURRENTLY high-traffic tables
-- Weekly: ANALYZE all tables to update statistics
-- Monthly: Review index usage and remove unused indexes
-- Quarterly: Evaluate new indexing opportunities based on query patterns

COMMIT;

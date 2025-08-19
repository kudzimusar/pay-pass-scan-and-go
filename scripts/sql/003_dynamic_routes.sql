-- Dynamic Route & Drop-off Based Charging System
-- Database Schema for PayPass Enhanced Features

-- Routes Table: Core route definitions
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    start_location_geo POINT,
    end_location_geo POINT,
    is_active BOOLEAN DEFAULT true,
    base_fare_usd DECIMAL(10,2) NOT NULL,
    base_fare_zig DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Logical Stations Table: Predefined stops along routes
CREATE TABLE IF NOT EXISTS stations (
    station_id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    station_geo POINT,
    order_on_route INTEGER NOT NULL,
    fare_multiplier DECIMAL(3,2) DEFAULT 1.0,
    geofence_radius INTEGER DEFAULT 100, -- meters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    INDEX idx_route_order (route_id, order_on_route)
);

-- Dynamic Pricing Rules Table: Time-based fare adjustments
CREATE TABLE IF NOT EXISTS pricing_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    day_of_week ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'ALL') DEFAULT 'ALL',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    fare_adjustment_type ENUM('PERCENTAGE', 'FLAT_ADDITION') DEFAULT 'FLAT_ADDITION',
    fare_adjustment_value_usd DECIMAL(10,2) DEFAULT 0.00,
    fare_adjustment_value_zig DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    INDEX idx_route_time (route_id, start_time, end_time)
);

-- Enhanced Transactions Table: Journey-specific transaction tracking
CREATE TABLE IF NOT EXISTS route_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    route_id VARCHAR(50) NOT NULL,
    station_id VARCHAR(50) NOT NULL,
    conductor_id VARCHAR(50),
    qr_ticket_code VARCHAR(100) UNIQUE NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    peak_surcharge DECIMAL(10,2) DEFAULT 0.00,
    total_fare DECIMAL(10,2) NOT NULL,
    currency ENUM('USD', 'ZIG') NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    boarding_confirmed BOOLEAN DEFAULT false,
    boarding_time TIMESTAMP NULL,
    dropoff_confirmed BOOLEAN DEFAULT false,
    dropoff_time TIMESTAMP NULL,
    actual_dropoff_station VARCHAR(50),
    applied_rules JSON, -- Store which pricing rules were applied
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (station_id) REFERENCES stations(station_id),
    INDEX idx_user_transactions (user_id, created_at),
    INDEX idx_conductor_transactions (conductor_id, created_at),
    INDEX idx_qr_lookup (qr_ticket_code)
);

-- Conductor Sessions Table: Track active conductors and their assignments
CREATE TABLE IF NOT EXISTS conductor_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    conductor_id VARCHAR(50) NOT NULL,
    conductor_name VARCHAR(100) NOT NULL,
    route_id VARCHAR(50) NOT NULL,
    bus_id VARCHAR(50),
    shift_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shift_end TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    current_location POINT,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    INDEX idx_active_conductors (conductor_id, is_active),
    INDEX idx_route_conductors (route_id, is_active)
);

-- Bus GPS Tracking Table: Real-time bus location data
CREATE TABLE IF NOT EXISTS bus_locations (
    location_id VARCHAR(50) PRIMARY KEY,
    bus_id VARCHAR(50) NOT NULL,
    route_id VARCHAR(50) NOT NULL,
    conductor_id VARCHAR(50),
    current_location POINT NOT NULL,
    speed DECIMAL(5,2), -- km/h
    heading DECIMAL(5,2), -- degrees
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    INDEX idx_bus_tracking (bus_id, timestamp),
    INDEX idx_route_tracking (route_id, timestamp)
);

-- Insert Demo Routes
INSERT INTO routes (route_id, route_name, base_fare_usd, base_fare_zig, is_active) VALUES
('HAR-CBD-AVENUE', 'CBD to Avondale', 1.00, 2.50, true),
('HAR-CBD-BORROWDALE', 'CBD to Borrowdale', 1.50, 3.75, true),
('HAR-AVENUE-BORROWDALE', 'Avondale to Borrowdale', 1.25, 3.12, true);

-- Insert Demo Stations for CBD to Avondale Route
INSERT INTO stations (station_id, route_id, station_name, order_on_route, fare_multiplier) VALUES
('CBD-S01', 'HAR-CBD-AVENUE', 'CBD Rank (Start)', 1, 1.0),
('CBD-S02', 'HAR-CBD-AVENUE', 'Simon Muzenda Street', 2, 1.0),
('CBD-S03', 'HAR-CBD-AVENUE', 'Fourth Street', 3, 1.0),
('AVENUE-S01', 'HAR-CBD-AVENUE', 'Five Avenue Shopping Centre', 4, 1.0),
('AVENUE-S02', 'HAR-CBD-AVENUE', 'Avondale Shops (End)', 5, 1.0);

-- Insert Demo Stations for CBD to Borrowdale Route
INSERT INTO stations (station_id, route_id, station_name, order_on_route, fare_multiplier) VALUES
('CBD-B01', 'HAR-CBD-BORROWDALE', 'CBD Rank (Start)', 1, 1.0),
('CBD-B02', 'HAR-CBD-BORROWDALE', 'Samora Machel Avenue', 2, 1.0),
('BORROWDALE-B01', 'HAR-CBD-BORROWDALE', 'Borrowdale Shopping Centre', 3, 1.0),
('BORROWDALE-B02', 'HAR-CBD-BORROWDALE', 'Borrowdale Race Course', 4, 1.0);

-- Insert Demo Pricing Rules
INSERT INTO pricing_rules (rule_id, route_id, rule_name, day_of_week, start_time, end_time, fare_adjustment_type, fare_adjustment_value_usd, fare_adjustment_value_zig, status) VALUES
('PEAK-MORNING-CBD-AVE', 'HAR-CBD-AVENUE', 'Morning Peak Surcharge', 'ALL', '06:00:00', '09:00:00', 'FLAT_ADDITION', 0.50, 1.25, 'ACTIVE'),
('PEAK-EVENING-CBD-AVE', 'HAR-CBD-AVENUE', 'Evening Peak Surcharge', 'ALL', '16:00:00', '19:00:00', 'FLAT_ADDITION', 0.50, 1.25, 'ACTIVE'),
('PEAK-MORNING-CBD-BOR', 'HAR-CBD-BORROWDALE', 'Morning Peak Surcharge', 'ALL', '06:00:00', '09:00:00', 'FLAT_ADDITION', 0.75, 1.87, 'ACTIVE'),
('PEAK-EVENING-CBD-BOR', 'HAR-CBD-BORROWDALE', 'Evening Peak Surcharge', 'ALL', '16:00:00', '19:00:00', 'FLAT_ADDITION', 0.75, 1.87, 'ACTIVE');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);
CREATE INDEX IF NOT EXISTS idx_stations_route ON stations(route_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_route ON pricing_rules(route_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON route_transactions(payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_boarding ON route_transactions(boarding_confirmed, dropoff_confirmed);

-- Create views for common queries
CREATE OR REPLACE VIEW active_routes_with_stations AS
SELECT 
    r.route_id,
    r.route_name,
    r.base_fare_usd,
    r.base_fare_zig,
    COUNT(s.station_id) as station_count,
    GROUP_CONCAT(s.station_name ORDER BY s.order_on_route) as stations
FROM routes r
LEFT JOIN stations s ON r.route_id = s.route_id
WHERE r.is_active = true
GROUP BY r.route_id, r.route_name, r.base_fare_usd, r.base_fare_zig;

CREATE OR REPLACE VIEW current_pricing_rules AS
SELECT 
    pr.*,
    r.route_name
FROM pricing_rules pr
JOIN routes r ON pr.route_id = r.route_id
WHERE pr.status = 'ACTIVE' 
AND r.is_active = true;

-- Function to calculate fare with dynamic pricing
DELIMITER //
CREATE OR REPLACE FUNCTION calculate_dynamic_fare(
    p_route_id VARCHAR(50),
    p_currency ENUM('USD', 'ZIG'),
    p_journey_time TIME
) RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE base_fare DECIMAL(10,2) DEFAULT 0.00;
    DECLARE total_surcharge DECIMAL(10,2) DEFAULT 0.00;
    DECLARE current_day VARCHAR(3);
    
    -- Get current day of week
    SET current_day = UPPER(LEFT(DAYNAME(NOW()), 3));
    
    -- Get base fare
    IF p_currency = 'USD' THEN
        SELECT base_fare_usd INTO base_fare FROM routes WHERE route_id = p_route_id AND is_active = true;
    ELSE
        SELECT base_fare_zig INTO base_fare FROM routes WHERE route_id = p_route_id AND is_active = true;
    END IF;
    
    -- Calculate surcharges
    SELECT COALESCE(SUM(
        CASE 
            WHEN p_currency = 'USD' THEN fare_adjustment_value_usd
            ELSE fare_adjustment_value_zig
        END
    ), 0.00) INTO total_surcharge
    FROM pricing_rules
    WHERE route_id = p_route_id
    AND status = 'ACTIVE'
    AND (day_of_week = 'ALL' OR day_of_week = current_day)
    AND p_journey_time BETWEEN start_time AND end_time;
    
    RETURN base_fare + total_surcharge;
END //
DELIMITER ;

-- Trigger to update transaction timestamps
DELIMITER //
CREATE OR REPLACE TRIGGER update_transaction_timestamp
    BEFORE UPDATE ON route_transactions
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Set boarding time when boarding is confirmed
    IF NEW.boarding_confirmed = true AND OLD.boarding_confirmed = false THEN
        SET NEW.boarding_time = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set dropoff time when dropoff is confirmed
    IF NEW.dropoff_confirmed = true AND OLD.dropoff_confirmed = false THEN
        SET NEW.dropoff_time = CURRENT_TIMESTAMP;
    END IF;
END //
DELIMITER ;

-- Sample data for testing
INSERT INTO route_transactions (
    transaction_id, user_id, route_id, station_id, qr_ticket_code,
    base_fare, peak_surcharge, total_fare, currency, payment_status,
    boarding_confirmed, dropoff_confirmed, applied_rules
) VALUES
(
    'TXN_DEMO_001', 'user_123', 'HAR-CBD-AVENUE', 'AVENUE-S01', 'TICKET_1234567890_ABC123',
    1.00, 0.50, 1.50, 'USD', 'PAID',
    false, false, '{"rules": [{"rule_name": "Morning Peak Surcharge", "amount": 0.50}]}'
),
(
    'TXN_DEMO_002', 'user_456', 'HAR-CBD-BORROWDALE', 'BORROWDALE-B01', 'TICKET_0987654321_XYZ789',
    1.50, 0.75, 2.25, 'USD', 'PAID',
    true, false, '{"rules": [{"rule_name": "Morning Peak Surcharge", "amount": 0.75}]}'
);

-- Insert demo conductor session
INSERT INTO conductor_sessions (
    session_id, conductor_id, conductor_name, route_id, bus_id, is_active
) VALUES
('SESS_COND_001', 'COND_001', 'John Conductor', 'HAR-CBD-AVENUE', 'BUS_001', true);

COMMIT;

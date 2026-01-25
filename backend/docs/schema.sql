DROP DATABASE IF EXISTS Asheville;
CREATE DATABASE Asheville;

CREATE TABLE beekeeper (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(32) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_beekeeper_username (username),
    UNIQUE KEY uq_beekeeper_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE hive (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    beekeeper_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_hive_beekeeper (beekeeper_id),

    CONSTRAINT fk_hive_beekeeper
        FOREIGN KEY (beekeeper_id)
        REFERENCES beekeeper (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE device (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hive_id BIGINT UNSIGNED NOT NULL,
    installed_at TIMESTAMP NULL,
    last_seen_at TIMESTAMP NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,

    PRIMARY KEY (id),
    KEY idx_device_hive_active (hive_id, active),
    KEY idx_device_last_seen (last_seen_at),

    CONSTRAINT fk_device_hive
        FOREIGN KEY (hive_id)
        REFERENCES hive (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reading (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id BIGINT UNSIGNED NOT NULL,
    recorded_at TIMESTAMP(3) NOT NULL,
    temperature_c DECIMAL NOT NULL,
    battery_voltage DECIMAL NULL,
    signal_strength DECIMAL NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_device_time (device_id, recorded_at),

    CONSTRAINT fk_reading_device
        FOREIGN KEY (device_id)
        REFERENCES device (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE session (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    beekeeper_id BIGINT UNSIGNED NOT NULL,
    session_token CHAR(64) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_session_token (session_token),
    KEY idx_session_beekeeper_active (beekeeper_id, active),
    KEY idx_session_expires (expires_at),

    CONSTRAINT fk_session_beekeeper FOREIGN KEY (beekeeper_id) REFERENCES beekeeper (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
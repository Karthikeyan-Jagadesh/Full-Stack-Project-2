CREATE TABLE app_users (
    id NUMBER PRIMARY KEY,
    full_name VARCHAR2(120) NOT NULL,
    email VARCHAR2(180) NOT NULL UNIQUE,
    password_hash VARCHAR2(255) NOT NULL
);

CREATE SEQUENCE app_users_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER app_users_bir
BEFORE INSERT ON app_users
FOR EACH ROW
WHEN (NEW.id IS NULL)
BEGIN
    SELECT app_users_seq.NEXTVAL
    INTO :NEW.id
    FROM dual;
END;
/

CREATE TABLE trip_alerts (
    id NUMBER PRIMARY KEY,
    user_id NUMBER NOT NULL,
    destination_name VARCHAR2(255) NOT NULL,
    destination_latitude NUMBER(10, 6) NOT NULL,
    destination_longitude NUMBER(10, 6) NOT NULL,
    alarm_type VARCHAR2(20) NOT NULL,
    distance_threshold_km NUMBER,
    time_threshold_minutes NUMBER,
    status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_trip_alert_user FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE SEQUENCE trip_alerts_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

CREATE OR REPLACE TRIGGER trip_alerts_bir
BEFORE INSERT ON trip_alerts
FOR EACH ROW
WHEN (NEW.id IS NULL)
BEGIN
    SELECT trip_alerts_seq.NEXTVAL
    INTO :NEW.id
    FROM dual;
END;
/

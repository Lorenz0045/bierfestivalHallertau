CREATE TABLE app_user (
    keycloak_id VARCHAR(255), -- UUID aus KeyCloak / primary Key
    location_limit INT,
    PRIMARY KEY (keycloak_id)
);

COMMENT ON COLUMN app_user.keycloak_id IS 'Eindeutige Benutzer-ID von Keycloak (sub claim). Primärschlüssel.';


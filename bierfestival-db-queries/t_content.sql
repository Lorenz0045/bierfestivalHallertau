-- Tabelle für allgemeine Content-Metadaten
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type_id INT NOT NULL REFERENCES lookup_content_types(id),
    content_type_value VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    preview_description TEXT,
    like_count INT DEFAULT 0,
    author_id VARCHAR(255) NULL REFERENCES app_user(keycloak_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PRIVATE' CHECK (status IN ('PRIVATE', 'PUBLIC')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_items_content_type_id ON content_items(content_type_id);
CREATE INDEX idx_content_items_content_type_value ON content_items(content_type_value);
CREATE INDEX idx_content_items_author_id ON content_items(author_id);
CREATE INDEX idx_content_items_title ON content_items(title);
CREATE INDEX idx_content_items_like_count ON content_items(like_count DESC);

-- Tabelle für Likes
CREATE TABLE content_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES app_user(keycloak_id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_like_per_content UNIQUE (content_item_id, user_id) -- Jeder User kann einen Content nur einmal liken
);

CREATE INDEX idx_content_likes_content_item_id ON content_likes(content_item_id);
CREATE INDEX idx_content_likes_user_id ON content_likes(user_id);

-- Trigger-Funktion, um updated_at automatisch zu aktualisieren
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für die content_items Tabelle
CREATE TRIGGER set_timestamp_content_items
BEFORE UPDATE ON content_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();



COMMENT ON TABLE content_likes IS 'Speichert, welcher Benutzer welchen Content-Eintrag geliked hat.';
COMMENT ON COLUMN content_items.author_id IS 'Fremdschlüssel zum Autor in der app_user Tabelle.';
COMMENT ON COLUMN content_items.content_type_id IS 'Fremdschlüssel zum Content-Typ in der content_types Tabelle.';
COMMENT ON COLUMN content_likes.content_item_id IS 'Fremdschlüssel zum gelikten Content-Eintrag.';
COMMENT ON COLUMN content_likes.user_id IS 'Die ID des Benutzers (aus app_user), der geliked hat.';
COMMENT ON COLUMN content_likes.liked_at IS 'Zeitstempel, wann der Like gegeben wurde.';


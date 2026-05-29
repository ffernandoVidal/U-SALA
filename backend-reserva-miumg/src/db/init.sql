CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (nombre) VALUES
    ('administrador'),
    ('docente'),
    ('usuario')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    role_id INTEGER NOT NULL REFERENCES roles(id) DEFAULT 3,
    picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);

-- Tabla de Recursos
CREATE TABLE IF NOT EXISTS recursos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'SALON',
    ubicacion VARCHAR(255),
    capacidad INTEGER,
    estado VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    esta_activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recursos_nombre ON recursos(nombre);
CREATE INDEX IF NOT EXISTS idx_recursos_codigo ON recursos(codigo);
CREATE INDEX IF NOT EXISTS idx_recursos_tipo ON recursos(tipo);
CREATE INDEX IF NOT EXISTS idx_recursos_estado ON recursos(estado);
CREATE INDEX IF NOT EXISTS idx_recursos_esta_activo ON recursos(esta_activo);

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    recurso_id INTEGER NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
    inicio TIMESTAMP NOT NULL,
    fin TIMESTAMP NOT NULL,
    notas TEXT,
    motivo TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada', 'finalizada')),
    rechazo_motivo TEXT,
    cancelacion_motivo TEXT,
    aprobado_por INTEGER REFERENCES usuarios(id),
    rechazado_por INTEGER REFERENCES usuarios(id),
    cancelado_por INTEGER REFERENCES usuarios(id),
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_times CHECK (fin > inicio)
);

CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_recurso ON reservas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_disponibilidad ON reservas(recurso_id, inicio, fin) WHERE estado IN ('pendiente', 'aprobada');

CREATE TABLE IF NOT EXISTS reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_usuario_id ON reset_tokens(usuario_id);

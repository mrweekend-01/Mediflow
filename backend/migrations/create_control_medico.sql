-- Migración: tabla control_medico
-- Ejecutar en psql: psql -U <user> -d <db> -f create_control_medico.sql

CREATE TABLE IF NOT EXISTS control_medico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id UUID NOT NULL REFERENCES clinicas(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    medico_id UUID REFERENCES medicos(id),
    especialidad_id UUID REFERENCES especialidades(id),
    numero_orden INTEGER NOT NULL,
    hcl VARCHAR(50),
    boleta VARCHAR(50),
    paciente_nombre VARCHAR(200),
    paciente_edad VARCHAR(10),
    paciente_dni VARCHAR(20),
    seguro VARCHAR(100),
    turno VARCHAR(10),
    fecha DATE NOT NULL,
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_control_medico_clinica_fecha
    ON control_medico(clinica_id, fecha);

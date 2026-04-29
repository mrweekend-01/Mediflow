-- MediFlow — init.sql
-- Crea todas las tablas e inserta los datos iniciales de CSJD
-- Se ejecuta automáticamente al iniciar el contenedor de PostgreSQL por primera vez

SET client_encoding = 'UTF8';

-- ── Extensiones ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Tablas ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinicas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL,
    ruc         VARCHAR(20),
    direccion   VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS especialidades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id  UUID NOT NULL REFERENCES clinicas(id),
    nombre      VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS medicos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id      UUID NOT NULL REFERENCES clinicas(id),
    especialidad_id UUID REFERENCES especialidades(id),
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    codigo          VARCHAR(50),
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id    UUID NOT NULL REFERENCES clinicas(id),
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20) NOT NULL CHECK (rol IN ('superadmin','coordinador','admision','director','archivos','marketing','comercial')),
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medico_horario (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id   UUID NOT NULL REFERENCES medicos(id),
    dia_semana  VARCHAR(10),
    turno       VARCHAR(10),
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    fecha       DATE
);

CREATE TABLE IF NOT EXISTS atenciones (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id     UUID NOT NULL REFERENCES medicos(id),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id),
    clinica_id    UUID NOT NULL REFERENCES clinicas(id),
    turno         VARCHAR(10),
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS triaje (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id      UUID NOT NULL REFERENCES clinicas(id),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    medico_id       UUID REFERENCES medicos(id),
    especialidad_id UUID REFERENCES especialidades(id),
    numero_orden    INTEGER NOT NULL,
    hcl             VARCHAR(50),
    boleta          VARCHAR(50),
    paciente_nombre VARCHAR(200),
    paciente_edad   VARCHAR(10),
    paciente_dni    VARCHAR(20),
    seguro          VARCHAR(100),
    campana         VARCHAR(100),
    turno           VARCHAR(10),
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    registrado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_medico (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinica_id      UUID NOT NULL REFERENCES clinicas(id),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    medico_id       UUID REFERENCES medicos(id),
    especialidad_id UUID REFERENCES especialidades(id),
    numero_orden    INTEGER NOT NULL,
    hcl             VARCHAR(50),
    boleta          VARCHAR(50),
    paciente_nombre VARCHAR(200),
    paciente_edad   VARCHAR(10),
    paciente_dni    VARCHAR(20),
    seguro          VARCHAR(100),
    turno           VARCHAR(10),
    fecha           DATE NOT NULL,
    registrado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID REFERENCES usuarios(id),
    usuario_email   VARCHAR(100),
    usuario_nombre  VARCHAR(100),
    accion          VARCHAR(200),
    ip              VARCHAR(50),
    fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_atenciones_clinica ON atenciones(clinica_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_medico  ON atenciones(medico_id);
CREATE INDEX IF NOT EXISTS idx_triaje_clinica_fecha ON triaje(clinica_id, fecha);
CREATE INDEX IF NOT EXISTS idx_control_medico_clinica_fecha ON control_medico(clinica_id, fecha);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);


-- ── Datos iniciales ───────────────────────────────────────────

-- Clínica
INSERT INTO clinicas (id, nombre, ruc, direccion) VALUES
('6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CSJD', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Especialidades (26)
INSERT INTO especialidades (id, clinica_id, nombre) VALUES
('ee5f5586-5a75-4eb8-999a-d4941b592224', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CARDIOLOGIA'),
('73268830-a00e-41d6-8370-e47a048f1b01', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CIRUGIA CARDIOVASCULAR'),
('f69ed8bd-feeb-4e88-9eae-061c6f6670f8', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CX GENERAL'),
('3f29b7a0-a06b-427e-8c38-72d9a13d1136', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CX PEDIATRICA'),
('2102483c-a087-4249-a8a1-c48a07c0c63f', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'CX. DE CABEZA Y CUELLO'),
('0c340e04-d25b-4319-8439-019dba8ee126', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'DERMATOLOGIA'),
('a8567d87-b1af-4bc4-988b-45cb7a5c0d17', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'ECOGRAFIAS'),
('bf6b058a-3032-432d-ab57-5bbc1983554b', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'ENDOCRINOLOGIA'),
('98a87cd2-7617-4b6a-8226-b7ceabd1662c', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'GASTRO'),
('316919b4-47f7-49cb-b92e-a373bbe2e0b6', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'GERIATRIA'),
('eb8289cf-50b2-40b9-b31c-94b349cfdecc', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'GINECOLOGIA'),
('02222b34-c667-4d55-bc11-0e2950c233da', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'HEMATOLOGIA'),
('741dd223-33f5-488a-bf4e-04b267f63fe9', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'M. INTERNA'),
('3151f1fb-6c99-44dc-9b80-df4c9d6d56b2', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'NEUMOLOGIA'),
('21177c1b-621a-4343-8293-020da309f7e2', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'NEUROCX'),
('b17062f6-e2a8-4f0b-8ed0-2d85f83add6e', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'NEUROLOGIA'),
('8c175972-5453-455b-b5f8-16d2f37a768b', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'NUTRICION'),
('3c3df77e-0c5f-4086-889f-368308dc1dfd', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'ODONTOLOGIA'),
('c96ae77a-ce69-41f3-b982-5ba2da2b12a0', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'OFTAMOLOGIA'),
('5d4e6491-5f0a-441f-8f68-c84f5b8bfc6a', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'ONCOLOGIA'),
('8f79a311-38b7-493e-87a8-eb17b9e09dbc', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'OTORRINO'),
('4892f3dc-8599-46b6-aad1-fb30c7ef9941', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'PEDIATRIA'),
('a1941ecb-3234-4759-926e-1c7b0e230c8a', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'PSIQUIATRIA'),
('94fe7c33-ad93-469d-befb-0061119ac6ad', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'REHABILITACION'),
('8e3f78bc-9c60-401a-96fa-8c4a06fa9a29', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'TRAUMATOLOGIA'),
('f82a77f5-ba3b-4084-a6c6-799a1d20d0af', '6bfdaee8-3280-43f8-bffc-5e3308c8b5fd', 'UROLOGIA')
ON CONFLICT (id) DO NOTHING;

-- Médicos (64)
INSERT INTO medicos (id, clinica_id, especialidad_id, nombre, apellido, codigo, activo) VALUES
('ce62ff05-576a-4b4f-b24c-ac6e93fef276','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a8567d87-b1af-4bc4-988b-45cb7a5c0d17','DR. BORDA','',NULL,TRUE),
('b78cc9f6-155c-4709-8cea-5c820813502b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a8567d87-b1af-4bc4-988b-45cb7a5c0d17','DR. ESCALANTE','',NULL,TRUE),
('e4587750-4a19-4fc4-ad10-04c56876feb7','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a8567d87-b1af-4bc4-988b-45cb7a5c0d17','DRA. CARELIN','',NULL,TRUE),
('7e574d14-28b0-442b-ba5a-c86f5a8af84f','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','b17062f6-e2a8-4f0b-8ed0-2d85f83add6e','ARNALDO','AGUILAR TACUSI',NULL,TRUE),
('23863532-5080-463b-8239-953b4baf81df','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f69ed8bd-feeb-4e88-9eae-061c6f6670f8','MIRTHA','ALBIS VILLA',NULL,TRUE),
('82f33f93-6d93-4b27-bd36-2c862f3a7164','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f69ed8bd-feeb-4e88-9eae-061c6f6670f8','JULIO CESAR','AUCCACUSI RODRIGUEZ',NULL,TRUE),
('7807f336-f091-4edb-9a88-24707ec347c9','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','741dd223-33f5-488a-bf4e-04b267f63fe9','OSWALDO EMETERIO','AVILA MARTINEZ',NULL,TRUE),
('9b24db6a-fbde-4c16-9324-b18505a9972b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','98a87cd2-7617-4b6a-8226-b7ceabd1662c','YOEL CARLOS','CAIRA HUANCA',NULL,TRUE),
('aeebaee6-5812-4dad-86e1-3bbb9f54536a','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','3151f1fb-6c99-44dc-9b80-df4c9d6d56b2','JESUS ANTENOR','CASTILLO LAGOS',NULL,TRUE),
('2e1586fa-1bc3-4855-a52b-d02e7ea28680','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','c96ae77a-ce69-41f3-b982-5ba2da2b12a0','JAMES JEISSON','CASTRO LOAYZA',NULL,TRUE),
('b4a07f0e-47da-4b34-bf92-0666e851cc40','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','b17062f6-e2a8-4f0b-8ed0-2d85f83add6e','FLOR DE MARIA','CCORA QUITO',NULL,TRUE),
('2f1c0ccd-771c-45d3-a681-5a60120baa28','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a8567d87-b1af-4bc4-988b-45cb7a5c0d17','DRA. GIOVANA','CESPEDES',NULL,TRUE),
('3178f5e0-eaea-4f8a-8bb5-e438047927e0','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','21177c1b-621a-4343-8293-020da309f7e2','JOHAM','CHOQUE VELASQUEZ',NULL,TRUE),
('d30ff9a2-0a3e-4cc4-a135-600a939aab65','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','5d4e6491-5f0a-441f-8f68-c84f5b8bfc6a','DANDY GUILLERMO','CONCHA VALENCIA',NULL,TRUE),
('f21f8662-ddf7-4b0a-8c56-b0cb4b037e60','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','0c340e04-d25b-4319-8439-019dba8ee126','JULIO CESAR','CONDORI TRONCOSO',NULL,TRUE),
('3f856200-cad1-4937-af9e-d39cc588026b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','IVAN VALENTIN','CORBACHO CARAZAS',NULL,TRUE),
('65eade81-1681-40fa-865a-e8890e3af576','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','c96ae77a-ce69-41f3-b982-5ba2da2b12a0','TEOFILO','CORDOVA PUMACAHUA',NULL,TRUE),
('6ceae828-e71a-4968-aa24-ccfe2658f0ed','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','3f29b7a0-a06b-427e-8c38-72d9a13d1136','YONY FRANCHESKA','CORICAZA CUARESMA',NULL,TRUE),
('82023d13-90a2-472b-9c1b-8946ac897a7c','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','eb8289cf-50b2-40b9-b31c-94b349cfdecc','WESMILE ROTSEN','CRUZ BORDA',NULL,TRUE),
('59f6f6be-b203-45bb-a11a-d65b62a6bcf2','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','94fe7c33-ad93-469d-befb-0061119ac6ad','AMERICO PABLO','DAZA VARGAS',NULL,TRUE),
('99963add-5927-4d25-a72c-5bd80608f9f5','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8f79a311-38b7-493e-87a8-eb17b9e09dbc','CRUZ CARTAGENA','DR.',NULL,TRUE),
('4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','ee5f5586-5a75-4eb8-999a-d4941b592224','JOSE','ESPINOZA',NULL,TRUE),
('05b58aa5-eb5c-41e8-9a0a-849de0410335','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','73268830-a00e-41d6-8370-e47a048f1b01','JULIO CESAR','ESPINOZA LA TORRE',NULL,TRUE),
('f36e898a-39b5-486f-ace3-0b8cb570ed24','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','3c3df77e-0c5f-4086-889f-368308dc1dfd','IGOR ALBERTO','FERNANDEZ ORE',NULL,TRUE),
('485aff1a-1207-467e-8eaa-6491c27b9b38','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','316919b4-47f7-49cb-b92e-a373bbe2e0b6','CARLA','GAMERO ECHEGARAY',NULL,TRUE),
('aa7eb1cc-8bb1-4c19-8604-570bdc813b79','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','3f29b7a0-a06b-427e-8c38-72d9a13d1136','OSCAR','GARCIA ARAUJO',NULL,TRUE),
('2fd6ee47-7385-440e-8c5f-3589a6b0ccbd','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','98a87cd2-7617-4b6a-8226-b7ceabd1662c','YOJANA','GONZALES QUISPE',NULL,TRUE),
('77590058-92a4-4a53-a158-cd8c1ef0c448','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f69ed8bd-feeb-4e88-9eae-061c6f6670f8','LISTER','GONZALES SALDIVAR',NULL,TRUE),
('103523cd-3f0e-409c-91da-506c47418796','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','RODRIGO JOSUE','GRAJEDA VALDEZ',NULL,TRUE),
('10260a9b-7b29-4d2d-abb9-9139aec1b26c','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','eb8289cf-50b2-40b9-b31c-94b349cfdecc','YOLANDA ILEANA','GUERRA MIRANDA',NULL,TRUE),
('aff6d589-cd85-41dd-80b7-42741ee2d084','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f69ed8bd-feeb-4e88-9eae-061c6f6670f8','RAMIRO','HERMOZA ROSELL',NULL,TRUE),
('a562394f-76fd-456c-a8ff-e7648b6848b9','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8c175972-5453-455b-b5f8-16d2f37a768b','CLAUDIA MARIA','HERRERA ZEGARRA',NULL,TRUE),
('b5874854-8070-4d10-93ee-4667a3bb8473','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','4892f3dc-8599-46b6-aad1-fb30c7ef9941','WILBERT','HOLGADO ESCALANTE',NULL,TRUE),
('c0e0e2d7-b6e2-4562-b7cf-e26d33b9aa7e','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','NEPHTALI VENANCIO','HOLGADO FRISANCHO',NULL,TRUE),
('5665deb5-aa38-4200-8555-70cc0ed455c4','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f82a77f5-ba3b-4084-a6c6-799a1d20d0af','JOSE','LOAIZA MENDOZA',NULL,TRUE),
('034f3464-035b-4f43-a943-ae6bdf2a3b6c','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','ee5f5586-5a75-4eb8-999a-d4941b592224','BEATRIZ','LOZA BARBOZA',NULL,TRUE),
('cb749274-fb65-4b57-a9ff-32c10bbe7a2b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','eb8289cf-50b2-40b9-b31c-94b349cfdecc','ROCIO MILUSKA','MEDINA ARIAS',NULL,TRUE),
('bcff2342-e8a3-4747-810c-d221ccd10afe','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','bf6b058a-3032-432d-ab57-5bbc1983554b','MARJORY SAMANTHA','MIRANDA FLORES',NULL,TRUE),
('a1003a4d-3913-48e0-a4b5-6f5d63f8fe5f','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','94fe7c33-ad93-469d-befb-0061119ac6ad','HUGO RICARDO','NOLI CALLIRGOS',NULL,TRUE),
('c7fcbc8c-cd89-4915-94f2-dbe84f52b7d3','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','0c340e04-d25b-4319-8439-019dba8ee126','LAURA GRACIELA','ODICIO PEREZ',NULL,TRUE),
('ace66425-c709-4d34-912e-ec43dab6b8ac','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','ee5f5586-5a75-4eb8-999a-d4941b592224','MAGRET NIN','OLIVERA',NULL,TRUE),
('e0c1613f-7a94-43ff-afc7-0fdd02c7fa26','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','3c3df77e-0c5f-4086-889f-368308dc1dfd','RUBEN KEITH','OROZ GUERRO',NULL,TRUE),
('5694fe24-4e52-464b-8e31-a5480b114e8e','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','2102483c-a087-4249-a8a1-c48a07c0c63f','LEDA GABRIELA','PALACIO MAMANI',NULL,TRUE),
('dd061d54-0a39-47cb-beb3-84affd202be3','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','ROBERTO','PALOMINO LOAIZA',NULL,TRUE),
('b6740b4f-58a6-4493-9bd3-c75f62842d54','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a1941ecb-3234-4759-926e-1c7b0e230c8a','MARYSHEILY','PAREDES LAZARO',NULL,TRUE),
('f61ec073-3ae7-488e-9432-77172966e0ae','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f69ed8bd-feeb-4e88-9eae-061c6f6670f8','LUIS','PAREDES VILLAR',NULL,TRUE),
('b3d6bfd7-460a-4f7f-8ab2-a319ad847a73','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','98a87cd2-7617-4b6a-8226-b7ceabd1662c','RAQUEL MAGALY','PORTILLO COAQUIRA',NULL,TRUE),
('837881eb-65b3-4f43-8a51-f70a4aa57dd3','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','b17062f6-e2a8-4f0b-8ed0-2d85f83add6e','ROGER','QUISPE',NULL,TRUE),
('91c53716-53ab-41e2-9183-66870e1048ad','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','f82a77f5-ba3b-4084-a6c6-799a1d20d0af','ROGER','QUISPE',NULL,TRUE),
('7f25f197-086a-4058-9e61-aaf6be2efe06','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','eb8289cf-50b2-40b9-b31c-94b349cfdecc','WILBER','ROMAN LANTARON',NULL,TRUE),
('1c9ce75a-facd-465a-a008-0a5d1f9aa56b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','741dd223-33f5-488a-bf4e-04b267f63fe9','CARMEN MILENA','SANCHEZ VILLACORTA',NULL,TRUE),
('e6c044bb-b350-4344-8ecc-bb7051980c71','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','4892f3dc-8599-46b6-aad1-fb30c7ef9941','STEFANY MARY','SANTA CRUZ CARRASCO',NULL,TRUE),
('8d6cee7e-eebe-4756-b19f-75777fdc2795','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','4892f3dc-8599-46b6-aad1-fb30c7ef9941','OSCAR JAVIER','SIMONEAU HORMIGO',NULL,TRUE),
('db1d1ebe-661d-43f0-b3fc-9cc1c8967c0b','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','FREDDY','SOLIS QUISPE',NULL,TRUE),
('dd967644-80a6-4cb7-83ce-4510fbe15056','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','741dd223-33f5-488a-bf4e-04b267f63fe9','FRANCISCO','SOTO VALENZUELA',NULL,TRUE),
('0d546136-ab7a-4fc7-b8ee-bb1118003ea4','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','eb8289cf-50b2-40b9-b31c-94b349cfdecc','JUAN CARLOS','TAMAYO',NULL,TRUE),
('b0afbf1b-408e-47b0-bb84-dda410a154e6','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','94fe7c33-ad93-469d-befb-0061119ac6ad','NANCY','VALDEIGLESIAS CABRERA',NULL,TRUE),
('6a424521-9f28-4e7c-9cc9-93784678e071','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','b17062f6-e2a8-4f0b-8ed0-2d85f83add6e','RAFAEL ANGEL','VELARDE HILARES',NULL,TRUE),
('1fc116b2-5a04-4ad7-ab68-c6aac341ee0f','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','GUSTAVO ALONSO','VELAZQUEZ PEREZ',NULL,TRUE),
('68ecbd4e-a567-4a2c-9a2d-a61d594dde5f','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','a1941ecb-3234-4759-926e-1c7b0e230c8a','CHERYL','VILLAFUERTE ESCALANTE',NULL,TRUE),
('e19e1d3d-d1e9-446a-aba2-6c419df1685f','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','94fe7c33-ad93-469d-befb-0061119ac6ad','CESAR ANTONIO','ZAMBRANO ENRIQUEZ',NULL,TRUE),
('1b820c1e-07bd-48d5-8e9e-bf9cfc1e339d','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8e3f78bc-9c60-401a-96fa-8c4a06fa9a29','MANUEL','ZEVALLOS RODRIGUEZ',NULL,TRUE),
('61aa29c6-3c67-4c79-8705-aa9638bf2ae1','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','02222b34-c667-4d55-bc11-0e2950c233da','ANGEL JOHNATAN','ZUNIGA JARA',NULL,TRUE),
('5c66fe57-f49a-47f5-9d70-b2a38463614c','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','8f79a311-38b7-493e-87a8-eb17b9e09dbc','ROXANA','ZUNIGA LEIVA',NULL,TRUE)
ON CONFLICT (id) DO NOTHING;

-- Usuarios (5) — contraseñas hasheadas con bcrypt
INSERT INTO usuarios (id, clinica_id, nombre, email, password_hash, rol, activo) VALUES
('8218af6a-b3ab-456d-b14f-a982f3159683','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Admision Triaje','admision@csjd.com','$2b$12$M.ikw6lVl79zx1x.LyDWleLasMS/fiFsuuNfzneGSsLAzLt30K3Xm','admision',TRUE),
('22a7982b-0d7f-4da7-9faa-dab020a55582','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Archivos','archivos@csjd.com','$2b$12$uF1m6aXCDyZSAzmRor7eY..oGSZyUGWTBZuDt7F/qiQTzASanJuRe','archivos',TRUE),
('dc313231-aa6b-45d1-be37-4155419708ab','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Coordinador Admision','coordinador@csjd.com','$2b$12$j06mfbB52Xfm27m6.Gio3uAzr8D7H0H4AJ8XV5wUpJOEP5iYIuroK','coordinador',TRUE),
('87464c03-dc58-4582-b82b-dca11d3c6aad','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Director Medico','director@csjd.com','$2b$12$BieOKg0M0AYeKAsv0UYzhO3GQTHG3gOGJJF1d94JaUHjYy56cRFCW','director',TRUE),
('e73a4d10-7590-4e0f-ab95-4795148c9a11','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Super Admin','superadmin@mediflow.com','$2b$12$Xos..b50izumH3nYhxPkeuDbpJ47xG1S7uFPZaaoJ9vTe9uv9zxn6','superadmin',TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Marketing','marketing@csjd.com','$2b$12$PLACEHOLDER.MARKETING.HASH.ACTUALIZAR.MANUALMENTE.XX','marketing',TRUE),
('b2c3d4e5-f6a7-8901-bcde-f12345678901','6bfdaee8-3280-43f8-bffc-5e3308c8b5fd','Comercial','comercial@csjd.com','$2b$12$PLACEHOLDER.COMERCIAL.HASH.ACTUALIZAR.MANUALMENTE.XX','comercial',TRUE)
ON CONFLICT (id) DO NOTHING;

-- Horarios de médicos (58)
INSERT INTO medico_horario (id, medico_id, dia_semana, turno, hora_inicio, hora_fin) VALUES
('563d06f5-c8f6-44f2-884d-adfdb0a51916','034f3464-035b-4f43-a943-ae6bdf2a3b6c','lunes','mañana','10:00','12:00'),
('d02b255b-8181-41f8-9362-2a0666bf2da5','034f3464-035b-4f43-a943-ae6bdf2a3b6c','martes','tarde','14:00','19:00'),
('03842445-176a-4748-b684-57eef2242df5','05b58aa5-eb5c-41e8-9a0a-849de0410335','jueves','tarde','18:00','20:00'),
('ae6ff635-efad-4603-8ca0-b4fad52161b1','05b58aa5-eb5c-41e8-9a0a-849de0410335','jueves','mañana','08:00','13:00'),
('a291c5aa-f633-4084-b270-9c892c03f540','05b58aa5-eb5c-41e8-9a0a-849de0410335','jueves','tarde','18:00','20:00'),
('36c3f959-df41-4ed3-9c1b-80ff1da8f6c4','05b58aa5-eb5c-41e8-9a0a-849de0410335','jueves','tarde','18:00','20:00'),
('2e606e1a-8faf-4e0f-838e-26c57cf5993d','05b58aa5-eb5c-41e8-9a0a-849de0410335','jueves','tarde','18:00','20:00'),
('b48466b5-5e9c-4243-9a45-1dc971543b10','05b58aa5-eb5c-41e8-9a0a-849de0410335','lunes','tarde','18:00','20:00'),
('5cdcd62f-faf5-4588-acd7-5df81c7bc1ef','05b58aa5-eb5c-41e8-9a0a-849de0410335','lunes','tarde','18:00','20:00'),
('c2baeb65-c8af-48f0-a886-8d25e41b18e2','05b58aa5-eb5c-41e8-9a0a-849de0410335','lunes','tarde','18:00','20:00'),
('341b9c2b-58ce-40a2-b109-7002876f53fa','05b58aa5-eb5c-41e8-9a0a-849de0410335','lunes','tarde','18:00','20:00'),
('f551ac80-546a-4d2f-938f-07e437c2f314','05b58aa5-eb5c-41e8-9a0a-849de0410335','martes','mañana','08:00','13:00'),
('388d54a9-4c27-4302-8570-21d0c9af2e99','05b58aa5-eb5c-41e8-9a0a-849de0410335','martes','tarde','18:00','20:00'),
('5709e7d3-eeed-4fec-a1b7-083c9ef6ca9f','05b58aa5-eb5c-41e8-9a0a-849de0410335','martes','tarde','18:00','20:00'),
('142874d3-c771-4a19-9eb4-458f6789fc69','05b58aa5-eb5c-41e8-9a0a-849de0410335','martes','tarde','18:00','20:00'),
('7f6d22ea-575c-481a-8f9a-63a653fc5c49','05b58aa5-eb5c-41e8-9a0a-849de0410335','martes','tarde','18:00','20:00'),
('7546771a-0449-4e78-b8a3-c398c7517888','05b58aa5-eb5c-41e8-9a0a-849de0410335','miercoles','mañana','08:00','13:00'),
('66aeabad-0b42-4539-a48e-98ad1675dbd1','05b58aa5-eb5c-41e8-9a0a-849de0410335','miercoles','tarde','18:00','20:00'),
('9f7fdadf-12aa-4166-afe8-60ed9f4ebb2f','05b58aa5-eb5c-41e8-9a0a-849de0410335','miercoles','tarde','18:00','20:00'),
('4ff55aa6-c7f9-4af9-8d73-46e2fd97c5ee','05b58aa5-eb5c-41e8-9a0a-849de0410335','miercoles','tarde','18:00','20:00'),
('5d34b39b-aa73-4bee-a74f-424d99d60d6c','05b58aa5-eb5c-41e8-9a0a-849de0410335','miercoles','tarde','18:00','20:00'),
('aa673c35-1da9-4093-9341-73fae5585463','05b58aa5-eb5c-41e8-9a0a-849de0410335','sabado','tarde','18:00','20:00'),
('21f39fc1-7fc1-425c-8f0c-fb92d2304f11','05b58aa5-eb5c-41e8-9a0a-849de0410335','sabado','tarde','18:00','20:00'),
('6d3763d8-3fe9-4c17-839c-5b9f85b57b9d','05b58aa5-eb5c-41e8-9a0a-849de0410335','sabado','tarde','18:00','20:00'),
('806d2dce-53a6-40fa-b9a6-f4d9e69a0adb','05b58aa5-eb5c-41e8-9a0a-849de0410335','sabado','tarde','18:00','20:00'),
('0a8496f1-2e17-4e34-8248-470dd9e39fc2','05b58aa5-eb5c-41e8-9a0a-849de0410335','sabado','tarde','18:00','20:00'),
('17fd8596-178d-4b90-a90a-cd30c4b8094b','05b58aa5-eb5c-41e8-9a0a-849de0410335','viernes','tarde','18:00','20:00'),
('e7bdc908-8128-4ce3-bce9-a8d7d843cb27','05b58aa5-eb5c-41e8-9a0a-849de0410335','viernes','tarde','18:00','20:00'),
('071fb7a3-a4a0-4f34-a472-910cdf62457e','05b58aa5-eb5c-41e8-9a0a-849de0410335','viernes','tarde','18:00','20:00'),
('a5f85f1f-2b73-4ac8-8dbd-5080b69e8b03','05b58aa5-eb5c-41e8-9a0a-849de0410335','viernes','tarde','18:00','20:00'),
('350f471e-1cf4-4dd2-8caf-68180c7e1726','05b58aa5-eb5c-41e8-9a0a-849de0410335','viernes','tarde','18:00','20:00'),
('fee63067-5d24-44a5-b77d-52a205685ec1','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','jueves','mañana','08:00','13:00'),
('629fdc82-6406-4311-90f9-6567f0f9e3d1','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','lunes','mañana','08:00','13:00'),
('b1fbc1b8-abb3-424c-9e27-d3a62f5372c0','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','lunes','tarde','14:00','19:00'),
('8e7ffe6c-8511-44fc-86da-3f05122602a7','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','martes','mañana','08:00','13:00'),
('3dbcf1e7-3005-40fd-ba6a-4511dbb9bca6','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','martes','mañana','08:00','13:00'),
('9ad3ad13-4c08-46fd-a0d3-5be97307736d','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8','miercoles','mañana','08:00','13:00'),
('c0c81286-dc77-4f5e-bfe4-ce51ff46f360','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('dde8acbe-b7f3-4477-b142-89fb1af74466','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('5ce6c14e-e3e8-4d47-a9cd-91b76fb7b868','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('fc19c83b-74d0-47b5-b199-ee17aee6e326','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('839dfdaf-c717-4463-be66-98caf21ff0a2','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('b1601ee1-7a5a-478d-914f-f002abf5a785','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('08a8f084-a703-4686-b879-67ffb52063cd','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('51beff3b-c84f-48b6-aaae-3fd027636cff','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('470369fa-918a-4f3b-9318-dc2f04eb6f83','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('58453b1b-32ab-4e50-b894-b174970a8d9a','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('6bd18e50-9ca4-4ea4-80aa-34870753ac68','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('f5b56263-f6bf-41ce-bc97-b5a02d590e41','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('c85b372a-6275-46ac-b870-a4a482d45d67','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('f4bfdfd9-ef50-4fe8-b09b-7d7883484851','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('5d9376fc-c344-4b65-9f51-2554c9952af9','4959dc9c-9c4c-4a71-ac55-020b31a0a4b8',NULL,'mañana','08:00','13:00'),
('7a1fbf31-d247-4515-9743-27165b2a9ae8','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00'),
('a73926c5-d64d-492f-b116-90cce1ba5757','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00'),
('753315fb-9b9a-4a1c-ac42-7ac07d959f37','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00'),
('341134bc-3929-48d3-bfce-c00874f19fb0','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00'),
('76562337-08ac-4fd0-9dcb-7bc5ace0c0a0','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00'),
('352d0792-f4ec-44e3-ab32-579b224e27f6','ace66425-c709-4d34-912e-ec43dab6b8ac','martes','mañana','08:00','13:00')
ON CONFLICT (id) DO NOTHING;

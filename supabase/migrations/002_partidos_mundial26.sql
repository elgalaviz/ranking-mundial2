-- ─────────────────────────────────────────────────────────────
-- MUNDIAL 2026 — Todos los partidos
-- Verificar equipos en: fifa.com/es/tournaments/mens/worldcup
-- Todos los horarios en UTC
-- ─────────────────────────────────────────────────────────────

-- FASE DE GRUPOS ──────────────────────────────────────────────

-- GRUPO A: México, Jamaica, Venezuela
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('México','Jamaica','2026-06-11 23:00:00+00','Estadio Azteca','Ciudad de México','Grupos','A'),
('Venezuela','México','2026-06-16 02:00:00+00','Estadio BBVA','Monterrey','Grupos','A'),
('Jamaica','Venezuela','2026-06-20 22:00:00+00','Estadio Akron','Guadalajara','Grupos','A');

-- GRUPO B: USA, Panamá, Albania
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('USA','Panamá','2026-06-12 00:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','B'),
('Albania','USA','2026-06-16 22:00:00+00','AT&T Stadium','Dallas','Grupos','B'),
('Panamá','Albania','2026-06-20 20:00:00+00','Gillette Stadium','Boston','Grupos','B');

-- GRUPO C: Canadá, Honduras, Marruecos
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Canadá','Honduras','2026-06-12 22:00:00+00','BC Place','Vancouver','Grupos','C'),
('Marruecos','Canadá','2026-06-17 00:00:00+00','BMO Field','Toronto','Grupos','C'),
('Honduras','Marruecos','2026-06-21 00:00:00+00','BC Place','Vancouver','Grupos','C');

-- GRUPO D: Argentina, Chile, Perú
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Argentina','Chile','2026-06-13 01:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','D'),
('Perú','Argentina','2026-06-17 23:00:00+00','Hard Rock Stadium','Miami','Grupos','D'),
('Chile','Perú','2026-06-21 22:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','D');

-- GRUPO E: Brasil, Colombia, Ecuador
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Brasil','Ecuador','2026-06-13 23:00:00+00','SoFi Stadium','Los Ángeles','Grupos','E'),
('Colombia','Brasil','2026-06-18 01:00:00+00','AT&T Stadium','Dallas','Grupos','E'),
('Ecuador','Colombia','2026-06-22 00:00:00+00','Lumen Field','Seattle','Grupos','E');

-- GRUPO F: Francia, Polonia, Australia
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Francia','Australia','2026-06-14 01:00:00+00','Levi''s Stadium','San Francisco','Grupos','F'),
('Polonia','Francia','2026-06-18 22:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','F'),
('Australia','Polonia','2026-06-22 22:00:00+00','Arrowhead Stadium','Kansas City','Grupos','F');

-- GRUPO G: España, Serbia, Suiza
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('España','Serbia','2026-06-14 23:00:00+00','Hard Rock Stadium','Miami','Grupos','G'),
('Suiza','España','2026-06-19 01:00:00+00','SoFi Stadium','Los Ángeles','Grupos','G'),
('Serbia','Suiza','2026-06-23 00:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','G');

-- GRUPO H: Alemania, Japón, Croacia
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Alemania','Japón','2026-06-15 01:00:00+00','AT&T Stadium','Dallas','Grupos','H'),
('Croacia','Alemania','2026-06-19 22:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','H'),
('Japón','Croacia','2026-06-23 22:00:00+00','Levi''s Stadium','San Francisco','Grupos','H');

-- GRUPO I: Portugal, Turquía, Uruguay
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Portugal','Turquía','2026-06-15 22:00:00+00','Lumen Field','Seattle','Grupos','I'),
('Uruguay','Portugal','2026-06-20 00:00:00+00','Arrowhead Stadium','Kansas City','Grupos','I'),
('Turquía','Uruguay','2026-06-24 00:00:00+00','BC Place','Vancouver','Grupos','I');

-- GRUPO J: Países Bajos, Senegal, Austria
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Países Bajos','Senegal','2026-06-16 00:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','J'),
('Austria','Países Bajos','2026-06-20 22:00:00+00','Hard Rock Stadium','Miami','Grupos','J'),
('Senegal','Austria','2026-06-24 22:00:00+00','AT&T Stadium','Dallas','Grupos','J');

-- GRUPO K: Inglaterra, Irán, Arabia Saudita
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Inglaterra','Irán','2026-06-16 20:00:00+00','Gillette Stadium','Boston','Grupos','K'),
('Arabia Saudita','Inglaterra','2026-06-21 20:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','K'),
('Irán','Arabia Saudita','2026-06-25 00:00:00+00','SoFi Stadium','Los Ángeles','Grupos','K');

-- GRUPO L: Bélgica, Corea del Sur, Dinamarca
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('Bélgica','Corea del Sur','2026-06-17 20:00:00+00','BMO Field','Toronto','Grupos','L'),
('Dinamarca','Bélgica','2026-06-22 20:00:00+00','Estadio Azteca','Ciudad de México','Grupos','L'),
('Corea del Sur','Dinamarca','2026-06-25 22:00:00+00','Estadio BBVA','Monterrey','Grupos','L');

-- RONDA DE 32 ─────────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('1A','2B','2026-06-28 22:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Ronda de 32',null),
('1B','2A','2026-06-28 02:00:00+00','AT&T Stadium','Dallas','Ronda de 32',null),
('1C','2D','2026-06-29 00:00:00+00','BC Place','Vancouver','Ronda de 32',null),
('1D','2C','2026-06-29 22:00:00+00','Hard Rock Stadium','Miami','Ronda de 32',null),
('1E','2F','2026-06-30 00:00:00+00','SoFi Stadium','Los Ángeles','Ronda de 32',null),
('1F','2E','2026-06-30 22:00:00+00','Mercedes-Benz Stadium','Atlanta','Ronda de 32',null),
('1G','2H','2026-07-01 00:00:00+00','Levi''s Stadium','San Francisco','Ronda de 32',null),
('1H','2G','2026-07-01 22:00:00+00','Gillette Stadium','Boston','Ronda de 32',null),
('1I','2J','2026-07-02 00:00:00+00','Arrowhead Stadium','Kansas City','Ronda de 32',null),
('1J','2I','2026-07-02 22:00:00+00','BMO Field','Toronto','Ronda de 32',null),
('1K','2L','2026-07-03 00:00:00+00','Lincoln Financial Field','Filadelfia','Ronda de 32',null),
('1L','2K','2026-07-03 22:00:00+00','Estadio Azteca','Ciudad de México','Ronda de 32',null),
('3A/B/C','3D/E/F','2026-07-04 00:00:00+00','AT&T Stadium','Dallas','Ronda de 32',null),
('3G/H/I','3J/K/L','2026-07-04 22:00:00+00','SoFi Stadium','Los Ángeles','Ronda de 32',null),
('mejor 3ro 1','mejor 3ro 2','2026-07-05 00:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Ronda de 32',null),
('mejor 3ro 3','mejor 3ro 4','2026-07-05 22:00:00+00','Hard Rock Stadium','Miami','Ronda de 32',null);

-- OCTAVOS DE FINAL ────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('W R32-1','W R32-2','2026-07-06 22:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Octavos',null),
('W R32-3','W R32-4','2026-07-07 02:00:00+00','AT&T Stadium','Dallas','Octavos',null),
('W R32-5','W R32-6','2026-07-07 22:00:00+00','SoFi Stadium','Los Ángeles','Octavos',null),
('W R32-7','W R32-8','2026-07-08 02:00:00+00','Mercedes-Benz Stadium','Atlanta','Octavos',null),
('W R32-9','W R32-10','2026-07-08 22:00:00+00','BC Place','Vancouver','Octavos',null),
('W R32-11','W R32-12','2026-07-09 02:00:00+00','Levi''s Stadium','San Francisco','Octavos',null),
('W R32-13','W R32-14','2026-07-09 22:00:00+00','Estadio Azteca','Ciudad de México','Octavos',null),
('W R32-15','W R32-16','2026-07-10 02:00:00+00','Hard Rock Stadium','Miami','Octavos',null);

-- CUARTOS DE FINAL ────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('W Oct-1','W Oct-2','2026-07-11 22:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Cuartos',null),
('W Oct-3','W Oct-4','2026-07-12 02:00:00+00','SoFi Stadium','Los Ángeles','Cuartos',null),
('W Oct-5','W Oct-6','2026-07-12 22:00:00+00','AT&T Stadium','Dallas','Cuartos',null),
('W Oct-7','W Oct-8','2026-07-13 02:00:00+00','Hard Rock Stadium','Miami','Cuartos',null);

-- SEMIFINALES ─────────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('W Cuar-1','W Cuar-2','2026-07-14 23:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Semifinal',null),
('W Cuar-3','W Cuar-4','2026-07-15 23:00:00+00','AT&T Stadium','Dallas','Semifinal',null);

-- TERCER LUGAR ────────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('L Semi-1','L Semi-2','2026-07-18 23:00:00+00','Hard Rock Stadium','Miami','Tercer lugar',null);

-- FINAL ───────────────────────────────────────────────────────
insert into partidos (equipo_local, equipo_visitante, fecha_utc, estadio, ciudad, fase, grupo) values
('W Semi-1','W Semi-2','2026-07-19 23:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Final',null);

-- Borrar datos incorrectos e insertar calendario oficial FIFA 2026
-- Horarios en UTC (ET + 4h). Fuente: FWC26 Match Schedule v17 10/04/2026

truncate table registros_whatsapp;
truncate table quiniela_picks;
delete from partidos;

-- ── GRUPO A: México · Sudáfrica · Corea del Sur · Chequia ─────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('México','Sudáfrica','2026-06-11 19:00:00+00','Estadio Azteca','Ciudad de México','Grupos','A'),
('Corea del Sur','Chequia','2026-06-12 02:00:00+00','Estadio Akron','Guadalajara','Grupos','A'),
('Chequia','Sudáfrica','2026-06-18 16:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','A'),
('México','Corea del Sur','2026-06-19 01:00:00+00','Estadio Akron','Guadalajara','Grupos','A'),
('Sudáfrica','Corea del Sur','2026-06-25 19:00:00+00','Estadio Azteca','Ciudad de México','Grupos','A'),
('Chequia','México','2026-06-26 01:00:00+00','Estadio Azteca','Ciudad de México','Grupos','A');

-- ── GRUPO B: Canadá · Bosnia-Herzegovina · Catar · Suiza ──────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Canadá','Bosnia-Herzegovina','2026-06-12 19:00:00+00','BMO Field','Toronto','Grupos','B'),
('Catar','Suiza','2026-06-13 19:00:00+00','Levi''s Stadium','San Francisco','Grupos','B'),
('Suiza','Bosnia-Herzegovina','2026-06-18 19:00:00+00','Levi''s Stadium','San Francisco','Grupos','B'),
('Canadá','Catar','2026-06-19 22:00:00+00','BMO Field','Toronto','Grupos','B'),
('Suiza','Canadá','2026-06-26 03:00:00+00','BC Place','Vancouver','Grupos','B'),
('Bosnia-Herzegovina','Catar','2026-06-25 19:00:00+00','Levi''s Stadium','San Francisco','Grupos','B');

-- ── GRUPO C: Brasil · Marruecos · Haití · Escocia ─────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Brasil','Marruecos','2026-06-13 22:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','C'),
('Haití','Escocia','2026-06-14 01:00:00+00','Gillette Stadium','Boston','Grupos','C'),
('Brasil','Haití','2026-06-20 00:30:00+00','SoFi Stadium','Los Ángeles','Grupos','C'),
('Escocia','Marruecos','2026-06-20 22:00:00+00','Gillette Stadium','Boston','Grupos','C'),
('Marruecos','Haití','2026-06-26 17:00:00+00','Hard Rock Stadium','Miami','Grupos','C'),
('Escocia','Brasil','2026-06-26 22:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','C');

-- ── GRUPO D: USA · Paraguay · Australia · Turquía ─────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('USA','Paraguay','2026-06-13 01:00:00+00','SoFi Stadium','Los Ángeles','Grupos','D'),
('Australia','Turquía','2026-06-13 04:00:00+00','BC Place','Vancouver','Grupos','D'),
('Turquía','Paraguay','2026-06-19 03:00:00+00','Levi''s Stadium','San Francisco','Grupos','D'),
('USA','Australia','2026-06-20 19:00:00+00','Lumen Field','Seattle','Grupos','D'),
('Paraguay','Australia','2026-06-26 23:00:00+00','AT&T Stadium','Dallas','Grupos','D'),
('Turquía','USA','2026-06-27 02:00:00+00','SoFi Stadium','Los Ángeles','Grupos','D');

-- ── GRUPO E: Alemania · Curasao · Costa de Marfil · Ecuador ───
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Alemania','Curasao','2026-06-14 17:00:00+00','AT&T Stadium','Dallas','Grupos','E'),
('Costa de Marfil','Ecuador','2026-06-14 23:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','E'),
('Alemania','Costa de Marfil','2026-06-21 00:00:00+00','AT&T Stadium','Dallas','Grupos','E'),
('Ecuador','Curasao','2026-06-21 16:00:00+00','Arrowhead Stadium','Kansas City','Grupos','E'),
('Ecuador','Alemania','2026-06-27 22:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','E'),
('Curasao','Costa de Marfil','2026-06-27 22:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','E');

-- ── GRUPO F: Países Bajos · Japón · Suecia · Túnez ───────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Países Bajos','Japón','2026-06-14 20:00:00+00','Lumen Field','Seattle','Grupos','F'),
('Suecia','Túnez','2026-06-15 02:00:00+00','Estadio BBVA','Monterrey','Grupos','F'),
('Países Bajos','Suecia','2026-06-21 17:00:00+00','Lumen Field','Seattle','Grupos','F'),
('Túnez','Japón','2026-06-22 04:00:00+00','Estadio BBVA','Monterrey','Grupos','F'),
('Japón','Suecia','2026-06-27 23:00:00+00','SoFi Stadium','Los Ángeles','Grupos','F'),
('Túnez','Países Bajos','2026-06-27 20:00:00+00','Estadio BBVA','Monterrey','Grupos','F');

-- ── GRUPO G: Bélgica · Egipto · Irán · Nueva Zelanda ─────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Bélgica','Egipto','2026-06-15 19:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','G'),
('Irán','Nueva Zelanda','2026-06-16 01:00:00+00','Lumen Field','Seattle','Grupos','G'),
('Nueva Zelanda','Egipto','2026-06-22 19:00:00+00','BC Place','Vancouver','Grupos','G'),
('Bélgica','Irán','2026-06-22 17:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','G'),
('Nueva Zelanda','Bélgica','2026-06-28 02:00:00+00','BC Place','Vancouver','Grupos','G'),
('Egipto','Irán','2026-06-28 02:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','G');

-- ── GRUPO H: España · Cabo Verde · Arabia Saudí · Uruguay ─────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('España','Cabo Verde','2026-06-15 16:00:00+00','Hard Rock Stadium','Miami','Grupos','H'),
('Arabia Saudí','Uruguay','2026-06-15 22:00:00+00','Hard Rock Stadium','Miami','Grupos','H'),
('España','Arabia Saudí','2026-06-22 22:00:00+00','Hard Rock Stadium','Miami','Grupos','H'),
('Uruguay','Cabo Verde','2026-06-22 23:00:00+00','Arrowhead Stadium','Kansas City','Grupos','H'),
('Cabo Verde','Arabia Saudí','2026-06-28 03:00:00+00','Hard Rock Stadium','Miami','Grupos','H'),
('Uruguay','España','2026-06-28 00:00:00+00','Arrowhead Stadium','Kansas City','Grupos','H');

-- ── GRUPO I: Francia · Senegal · Irak · Noruega ──────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Francia','Senegal','2026-06-16 19:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','I'),
('Noruega','Irak','2026-06-16 22:00:00+00','Gillette Stadium','Boston','Grupos','I'),
('Francia','Irak','2026-06-23 21:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','I'),
('Noruega','Senegal','2026-06-23 20:00:00+00','Gillette Stadium','Boston','Grupos','I'),
('Senegal','Irak','2026-06-28 19:00:00+00','AT&T Stadium','Dallas','Grupos','I'),
('Noruega','Francia','2026-06-28 00:00:00+00','Gillette Stadium','Boston','Grupos','I');

-- ── GRUPO J: Argentina · Argelia · Austria · Jordania ─────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Argentina','Argelia','2026-06-17 01:00:00+00','Arrowhead Stadium','Kansas City','Grupos','J'),
('Austria','Jordania','2026-06-17 04:00:00+00','Levi''s Stadium','San Francisco','Grupos','J'),
('Argentina','Austria','2026-06-24 16:00:00+00','Arrowhead Stadium','Kansas City','Grupos','J'),
('Jordania','Argelia','2026-06-24 01:00:00+00','Levi''s Stadium','San Francisco','Grupos','J'),
('Argelia','Austria','2026-06-28 23:30:00+00','AT&T Stadium','Dallas','Grupos','J'),
('Jordania','Argentina','2026-06-29 02:00:00+00','Arrowhead Stadium','Kansas City','Grupos','J');

-- ── GRUPO K: Portugal · RD Congo · Uzbekistán · Colombia ──────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Colombia','RD Congo','2026-06-17 17:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','K'),
('Uzbekistán','Colombia','2026-06-18 02:00:00+00','Gillette Stadium','Boston','Grupos','K'),
('Portugal','RD Congo','2026-06-23 02:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','K'),
('Portugal','Uzbekistán','2026-06-24 01:00:00+00','Lincoln Financial Field','Filadelfia','Grupos','K'),
('Colombia','Portugal','2026-06-28 21:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','K'),
('RD Congo','Uzbekistán','2026-06-28 21:00:00+00','Gillette Stadium','Boston','Grupos','K');

-- ── GRUPO L: Inglaterra · Croacia · Ghana · Panamá ───────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase,grupo) values
('Ghana','Panamá','2026-06-17 23:00:00+00','BMO Field','Toronto','Grupos','L'),
('Inglaterra','Croacia','2026-06-18 20:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Grupos','L'),
('Inglaterra','Ghana','2026-06-24 00:00:00+00','Gillette Stadium','Boston','Grupos','L'),
('Panamá','Croacia','2026-06-24 20:00:00+00','BMO Field','Toronto','Grupos','L'),
('Panamá','Inglaterra','2026-06-29 19:00:00+00','Hard Rock Stadium','Miami','Grupos','L'),
('Croacia','Ghana','2026-06-29 21:00:00+00','Mercedes-Benz Stadium','Atlanta','Grupos','L');

-- ── DIECISEISAVOS (R32) ───────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('1A','3 C/E/F/H/I','2026-07-01 01:00:00+00','Estadio Azteca','Ciudad de México','Dieciseisavos'),
('1E','3 A/B/C/D/F','2026-07-01 20:30:00+00','Lincoln Financial Field','Filadelfia','Dieciseisavos'),
('1F','2C','2026-07-02 01:00:00+00','Estadio BBVA','Monterrey','Dieciseisavos'),
('1I','3 C/D/F/G/H','2026-07-02 21:00:00+00','SoFi Stadium','Los Ángeles','Dieciseisavos'),
('2A','2B','2026-07-03 19:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Dieciseisavos'),
('1C','2F','2026-07-03 17:00:00+00','BC Place','Vancouver','Dieciseisavos'),
('1H','2J','2026-07-04 19:00:00+00','Hard Rock Stadium','Miami','Dieciseisavos'),
('2E','2I','2026-07-04 17:00:00+00','AT&T Stadium','Dallas','Dieciseisavos'),
('1D','3 B/E/F/I/J','2026-07-05 00:00:00+00','Levi''s Stadium','San Francisco','Dieciseisavos'),
('1G','3 A/E/H/I/J','2026-07-05 20:00:00+00','BC Place','Vancouver','Dieciseisavos'),
('1B','3 E/F/G/I/J','2026-07-06 03:00:00+00','Lumen Field','Seattle','Dieciseisavos'),
('1L','3 E/H/I/J/K','2026-07-05 16:00:00+00','Mercedes-Benz Stadium','Atlanta','Dieciseisavos'),
('1K','3 D/E/I/J/L','2026-07-06 01:30:00+00','Arrowhead Stadium','Kansas City','Dieciseisavos'),
('1J','2H','2026-07-06 22:00:00+00','AT&T Stadium','Dallas','Dieciseisavos'),
('2K','2L','2026-07-07 23:00:00+00','BMO Field','Toronto','Dieciseisavos'),
('2D','2G','2026-07-07 18:00:00+00','SoFi Stadium','Los Ángeles','Dieciseisavos');

-- ── OCTAVOS DE FINAL ──────────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('W R32-73','W R32-74','2026-07-09 21:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Octavos'),
('W R32-75','W R32-77','2026-07-10 17:00:00+00','Lumen Field','Seattle','Octavos'),
('W R32-76','W R32-78','2026-07-10 21:00:00+00','Estadio Azteca','Ciudad de México','Octavos'),
('W R32-79','W R32-80','2026-07-11 16:00:00+00','SoFi Stadium','Los Ángeles','Octavos'),
('W R32-81','W R32-82','2026-07-11 20:00:00+00','AT&T Stadium','Dallas','Octavos'),
('W R32-83','W R32-84','2026-07-12 19:00:00+00','Arrowhead Stadium','Kansas City','Octavos'),
('W R32-85','W R32-87','2026-07-12 03:00:00+00','Hard Rock Stadium','Miami','Octavos'),
('W R32-86','W R32-88','2026-07-13 22:00:00+00','Mercedes-Benz Stadium','Atlanta','Octavos');

-- ── CUARTOS DE FINAL ──────────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('W Oct-89','W Oct-90','2026-07-15 17:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Cuartos'),
('W Oct-91','W Oct-92','2026-07-16 00:00:00+00','Lumen Field','Seattle','Cuartos'),
('W Oct-93','W Oct-94','2026-07-16 19:00:00+00','AT&T Stadium','Dallas','Cuartos'),
('W Oct-95','W Oct-96','2026-07-17 00:00:00+00','Hard Rock Stadium','Miami','Cuartos');

-- ── SEMIFINALES ───────────────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('W Cuar-1','W Cuar-2','2026-07-18 19:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Semifinal'),
('W Cuar-3','W Cuar-4','2026-07-19 19:00:00+00','AT&T Stadium','Dallas','Semifinal');

-- ── TERCER LUGAR ──────────────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('L Semi-1','L Semi-2','2026-07-21 21:00:00+00','Hard Rock Stadium','Miami','Tercer lugar');

-- ── FINAL ─────────────────────────────────────────────────────
insert into partidos (equipo_local,equipo_visitante,fecha_utc,estadio,ciudad,fase) values
('W Semi-1','W Semi-2','2026-07-26 19:00:00+00','MetLife Stadium','Nueva York/Nueva Jersey','Final');

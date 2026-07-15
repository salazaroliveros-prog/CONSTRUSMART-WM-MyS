-- ============================================================
-- SEED DATA: Departamentos de Guatemala
-- ============================================================

INSERT INTO erp_departamentos_gt (codigo, nombre, codigo_iso) VALUES
('01', 'Guatemala', 'GT-GU'),
('02', 'El Progreso', 'GT-PR'),
('03', 'Sacatepéquez', 'GT-SR'),
('04', 'Chimaltenango', 'GT-CM'),
('05', 'Escuintla', 'GT-ES'),
('06', 'Santa Rosa', 'GT-SR'),
('07', 'Sololá', 'GT-SO'),
('08', 'Totonicapán', 'GT-TO'),
('09', 'Quetzaltenango', 'GT-QC'),
('10', 'Suchitepéquez', 'GT-SU'),
('11', 'Retalhuleu', 'GT-RE'),
('12', 'San Marcos', 'GT-SM'),
('13', 'Huehuetenango', 'GT-HU'),
('14', 'Quiché', 'GT-QC'),
('15', 'Baja Verapaz', 'GT-BV'),
('16', 'Alta Verapaz', 'GT-AV'),
('17', 'Petén', 'GT-PE'),
('18', 'Izabal', 'GT-IZ'),
('19', 'Zacapa', 'GT-ZA'),
('20', 'Chiquimula', 'GT-CH'),
('21', 'Jalapa', 'GT-JA'),
('22', 'Jutiapa', 'GT-JU')
ON CONFLICT (codigo) DO NOTHING;

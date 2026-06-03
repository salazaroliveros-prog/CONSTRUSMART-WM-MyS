-- ============================================================
-- ERP CONSTRUSMART - Storage Buckets para fotos y documentos
-- Versión: 1.3.0
-- ============================================================

-- Crear bucket para fotos de avance de obra
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'erp_fotos_avances',
  'erp_fotos_avances',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para documentos de bitácora
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'erp_documentos',
  'erp_documentos',
  false, -- privado, solo autenticados
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para facturas de cajas chicas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'erp_facturas',
  'erp_facturas',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POLÍTICAS DE ACCESO A STORAGE
-- ============================================================

-- Bucket público: fotos de avances
CREATE POLICY "avances_public_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'erp_fotos_avances');

CREATE POLICY "avances_public_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'erp_fotos_avances' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avances_public_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'erp_fotos_avances' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avances_public_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'erp_fotos_avances' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket privado: documentos
CREATE POLICY "documentos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'erp_documentos');

CREATE POLICY "documentos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'erp_documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket privado: facturas
CREATE POLICY "facturas_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'erp_facturas');

CREATE POLICY "facturas_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'erp_facturas' AND (storage.foldername(name))[1] = auth.uid()::text);
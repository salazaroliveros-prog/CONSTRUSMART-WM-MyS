import { supabase } from './supabase';

const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Sube un archivo a Supabase Storage
 * @param bucket Nombre del bucket (erp_fotos_avances, erp_documentos, erp_facturas)
 * @param file Archivo a subir
 * @param userId ID del usuario autenticado
 * @returns URL pública del archivo subido
 */
export async function uploadFile(
  bucket: 'erp_fotos_avances' | 'erp_documentos' | 'erp_facturas',
  file: File,
  userId: string
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Validar extensión antes de continuar
    if (!EXTENSIONES_PERMITIDAS.has(ext)) {
      console.error(`Extensión no permitida: .${ext}`);
      return null;
    }
    const fileName = `${userId}/${Date.now()}_${uid().slice(0, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Error subiendo archivo:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Error en uploadFile:', err);
    return null;
  }
}

/**
 * Sube una foto desde un blob base64
 * @param bucket Nombre del bucket
 * @param base64Data String base64 (data:image/...)
 * @param userId ID del usuario
 * @returns URL pública
 */
export async function uploadBase64Image(
  bucket: 'erp_fotos_avances' | 'erp_documentos' | 'erp_facturas',
  base64Data: string,
  userId: string
): Promise<string | null> {
  try {
    // Convertir base64 a Blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    return uploadFile(bucket, file, userId);
  } catch (err) {
    console.error('Error en uploadBase64Image:', err);
    return null;
  }
}

/**
 * Sube una foto desde el canvas de SignaturePad (firma electrónica)
 */
export async function uploadSignature(
  signatureBase64: string,
  userId: string
): Promise<string | null> {
  return uploadBase64Image('erp_fotos_avances', signatureBase64, userId);
}

/**
 * Extensiones de archivo permitidas para subida
 */
const EXTENSIONES_PERMITIDAS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'txt', 'csv',
]);

/**
 * Caracteres peligrosos no permitidos en nombres de archivo
 */
const CARACTERES_PELIGROSOS = /[<>:"/\\|?*\x00-\x1f]/;

/**
 * Valida que un fileName no contenga path traversal
 */
function validarFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  // Rechazar path traversal
  if (fileName.includes('..') || fileName.startsWith('/') || fileName.startsWith('\\')) return false;
  // Rechazar caracteres peligrosos
  if (CARACTERES_PELIGROSOS.test(fileName)) return false;
  // Verificar extensión
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !EXTENSIONES_PERMITIDAS.has(ext)) return false;
  return true;
}

/**
 * Elimina un archivo por su URL pública
 */
export async function deleteFile(publicUrl: string): Promise<boolean> {
  try {
    // Extraer bucket y path de la URL pública
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    // La estructura es: /storage/v1/object/public/{bucket}/{path}
    const bucketIndex = pathParts.indexOf('public') + 1;
    if (bucketIndex >= pathParts.length) return false;

    const bucket = pathParts[bucketIndex];
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    // Validar path segments individualmente contra path traversal
    const segments = filePath.split('/');
    for (const segment of segments) {
      if (segment === '..' || segment === '.') return false;
    }
    // Validar que el bucket esté en la lista permitida
    const BUCKETS_PERMITIDOS = ['erp_fotos_avances', 'erp_documentos', 'erp_facturas'];
    if (!BUCKETS_PERMITIDOS.includes(bucket)) return false;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return !error;
  } catch {
    return false;
  }
}
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
    const ext = file.name.split('.').pop() || 'jpg';
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

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    return !error;
  } catch {
    return false;
  }
}
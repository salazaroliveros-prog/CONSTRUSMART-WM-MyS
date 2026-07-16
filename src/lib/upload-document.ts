/**
 * upload-document.ts
 * Utility functions for uploading documents to Supabase Storage
 */
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'erp-documentos';

export async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === STORAGE_BUCKET);
    
    if (!exists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    return false;
  }
}

export async function uploadDocument(
  file: File,
  projectId: string,
  documentType: 'plano' | 'rfi' | 'submittal',
  documentId: string
): Promise<string | null> {
  try {
    await ensureStorageBucket();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentType}/${projectId}/${documentId}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir archivo');
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Error al subir archivo');
    return null;
  }
}

export async function deleteDocument(fileUrl: string): Promise<boolean> {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.slice(pathParts.indexOf(STORAGE_BUCKET) + 1, pathParts.length - 1).join('/');
    const fullPath = `${folderPath}/${fileName}`;
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fullPath]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'El archivo excede el tamaño máximo de 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }
  
  return { valid: true };
}
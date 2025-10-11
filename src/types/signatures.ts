// src/types/signatures.ts
// Tipos para el sistema de firmas

export interface SignatureMeta {
  /** Información del lugar donde se firma */
  lugar?: string;
  
  /** Fecha de la firma (ISO string) */
  fecha?: string;
  
  /** Nombre del cliente que firma */
  clienteNombre?: string;
  
  /** Nombre del responsable/representante */
  responsableNombre?: string;
  
  /** Si se requiere firma para este documento */
  firmaRequerida?: boolean;
}

export interface SignatureImage {
  /** Data URL de la imagen de firma (data:image/png;base64,...) */
  dataURL: string;
  
  /** Timestamp de cuando se capturó la firma */
  timestamp: string;
  
  /** Opcional: nombre/identificador de la firma */
  name?: string;
}

export interface SignatureOptions {
  /** Modo de firma */
  mode: 'none' | 'lines' | 'images';
  
  /** Metadatos de la firma */
  meta: SignatureMeta;
  
  /** Imágenes de firmas (cuando mode === 'images') */
  images?: {
    cliente?: SignatureImage;
    responsable?: SignatureImage;
  };
}

export interface SignatureStorage {
  /** Firma del cliente guardada */
  clienteSignature?: SignatureImage;
  
  /** Firma del responsable guardada */
  responsableSignature?: SignatureImage;
  
  /** Configuración por defecto */
  defaultMeta: SignatureMeta;
  
  /** Versión del storage para migraciones futuras */
  version: number;
}

export interface CSVSignatureColumns {
  /** Si se deben incluir columnas de firma en CSV */
  includeSignatureColumns: boolean;
  
  /** Datos de firma para insertar en CSV */
  signatures?: SignatureOptions;
}
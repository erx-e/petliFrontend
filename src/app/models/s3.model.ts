// Respuesta del backend al solicitar una URL firmada para subir a S3.
// El backend genera la firma con sus credenciales de AWS; el frontend
// nunca maneja secretos (AWS_KEY_ID / AWS_KEY_SECRET viven solo en el servidor).
export interface PresignedUploadResponse {
  uploadUrl: string; // URL temporal y firmada para hacer PUT del archivo directamente a S3
  key: string; // identificador del objeto dentro del bucket (ej: "<uuid>.jpg")
  publicUrl: string; // URL pública definitiva para mostrar la imagen una vez subida
}

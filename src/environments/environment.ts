export const environment = {
  production: false,
  API_URL: 'https://localhost:44387',
  // URL pública del bucket S3, solo para MOSTRAR imágenes. No es secreto.
  // Las credenciales de AWS viven únicamente en el backend.
  BUCKET_URL: 'https://petslighthouse.s3.amazonaws.com',
};

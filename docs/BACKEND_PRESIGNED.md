# Contrato Backend — Subida/borrado de imágenes con Presigned URLs (S3)

Este documento describe **exactamente** lo que el frontend (Angular) espera del backend
(ASP.NET / C#) para subir y borrar imágenes en S3 mediante **URLs prefirmadas**.

El objetivo del patrón: **las credenciales de AWS viven solo en el backend**. El frontend
nunca las ve. El backend firma operaciones puntuales y temporales; el navegador sube el
archivo **directo a S3** usando esa firma.

> Fuente de verdad en el frontend:
> - `src/app/services/s3-storage.service.ts`
> - `src/app/models/s3.model.ts`
> - `src/app/shared/components/uploader/upload-task/upload-task.component.ts`

---

## 1. Flujo completo

```
┌─────────┐                         ┌─────────┐                    ┌────────┐
│ Frontend│                         │ Backend │                    │   S3   │
│(Angular)│                         │ (.NET)  │                    │  (AWS) │
└────┬────┘                         └────┬────┘                    └───┬────┘
     │                                   │                            │
     │ 1. POST /s3/presigned-upload      │                            │
     │    { fileName, contentType }      │                            │
     │    + Authorization: Bearer ──────►│                            │
     │                                   │ Con SUS credenciales       │
     │                                   │ genera la presigned PUT URL│
     │  ◄── { uploadUrl, key, publicUrl }│                            │
     │                                   │                            │
     │ 2. PUT uploadUrl  (archivo crudo, SIN token de app) ──────────►│
     │    Content-Type: <el mismo del paso 1>     S3 valida la firma  │
     │  ◄──────────────── 200 OK ────────────────────────────────────│
     │                                   │                            │
     │ 3. Muestra la imagen con publicUrl                             │
     │                                   │                            │
     │ (borrado) DELETE /s3/object/{key} + Bearer ──►│ borra en S3    │
```

Puntos clave que el backend debe respetar:

1. El **PUT del paso 2 va directo del navegador a S3**, no pasa por el backend. Por eso
   **es obligatorio configurar CORS en el bucket** (ver §5). Si falta, el navegador
   bloquea la subida aunque la firma sea válida.
2. El **`Content-Type` que se firma en el paso 1 debe ser el mismo que el navegador
   envía en el paso 2**. El frontend manda `file.type`. Si firmas con un Content-Type
   distinto (o no lo firmas), S3 rechaza el PUT con `SignatureDoesNotMatch`.
3. El borrado **sí** pasa por el backend (operación destructiva, autenticada).

---

## 2. Endpoints que debe exponer el backend

Base URL = `environment.API_URL` (`http://petlighthouse.somee.com`).

### 2.1 `POST /s3/presigned-upload` — pedir URL firmada para subir

**Autenticación:** sí. El frontend envía `Authorization: Bearer <token>` (vía `checkToken()`).
El backend debe validar el token.

**Request body (JSON):**
```json
{
  "fileName": "mi-foto.jpg",
  "contentType": "image/jpeg"
}
```
| Campo         | Tipo   | Notas                                                              |
|---------------|--------|--------------------------------------------------------------------|
| `fileName`    | string | Nombre original del archivo. **Solo úsalo para deducir la extensión.** No lo uses tal cual como key (riesgo de colisión y de caracteres inválidos). |
| `contentType` | string | MIME real del archivo (`image/jpeg`, `image/png`, `image/webp`…). **Debes firmarlo.** |

**Response body (JSON) — exactamente estos tres campos:**
```json
{
  "uploadUrl": "https://petslighthouse.s3.amazonaws.com/8f3a...c2.jpg?X-Amz-Algorithm=...&X-Amz-Signature=...",
  "key": "8f3a...c2.jpg",
  "publicUrl": "https://petslighthouse.s3.amazonaws.com/8f3a...c2.jpg"
}
```
| Campo       | Tipo   | Notas                                                                 |
|-------------|--------|-----------------------------------------------------------------------|
| `uploadUrl` | string | URL prefirmada para hacer `PUT`. Temporal (recomendado 5 min). |
| `key`       | string | Identificador del objeto en el bucket. **Genéralo tú** (UUID + extensión). |
| `publicUrl` | string | URL pública final para mostrar la imagen: `{BUCKET_URL}/{key}`. |

> ⚠️ **`publicUrl` debe ser `https://petslighthouse.s3.amazonaws.com/{key}`** para que
> coincida con `BUCKET_URL` del frontend (`src/environments/environment.ts`).

### 2.2 `DELETE /s3/object/{key}` — borrar un objeto

**Autenticación:** sí (`Authorization: Bearer`).

La `key` viaja **URL-encoded** (`encodeURIComponent`). El backend debe **decodificarla**
antes de pasarla a S3. Ejemplo: el frontend llama
`DELETE /s3/object/8f3a...c2.jpg`.

Respuesta: `200 OK` (cuerpo libre; el frontend no lo usa). En error, un `4xx/5xx`.

---

## 3. ⚠️ Regla crítica sobre el formato de la `key`

El frontend, al borrar una imagen **ya existente** (modo edición), **deriva la key del
último segmento de la URL pública**:

```ts
// upload-task.component.ts
this.imgKey = this.downloadUrl.split("/").pop();
```

Implicación para el backend:

- **Usa keys planas, sin prefijos de carpeta** (p. ej. `8f3a...c2.jpg`), **NO**
  `posts/2026/8f3a...c2.jpg`.
- Si en el futuro quieres usar prefijos (`carpeta/archivo.jpg`), `split("/").pop()`
  devolvería solo `archivo.jpg` y el borrado de imágenes existentes fallaría. Habría que
  cambiar también el frontend. Por ahora: **keys de un solo segmento.**

Generación recomendada de la key: `Guid` + extensión derivada de `fileName`/`contentType`.

---

## 4. Implementación de referencia (ASP.NET / C#)

Paquete NuGet: **`AWSSDK.S3`**.

### 4.1 Configuración (appsettings + DI)

`appsettings.json` (las claves NO van en el frontend, solo aquí / en variables de entorno):
```json
{
  "AWS": {
    "AccessKeyId": "...",
    "SecretAccessKey": "...",
    "Region": "us-east-1",
    "BucketName": "petslighthouse",
    "PublicBaseUrl": "https://petslighthouse.s3.amazonaws.com"
  }
}
```

`Program.cs`:
```csharp
builder.Services.AddSingleton<IAmazonS3>(_ =>
{
    var cfg = builder.Configuration.GetSection("AWS");
    var creds = new Amazon.Runtime.BasicAWSCredentials(
        cfg["AccessKeyId"], cfg["SecretAccessKey"]);
    return new AmazonS3Client(
        creds, Amazon.RegionEndpoint.GetBySystemName(cfg["Region"]));
});
```

### 4.2 DTOs (coinciden con el contrato de §2)

```csharp
public record PresignedUploadRequest(string FileName, string ContentType);

public record PresignedUploadResponse(string UploadUrl, string Key, string PublicUrl);
```

### 4.3 Controller

```csharp
[ApiController]
[Route("s3")]
public class S3Controller : ControllerBase
{
    private readonly IAmazonS3 _s3;
    private readonly IConfiguration _cfg;

    public S3Controller(IAmazonS3 s3, IConfiguration cfg)
    {
        _s3 = s3;
        _cfg = cfg;
    }

    private string Bucket => _cfg["AWS:BucketName"]!;
    private string PublicBaseUrl => _cfg["AWS:PublicBaseUrl"]!;

    [HttpPost("presigned-upload")]
    [Authorize] // valida el Bearer token de la app
    public IActionResult GetPresignedUpload([FromBody] PresignedUploadRequest req)
    {
        // 1) Generar una key PLANA (sin "/") con extensión a partir del nombre original.
        var ext = Path.GetExtension(req.FileName); // ".jpg"
        if (string.IsNullOrWhiteSpace(ext)) ext = ContentTypeToExt(req.ContentType);
        var key = $"{Guid.NewGuid():N}{ext}";

        // 2) Firmar un PUT, MISMO ContentType que enviará el navegador.
        var presign = new GetPreSignedUrlRequest
        {
            BucketName = Bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(5),
            ContentType = req.ContentType, // <-- imprescindible que coincida
        };
        var uploadUrl = _s3.GetPreSignedURL(presign);

        // 3) URL pública definitiva = BUCKET_URL/{key}
        var publicUrl = $"{PublicBaseUrl}/{key}";

        return Ok(new PresignedUploadResponse(uploadUrl, key, publicUrl));
    }

    [HttpDelete("object/{key}")]
    [Authorize]
    public async Task<IActionResult> Delete(string key)
    {
        // ASP.NET ya decodifica el segmento de ruta (encodeURIComponent del front).
        await _s3.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = Bucket,
            Key = key,
        });
        return Ok();
    }

    private static string ContentTypeToExt(string contentType) => contentType switch
    {
        "image/jpeg" => ".jpg",
        "image/png"  => ".png",
        "image/webp" => ".webp",
        "image/gif"  => ".gif",
        _            => ".bin",
    };
}
```

> Nota sobre el routing del DELETE: si una key llegara a contener `/` codificado (`%2F`),
> algunos servidores lo rechazan por defecto. Como aquí las keys son planas (§3) no debería
> ocurrir, pero si quisieras admitirlo, usa `{key}` con un parámetro catch-all `{*key}` y
> habilita `AllowEncodedSlashes`.

---

## 5. ⚠️ CORS del bucket S3 (sin esto, la subida falla)

El paso 2 es un `PUT` **desde el navegador directo a S3**. Hay que autorizar el origen del
frontend en la configuración CORS del bucket (consola S3 → bucket → Permissions → CORS):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:4200",
      "http://petlighthouse.somee.com"
    ],
    "AllowedMethods": ["PUT", "GET", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

- `AllowedMethods` debe incluir **PUT** (subida) y **GET** (mostrar la imagen).
- `AllowedHeaders: ["*"]` permite el header `Content-Type` que envía el frontend.
- Añade cada origen real (local y producción). Sin el origen correcto, el navegador
  bloquea la petición con error de CORS aunque la firma sea correcta.

Para que `publicUrl` sea visible sin firma, el bucket/objeto debe permitir lectura pública
(política de bucket o `public-read`), **o** servir las imágenes vía CloudFront. Si NO quieres
lectura pública, habría que cambiar el frontend para pedir también una presigned URL de GET
(hoy NO lo hace: usa `publicUrl` directa).

---

## 6. Validaciones y seguridad recomendadas (lado backend)

- **Valida el `contentType`** contra una lista blanca de imágenes (`image/jpeg`,
  `image/png`, `image/webp`, `image/gif`). Rechaza el resto.
- **No confíes en `fileName`**: úsalo solo para la extensión; la key la generas tú (UUID).
- **Expiración corta** de la presigned URL (5 min basta para subir).
- Considera límite de tamaño: se puede forzar con presigned **POST + policy**
  (`content-length-range`) en lugar de presigned PUT, si necesitas tope de tamaño server-side.
- En el `DELETE`, valida que el usuario autenticado tenga permiso sobre ese objeto
  (idealmente comprobando que la key pertenece a un post suyo).
- Las credenciales AWS **solo** en backend (appsettings/secret manager/variables de entorno),
  nunca en el repo ni en el frontend.

---

## 7. Checklist de aceptación

- [ ] `POST /s3/presigned-upload` responde `{ uploadUrl, key, publicUrl }` y exige Bearer.
- [ ] El `ContentType` firmado == `contentType` del request == el que envía el navegador.
- [ ] `key` es plana (sin `/`) y `publicUrl == {BUCKET_URL}/{key}`.
- [ ] `DELETE /s3/object/{key}` decodifica la key, borra en S3 y exige Bearer.
- [ ] CORS del bucket permite PUT/GET desde `localhost:4200` y el dominio de producción.
- [ ] Lectura pública del objeto (o CloudFront) para que `publicUrl` cargue en `<img>`.
- [ ] Probado el flujo end-to-end desde el uploader del frontend (barra de progreso al 100%).
```
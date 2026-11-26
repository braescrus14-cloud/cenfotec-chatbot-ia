# Operación y solución de problemas

## Consultar el estado

```bash
sudo docker ps -a --filter name=cenfotec-chat
sudo docker logs --tail 50 cenfotec-chat
sudo docker inspect cenfotec-chat --format '{{.State.Status}} {{.State.Health.Status}}'
```

Para iniciar un contenedor detenido manualmente usa `sudo docker start cenfotec-chat`. Para reiniciarlo usa `sudo docker restart cenfotec-chat`.

## Actualizar la información institucional

1. Revisa y actualiza `docs/Base_Conocimiento_Cenfotec.md`.
2. Incorpora los cambios en `Index/contexto-cenfotec.txt`, que es el archivo que usa el servidor. Conserva las reglas del inicio.
3. Valida nombres, contactos, vigencia de afiches y dudas marcadas por la institución.
4. Confirma los cambios en Git y sigue el procedimiento de actualización del contenedor.

El documento Markdown conserva la fuente para revisión. La sincronización con el contexto es manual.

## Actualizar el contenedor existente

Ejecuta desde el clon del repositorio en EC2, con una versión nueva ya revisada y disponible en GitHub. En estos comandos sustituye la etiqueta `1.0.1` por la versión que quieras identificar.

```bash
git pull --ff-only
sudo docker build -t cenfotec-ia:1.0.1 .
sudo docker run -d --name cenfotec-prueba \
  --env-file /home/ec2-user/.config/cenfotec-ia.env \
  -p 127.0.0.1:5002:3000 cenfotec-ia:1.0.1
curl -I http://127.0.0.1:5002/
curl --max-time 35 -sS \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","text":"¿Cuántos semestres duran los programas técnicos?"}]}' \
  http://127.0.0.1:5002/api/chat
```

Continúa cuando las dos pruebas respondan correctamente.

```bash
backup_name="cenfotec-respaldo-$(date +%Y%m%d-%H%M%S)"
sudo docker stop cenfotec-chat
sudo docker update --restart=no cenfotec-chat
sudo docker rename cenfotec-chat "$backup_name"
printf 'Contenedor de recuperación: %s\n' "$backup_name"
sudo docker run -d --name cenfotec-chat \
  --restart unless-stopped \
  --env-file /home/ec2-user/.config/cenfotec-ia.env \
  -p 5001:3000 \
  --log-opt max-size=10m --log-opt max-file=3 \
  cenfotec-ia:1.0.1
curl -I http://127.0.0.1:5001/
sudo docker logs --tail 20 cenfotec-chat
```

Repite una pregunta desde el enlace público y verifica la información actualizada. Después retira el contenedor de prueba.

```bash
sudo docker stop cenfotec-prueba
sudo docker rm cenfotec-prueba
```

El contenedor de respaldo conserva la imagen y la configuración de la versión anterior. Mantén su nombre para recuperar esa versión si hace falta.

### Recuperación si la nueva versión falla

En la misma sesión, `backup_name` contiene el nombre de respaldo. Si cambiaste de sesión, recupéralo con `sudo docker ps -a` y asigna su valor antes de continuar.

```bash
sudo docker stop cenfotec-chat
sudo docker rm cenfotec-chat
sudo docker rename "$backup_name" cenfotec-chat
sudo docker update --restart=unless-stopped cenfotec-chat
sudo docker start cenfotec-chat
```

Si la creación del nuevo contenedor falló y el nombre `cenfotec-chat` quedó libre, comienza directamente por renombrar el respaldo.

## Cambiar la clave de Gemini

Actualiza el archivo privado siguiendo el paso de configuración de la [guía EC2](INSTALACION_EC2.md#4-configurar-la-clave-de-gemini). Después recrea el contenedor con la misma imagen y el archivo actualizado, mediante el procedimiento de actualización. Docker carga las variables al crear el contenedor, así que un simple reinicio conserva los valores anteriores.

## Errores frecuentes

| Síntoma | Comprobación y solución |
| --- | --- |
| El HTML abre, pero el chat falla | Abre la página servida por Node.js. En local usa el puerto configurado y en EC2 el puerto publicado |
| Falta GEMINI_API_KEY | Configura la clave y reinicia Node.js o recrea el contenedor |
| Google rechazó la clave | Revisa la clave completa y el proyecto de Google AI Studio |
| Google denegó el acceso | Verifica acceso a Gemini y restricciones de la clave/proyecto |
| Se alcanzó la cuota | Revisa las cuotas del proyecto en Google AI Studio antes de reintentar |
| No se pudo conectar con IA | Revisa DNS, salida HTTPS y registros. La llamada tiene un límite de 25 segundos |
| Puerto ocupado o EADDRINUSE | Revisa `sudo ss -lntp` y `sudo docker ps`; usa otro puerto o reemplaza el servicio identificado |
| El chat muestra datos antiguos | Reconstruye la imagen, recrea el contenedor e inicia una conversación nueva |
| PowerShell bloquea el script | Ejecuta `node --env-file=.env Index/server.mjs` desde la raíz del repositorio |
| El enlace público no carga | Revisa estado de EC2, IP actual, puerto publicado y grupo de seguridad |

## Datos y copias

El historial está en el almacenamiento local de cada navegador. Descargar la conversación desde la interfaz permite conservar una copia de texto.

El despliegue del 20 de noviembre conserva el chat anterior en `/home/ec2-user/respaldo-chat-20261120`. Los respaldos del código y la configuración privada requieren acceso restringido. La clave de Gemini se administra por separado de Git.

## Límites de operación

La imagen usa `node:22-alpine`, que recibe actualizaciones dentro de esa versión. Para incorporar una imagen base más reciente, construye con `sudo docker build --pull -t cenfotec-ia:VERSION .` y valida antes de activar.

El contenedor tiene un healthcheck y rotación de logs. El despliegue documentado usa una sola instancia y requiere revisión adicional de HTTPS, observabilidad y tratamiento de datos para atención empresarial pública.

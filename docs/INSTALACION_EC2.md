# Instalación en AWS EC2

Esta guía instala el repositorio en Amazon Linux 2023 con Docker. La aplicación queda en la instancia y el contenedor se ejecuta en segundo plano.

## 1. Acceder a la instancia

En la consola de AWS selecciona EC2, la región de la instancia y la instancia correspondiente. Si está detenida, usa «Estado de la instancia → Iniciar instancia».

Abre «Conectar → EC2 Instance Connect» como `ec2-user`. También puedes usar SSH si conservas el archivo privado del par de claves asociado.

## 2. Preparar Docker y Git

Ejecuta en la terminal Linux de EC2.

```bash
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo docker version
git --version
```

Docker incluye Node.js en la imagen de la aplicación. En este procedimiento las operaciones Docker usan `sudo`.

## 3. Clonar el repositorio

```bash
cd /home/ec2-user
git clone https://github.com/braescrus14-cloud/cenfotec-chatbot-ia.git
cd cenfotec-chatbot-ia
```

El repositorio es privado. GitHub debe reconocer una cuenta con acceso. Para HTTPS, utiliza el mecanismo de autenticación de GitHub, por ejemplo un token con acceso a este repositorio cuando Git solicite la contraseña. Mantén el token fuera de la URL y de los archivos de la aplicación.

## 4. Configurar la clave de Gemini

Si todavía no tienes una clave, sigue primero la [guía paso a paso de Google AI Studio](CLAVE_GEMINI.md#crear-o-localizar-la-clave).

Ejecuta el bloque completo. Después pega la clave de Google AI Studio cuando la terminal la solicite y presiona Enter. La entrada queda oculta.

```bash
install -d -m 700 /home/ec2-user/.config
umask 077
read -r -s -p 'Clave de Google AI Studio: ' cenfotec_key
printf '\n'
if [ -n "$cenfotec_key" ]; then
  printf 'GEMINI_API_KEY=%s\n' "$cenfotec_key" > /home/ec2-user/.config/cenfotec-ia.env
  chmod 600 /home/ec2-user/.config/cenfotec-ia.env
else
  printf 'La clave quedó vacía. Repite la entrada antes de continuar.\n'
fi
unset cenfotec_key
```

La clave permanece fuera del repositorio y de la imagen Docker. Se necesita una clave con acceso al modelo `gemini-3.1-flash-lite`.

## 5. Construir la imagen

Desde la raíz del repositorio ejecuta lo siguiente.

```bash
sudo docker build -t cenfotec-ia:1.0.0 .
```

## 6. Iniciar el chat

Para una instalación nueva, comprueba primero los puertos y los contenedores.

```bash
sudo docker ps -a
sudo ss -lntp
```

Si ya existe un contenedor llamado `cenfotec-chat` o un servicio usa el puerto 5001, sigue el procedimiento de [actualización](OPERACION.md#actualizar-el-contenedor-existente).

Para una instalación nueva ejecuta lo siguiente.

```bash
sudo docker run -d \
  --name cenfotec-chat \
  --restart unless-stopped \
  --env-file /home/ec2-user/.config/cenfotec-ia.env \
  -p 5001:3000 \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  cenfotec-ia:1.0.0
```

El puerto 3000 del contenedor se publica como 5001 de la instancia. Docker reinicia el servicio tras fallos o un reinicio del sistema cuando el contenedor no se ha detenido manualmente.

## 7. Acceso de red

En EC2, abre el grupo de seguridad asociado a la instancia. Para acceder directamente al puerto de esta instalación, configura una regla de entrada TCP 5001 desde las direcciones que deban probar el chat.

La instancia requiere una dirección pública y conectividad hacia Internet. Para consultar Gemini necesita resolver DNS y realizar conexiones HTTPS salientes a Google.

Abre `http://IP_PUBLICA:5001` sustituyendo `IP_PUBLICA` por la dirección que muestra EC2. Un cambio de IP tras detener e iniciar la instancia requiere actualizar el enlace.

Esta configuración sirve HTTP en el puerto 5001. Para acceso empresarial con dominio y HTTPS, incorpora un proxy inverso o balanceador con certificado y revisa las reglas de acceso según esa configuración.

## 8. Comprobar la instalación

```bash
sudo docker ps --filter name=cenfotec-chat
sudo docker inspect cenfotec-chat --format '{{.State.Status}} {{.State.Health.Status}}'
sudo docker logs --tail 30 cenfotec-chat
curl -I http://127.0.0.1:5001/
curl --max-time 35 -sS \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","text":"¿Cuál es el correo institucional de Cenfotec?"}]}' \
  http://127.0.0.1:5001/api/chat
```

La página debe devolver HTTP 200 y el chat un objeto JSON con `reply`. El estado de salud tarda unos segundos en pasar de `starting` a `healthy`.

El healthcheck comprueba que la página responde. La prueba de `/api/chat` comprueba además la conexión real con Google.

## Ubicación de la instalación original

El despliegue realizado el 20 de noviembre de 2026 utiliza `/home/ec2-user/cenfotec-ia` y la configuración `/home/ec2-user/.config/cenfotec-ia.env`. Este repositorio usa `Index/` para mantener el orden de los archivos fuente. La imagen Docker copia esos archivos a `/app`.

Al migrar desde la instalación original, clona este repositorio en su propia carpeta, conserva el archivo de configuración privado y sigue la actualización del contenedor existente. Los cambios en el repositorio requieren una construcción y activación explícitas para llegar al servicio.

Consulta la [guía oficial de Docker para Amazon Linux](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html).

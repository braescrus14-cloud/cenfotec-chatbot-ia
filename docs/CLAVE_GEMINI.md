# Obtener y configurar la clave de Gemini

La API permite que el servidor del chatbot consulte a Gemini. Para utilizarla necesitas una cuenta de Google, un proyecto de Google Cloud visible en Google AI Studio y una clave con acceso a Gemini.

## Crear o localizar la clave

1. Abre [Google AI Studio](https://aistudio.google.com/api-keys) e inicia sesión con tu cuenta de Google.
2. Si es tu primer acceso, revisa y acepta las condiciones que presenta Google.
3. En el panel de AI Studio abre **Dashboard → API Keys** o utiliza el enlace anterior.
4. Si Google ya creó una clave en un proyecto predeterminado, puedes usarla. Para crear otra, pulsa **Create API key** o **Crear clave de API**.
5. Selecciona el proyecto que utilizarás. Si tu proyecto no aparece, ve a **Dashboard → Projects → Import projects**, selecciónalo e impórtalo. Después regresa a **API Keys**. Si la interfaz ofrece crear un proyecto, puedes asignarle un nombre como `Cenfotec Chatbot`.
6. Asigna un nombre a la clave si se solicita, por ejemplo `Cenfotec servidor`, y completa la creación.
7. Abre el detalle de la clave y pulsa la opción para copiar su valor completo.

La clave se copia como texto y se configura en el servidor. El valor puede tener formatos distintos según el tipo de clave que genere Google. Copia el valor completo mostrado por AI Studio, sin añadir espacios ni etiquetas.

Los nombres de los botones pueden variar con el idioma y las actualizaciones de la interfaz. Si **Create API key** está deshabilitado, revisa que tu cuenta tenga permisos en el proyecto o consulta con su administrador. Google documenta la creación, los proyectos y sus permisos en su [guía de claves de Gemini](https://ai.google.dev/gemini-api/docs/api-key).

## Configurar la clave en Windows

Desde la raíz del repositorio ejecuta lo siguiente.

```powershell
Copy-Item .env.example .env
notepad .env
```

Reemplaza únicamente el texto de ejemplo de la primera línea por el valor completo que copiaste.

```dotenv
GEMINI_API_KEY=PEGA_AQUI_EL_VALOR_COMPLETO
HOST=127.0.0.1
PORT=3000
```

Guarda el archivo y cierra el editor. Comprueba que se llama exactamente `.env`, sin una extensión `.txt` adicional.

```powershell
node --env-file=.env Index/server.mjs
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000) y envía «¿Cuál es el correo institucional de Cenfotec?». La aplicación debe mostrar una respuesta generada con la base de conocimiento.

Si ya definiste `GEMINI_API_KEY` como variable de entorno en la terminal, Node prioriza ese valor. Para usar el archivo `.env` en esa sesión, elimina la variable antigua antes de iniciar.

```powershell
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
node --env-file=.env Index/server.mjs
```

## Configurar la clave en EC2

Sigue el [paso 4 de instalación en EC2](INSTALACION_EC2.md#4-configurar-la-clave-de-gemini). Ese procedimiento pide la clave con entrada oculta y crea el archivo privado `/home/ec2-user/.config/cenfotec-ia.env`.

Docker recibe la clave al crear el contenedor mediante `--env-file`. Si sustituyes una clave existente, recrea el contenedor según la [guía de operación](OPERACION.md#cambiar-la-clave-de-gemini).

## Comprobar la respuesta

También puedes probar el backend desde otra terminal de PowerShell mientras el servidor local sigue abierto.

```powershell
$consulta = @{
  messages = @(
    @{ role = 'user'; text = '¿Qué programas técnicos ofrece Cenfotec?' }
  )
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/chat' `
  -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($consulta))
```

El resultado contiene una propiedad `reply` con la respuesta. Si cambiaste el puerto, actualízalo en la dirección de la prueba.

## Cuotas y errores

| Mensaje | Qué revisar |
| --- | --- |
| Falta configurar GEMINI_API_KEY | Ubicación del archivo y variable configurada |
| Google rechazó la clave | Valor completo copiado y estado de la clave |
| Google denegó el acceso | Permisos del proyecto y restricciones de la clave |
| Modelo no disponible | Acceso del proyecto a gemini-3.1-flash-lite |
| Se alcanzó la cuota | Límites y uso del proyecto en AI Studio |

El modelo de este proyecto es `gemini-3.1-flash-lite`. El acceso gratuito depende de la disponibilidad, la cuota y las condiciones del proyecto. Algunos proyectos importados pueden requerir verificación para acceder al nivel gratuito. Revisa las condiciones aplicables y el uso antes de activar facturación. [Claves y proyectos de Gemini](https://ai.google.dev/gemini-api/docs/api-key)

La clave permite consumir la cuota del proyecto. Guárdala en `.env` localmente o en la configuración privada de EC2. Esos archivos están excluidos del repositorio. Si una clave queda publicada, sustitúyela y revoca la anterior en AI Studio. [Gestión de claves de Gemini](https://ai.google.dev/gemini-api/docs/api-key)

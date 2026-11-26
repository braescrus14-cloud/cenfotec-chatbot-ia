# Cenfotec Chatbot IA

Asistente web de atención al cliente y orientación vocacional para Cenfotec SAS, Centro de Formación Técnica de la Orinoquia. Usa Gemini 3.1 Flash-Lite mediante la API directa de Google y se ejecuta en AWS EC2 con Docker.

La interfaz permite iniciar conversaciones, consultar el historial del navegador, buscar y eliminar chats, cambiar el tema y descargar la conversación. El asistente orienta sobre programas, materias, sedes, requisitos, cursos, bienestar y canales de contacto.

## Contenido

- [Instalación local](#instalación-local)
- [Instalación en AWS EC2](docs/INSTALACION_EC2.md)
- [Arquitectura y funcionamiento](docs/ARQUITECTURA.md)
- [Actualización y solución de problemas](docs/OPERACION.md)
- [Base de conocimiento institucional](docs/Base_Conocimiento_Cenfotec.md)

## Estructura

```text
Index/
  index.html                  Página e iconos del chat
  styles.css                  Diseño adaptable y temas
  script.js                   Conversaciones y llamada al backend
  server.mjs                  Servidor HTTP y conexión con Gemini
  contexto-cenfotec.txt        Instrucciones y base enviada al modelo
  iniciar-chat.ps1             Inicio interactivo en PowerShell
docs/
  CLAVE_GEMINI.md             Creación, configuración y prueba de la clave
  DOCUMENTACION_PRINCIPAL.md  Índice de informes y anexos
  documentacion/             Informes de consulta y arquitectura
  Base_Conocimiento_Cenfotec.md Documento institucional de origen
  ARQUITECTURA.md              Flujo y límites del sistema
  INSTALACION_EC2.md           Instalación desde cero en Amazon Linux
  OPERACION.md                Actualización, diagnóstico y recuperación
  arquitectura.png            Diagrama
.env.example                  Plantilla de configuración
Dockerfile                    Imagen de ejecución
package.json                  Comandos de inicio y comprobación
```

## Instalación local

Se necesita Git, Node.js 22 o posterior, acceso a Internet y una clave de Google AI Studio con acceso al modelo `gemini-3.1-flash-lite`. El código usa las bibliotecas incluidas en Node.js y no requiere instalar paquetes npm.

Comienza por la [guía para obtener y configurar la clave de Gemini](docs/CLAVE_GEMINI.md). Incluye creación del proyecto, copia de la clave, configuración del archivo y una prueba del chat.

### Windows con PowerShell

```powershell
git clone https://github.com/braescrus14-cloud/cenfotec-chatbot-ia.git
cd cenfotec-chatbot-ia
Copy-Item .env.example .env
notepad .env
```

En el archivo `.env`, sustituye el valor de `GEMINI_API_KEY` por tu clave completa y guarda el archivo. Inicia la aplicación desde la raíz del repositorio.

```powershell
npm start
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000). Mantén la terminal abierta durante el uso local y detén el servidor con Ctrl+C.

Si la ejecución de scripts de PowerShell bloquea `npm.ps1`, inicia Node directamente.

```powershell
node --env-file=.env Index/server.mjs
```

También puedes iniciar `Index/iniciar-chat.ps1` para introducir la clave de forma oculta si tu PowerShell permite ejecutar ese archivo. El script pide la clave en cada sesión cuando la variable de entorno está vacía.

### Linux o macOS

```bash
git clone https://github.com/braescrus14-cloud/cenfotec-chatbot-ia.git
cd cenfotec-chatbot-ia
cp .env.example .env
chmod 600 .env
nano .env
npm start
```

Introduce la clave en `.env` antes de iniciar la aplicación. Si la variable `GEMINI_API_KEY` ya está definida en tu terminal, Node usa ese valor por encima del archivo. Actualízala o elimínala de la sesión si corresponde a una clave antigua.

## Configuración

| Variable | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Clave de Google AI Studio necesaria para responder |
| `HOST` | Dirección de escucha. El valor local predeterminado es `127.0.0.1` |
| `PORT` | Puerto del servidor. El valor predeterminado es `3000` |

Docker establece `HOST=0.0.0.0` y `PORT=3000` dentro del contenedor. La guía EC2 publica ese puerto como `5001` en la instancia.

Si el puerto local está ocupado, cambia `PORT` a `3001` en `.env`, reinicia y abre esa nueva dirección.

## Prueba del chat

Pregunta «¿Cuál es el correo institucional y cuánto duran los programas técnicos?». La base suministrada indica `cenfotec@hotmail.es` y 3 semestres. Prueba una pregunta de seguimiento como «¿Y cuáles son los requisitos?».

El modelo debería remitir al asesor cuando falten costos vigentes, fechas, horarios o confirmación de la oferta por sede. Para temas ajenos a Cenfotec, sus instrucciones indican que debe ofrecer orientación dentro del alcance institucional.

## Información institucional

La base de origen tiene versión del 19 de noviembre de 2026 e incluye información del portafolio 2025. Contiene 12 programas detallados, antecedentes de becas y afiches históricos. También registra diferencias de dirección en Tame y Saravena y una discrepancia entre 12 programas detallados y 14 aprobados mencionados.

El contexto explica al asistente cómo tratar esos datos y cuándo derivar al asesor. Para actualizar la información, modifica la base de origen y `Index/contexto-cenfotec.txt`, manteniendo las reglas de respuesta al comienzo del contexto. El servidor lee ese archivo al arrancar. La actualización requiere reinicio y, con Docker, reconstruir la imagen.

## Clave y tratamiento de las conversaciones

La clave se guarda en el servidor y se envía únicamente en la llamada a Google. `.env` está excluido de Git y del contexto de construcción Docker.

Las conversaciones se guardan en `localStorage` del navegador. Cada consulta envía hasta 12 mensajes recientes al servidor y a Google junto con la base institucional completa. Revisa las condiciones del proyecto Gemini y el aviso de privacidad aplicable antes de atender datos reales de aspirantes.

La disponibilidad y los límites del nivel gratuito dependen del proyecto y las condiciones de Google. Consulta los [precios de Gemini](https://ai.google.dev/gemini-api/docs/pricing) y crea la clave en [Google AI Studio](https://aistudio.google.com/api-keys).

## Estado de validación

El 20 de noviembre de 2026 se comprobó el despliegue en EC2 con respuestas reales de Gemini, acceso HTTP público y contenedor saludable con reinicio automático. La publicación original usa HTTP en el puerto 5001. El acceso por IP puede cambiar al detener e iniciar una instancia con dirección asignada automáticamente.

Esta copia conserva el código y la información de esa versión. El diagrama está en [docs/arquitectura.png](docs/arquitectura.png).

## Referencias técnicas

- [Variables desde un archivo con Node.js](https://nodejs.org/api/cli.html#--env-filefile)
- [API de generación de texto de Gemini](https://ai.google.dev/gemini-api/docs/text-generation)
- [Instalación de Docker en Amazon Linux](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html)
- [Crear y configurar la clave de Gemini paso a paso](docs/CLAVE_GEMINI.md)
- [Documentación principal e informes del proyecto](docs/DOCUMENTACION_PRINCIPAL.md)
- [Informe técnico final de despliegue y evaluación en EC2](docs/documentacion/Informe_Tecnico_Chatbot_Cenfotec_IA_AWS_EC2.pdf)

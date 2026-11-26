# Documentación principal del proyecto

El proyecto desarrolla un chatbot de atención al cliente y orientación vocacional para los programas técnicos de Cenfotec SAS. Esta página reúne la documentación técnica y versiones de consulta de los informes académicos.

## Informe técnico final

El [Informe técnico de despliegue y evaluación en la nube](documentacion/Informe_Tecnico_Chatbot_Cenfotec_IA_AWS_EC2.pdf), fechado el 26 de noviembre de 2026, reúne el problema, los objetivos, los requisitos funcionales y no funcionales, la arquitectura, el despliegue con Docker en EC2, la integración con Gemini, las pruebas descritas, las conclusiones y las recomendaciones. La copia de nueve páginas oculta la dirección IP del despliegue.

## Lectura recomendada

1. Revisa el [informe de gestión e implementación](documentacion/Modelo_IG_Cenfotec_publico.docx) para conocer el diagnóstico, los objetivos y las acciones desarrolladas.
2. Consulta el [informe de fortalecimiento y capacitación](documentacion/FIS_Chatbot_Cenfotec.md) para revisar la población objetivo y el proceso de capacitación.
3. Examina la [arquitectura técnica](ARQUITECTURA.md) y el [diagrama suministrado con los informes](documentacion/Arquitectura.jpeg).
4. Sigue la [guía de la clave de Gemini](CLAVE_GEMINI.md) y la [instalación en EC2](INSTALACION_EC2.md) para reproducir el despliegue.

## Informes académicos

| Documento | Contenido |
| --- | --- |
| [Modelo IG de Cenfotec](documentacion/Modelo_IG_Cenfotec_publico.docx) | Desarrollo e implementación del chatbot. Incluye introducción, diagnóstico, objetivos, requerimientos y acciones de mejora |
| [FIS del chatbot](documentacion/FIS_Chatbot_Cenfotec.md) | Versión en texto del informe de capacitación, con identificación y contacto personal ocultos y fotografías retiradas |

Los documentos identifican como integrantes a Santiago Rios Manrique, Brian Felipe Gualdron Sandoval, Brayan Esteban Cruz Arango y Erika Yulieth Tibacuy Calderón, con acompañamiento del docente Manny Len Villa Suárez, en el contexto académico de las Unidades Tecnológicas de Santander.

## Arquitectura

El [diagrama suministrado](documentacion/Arquitectura.jpeg) describe el recorrido de una consulta entre el navegador, el servidor en EC2 y Gemini.

Las versiones de consulta ocultan identificaciones, teléfonos personales, correos personales o académicos de contacto y firmas. Las fotografías y los documentos tributarios y registrales se conservan fuera de esta publicación.

## Documentación técnica

| Guía | Qué permite hacer |
| --- | --- |
| [README](../README.md) | Entender el proyecto, su estructura y el inicio local |
| [Clave de Gemini](CLAVE_GEMINI.md) | Crear o localizar una clave en Google AI Studio, configurarla y probar el chat |
| [Instalación en EC2](INSTALACION_EC2.md) | Instalar Docker y desplegar la aplicación en Amazon Linux |
| [Arquitectura](ARQUITECTURA.md) | Comprender componentes, llamadas a la API, historial y límites |
| [Operación](OPERACION.md) | Actualizar, comprobar, recuperar y diagnosticar el servicio |
| [Base de conocimiento](Base_Conocimiento_Cenfotec.md) | Revisar los datos institucionales usados para preparar el contexto |

## Relación entre los informes y el código

Los informes se conservan como evidencia académica del proyecto. Para reproducir el comportamiento de esta versión, consulta el código de `Index/` y las guías técnicas.

Esta implementación utiliza un servidor Node.js en Docker sobre EC2 y la API de Google Gemini. El historial se guarda en el navegador del visitante y se envía parcialmente en cada consulta. La base de conocimiento se carga desde `contexto-cenfotec.txt`. Las menciones académicas a registro y análisis centralizado de consultas describen objetivos o formulaciones del informe; el backend de esta versión procesa cada consulta con el historial recibido.

La información comercial que requiere confirmación, incluidas las direcciones contradictorias y la cantidad de programas, se trata según las reglas documentadas en la base de conocimiento.

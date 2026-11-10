# Política de Privacidad y Aviso de Privacidad — Liquida Laboral

> **Versión:** 1.0
> **Fecha de revisión normativa:** 9 de noviembre de 2026
> **Normas revisadas:** Ley 1581 de 2012; Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015, arts. 2.2.2.25.1.1 y ss.); Decreto 090 de 2018; Ley 962 de 2005; Código Sustantivo del Trabajo; Ley 2466 de 2025.
> **Estado:** borrador de trabajo. La versión que se publique debe ser revisada y aprobada por un abogado antes de su uso con datos reales.

---

## 1. Dos roles que no deben confundirse

Esta aplicación tiene una arquitectura **local-first**: el cálculo ocurre íntegramente en el navegador del usuario y no existe servidor, base de datos remota, cuenta de usuario ni envío de información a terceros. Esa arquitectura determina quién responde por la protección de datos.

| Rol | Quién es | Qué hace | ¿Accede a datos de trabajadores? |
|---|---|---|---|
| **Proveedor de la aplicación** | La persona natural o jurídica que desarrolla y distribuye Liquida Laboral | Entrega el software; no opera un backend ni recibe los datos | **No** |
| **Responsable del tratamiento** | El empleador que usa la aplicación | Decide qué datos ingresa, para qué y cuánto tiempo los conserva | **Sí** |

Conforme al artículo 3, literal e), de la Ley 1581 de 2012, es **Responsable del Tratamiento** quien, por sí mismo o en asocio con otros, decide sobre la base de datos y/o el tratamiento. En este caso ese rol lo asume el empleador, no el proveedor de la herramienta.

**Consecuencia práctica:** los derechos de los trabajadores se ejercen ante el empleador. El proveedor no puede consultar, corregir ni suprimir datos que nunca recibe. Si un titular presenta una solicitud ante el proveedor, este debe informarle que el responsable es el empleador y, si es posible, remitir la solicitud al canal de este.

> **Revisar con abogado:** si en el futuro la aplicación incorpora sincronización en la nube, cuentas, analítica, soporte remoto con acceso al dispositivo o cualquier componente que reciba datos, el proveedor podría pasar a ser Encargado del Tratamiento (art. 3, literal d, Ley 1581) y requeriría contrato de transmisión (art. 25, Decreto 1377 de 2013). Esta política dejaría de ser exacta y debe actualizarse antes de ese cambio.

---

## 2. Qué hace la aplicación con los datos

En la versión revisada el 9 de noviembre de 2026:

- No hay servidor propio ni API.
- No hay registro, inicio de sesión ni cuentas.
- No hay cookies de analítica, publicidad ni rastreo.
- No hay llamadas a servicios externos de inteligencia artificial, voz, mapas o similares.
- Los datos se guardan en el **almacenamiento local del navegador** (`localStorage`) del dispositivo del usuario.
- Los archivos PDF, CSV y JSON se generan **en el mismo dispositivo** y solo se crean cuando el usuario lo decide.
- Las librerías de generación de PDF y CSV (`jspdf`, `jspdf-autotable`, `papaparse`) se ejecutan localmente y no envían información a internet.

**Única salvedad:** si la aplicación se publica en un sitio web (por ejemplo, un hosting estático), el proveedor de alojamiento puede registrar datos técnicos de conexión —dirección IP, agente de usuario, fecha y hora— en sus registros de servidor. Esos registros no contienen los datos de los trabajadores, porque el cálculo no sale del navegador, pero constituyen tratamiento de datos personales del visitante por parte del proveedor de hosting. El empleador debe verificar la política de privacidad del hosting y, si este se ubica fuera de Colombia, evaluar la transferencia internacional del artículo 26 de la Ley 1581.

---

## 3. Datos personales tratados por el empleador

La aplicación permite registrar los siguientes datos. El empleador decide cuáles ingresa; la recomendación es limitarse a los necesarios (principio de finalidad, art. 4, literal b, Ley 1581, y regla de recolección limitada, art. 4, Decreto 1377 de 2013).

| Categoría | Datos | ¿Necesario para liquidar? | Finalidad | Dónde queda |
|---|---|---|---|---|
| Identificación | Nombre y apellidos, tipo y número de documento | Sí, para individualizar el soporte | Identificar al trabajador en la liquidación y en el archivo laboral | `localStorage` del navegador |
| Laborales | Cargo, tipo de contrato, fecha de ingreso, fecha de retiro, días trabajados | Sí | Calcular antigüedad y prestaciones | `localStorage` |
| Económicos | Salario básico, promedio variable, auxilio de transporte, deducciones, bases de cálculo | Sí | Calcular cesantías, intereses, prima, vacaciones e indemnización | `localStorage` |
| Observaciones | Texto libre (por ejemplo, motivo del retiro) | Opcional | Contexto del caso | `localStorage` |
| Del dispositivo | Clave de almacenamiento, versión de la app | Técnico | Conservar el borrador entre sesiones | `localStorage` |

### 3.1 Advertencia sobre el campo de observaciones

El campo de texto libre puede recibir, sin que la aplicación lo solicite, datos sensibles en el sentido del artículo 5 de la Ley 1581: estado de salud, incapacidades, discapacidad, pertenencia sindical, convicciones religiosas, orientación sexual o datos biométricos.

**Recomendación:** no escribir datos sensibles en ese campo. Si el caso exige consignar una incapacidad o una condición de salud, debe hacerse en un documento aparte, con autorización explícita y acceso restringido, porque el tratamiento de datos sensibles está prohibido salvo las excepciones del artículo 6 de la Ley 1581 y exige las prevenciones del artículo 6 del Decreto 1377 de 2013 (informar que no hay obligación de autorizar y obtener consentimiento expreso).

---

## 4. Finalidades del tratamiento

Los datos se tratan exclusivamente para:

1. **Calcular la liquidación definitiva de prestaciones sociales e indemnizaciones** del trabajador.
2. **Generar los soportes** que el empleador decida exportar (PDF, CSV o JSON).
3. **Mantener el archivo laboral** del empleador para el cumplimiento de sus obligaciones legales, contables y probatorias.

**No se usan para:** mercadeo, perfilamiento, venta o cesión a terceros, entrenamiento de modelos de inteligencia artificial, ni fines estadísticos agregados. Cualquier finalidad distinta requiere nueva información al titular y, cuando corresponda, nueva autorización (art. 5, Decreto 1377 de 2013).

---

## 5. Base legal y autorización

### 5.1 Regla general

El artículo 9 de la Ley 1581 de 2012 exige **autorización previa e informada** del titular para el tratamiento, obtenida por cualquier medio que pueda ser objeto de consulta posterior. El artículo 3, literal a), la define como consentimiento **previo, expreso e informado**.

El artículo 7 del Decreto 1377 de 2013 admite que la autorización se manifieste por escrito, de forma oral o mediante conductas inequívocas, y prohíbe asimilar el silencio a una autorización.

### 5.2 Excepciones legales

El artículo 10 de la Ley 1581 de 2012 exceptúa la autorización únicamente en estos casos: información requerida por entidad pública o por orden judicial; datos de naturaleza pública; urgencia médica o sanitaria; fines históricos, estadísticos o científicos autorizados por ley; y datos del Registro Civil.

**La ejecución del contrato de trabajo no aparece como excepción autónoma.** Por eso, la lectura prudente es que el empleador debe informar y obtener autorización incluso para los datos de nómina, aunque parte del tratamiento también encuentre respaldo en mandatos legales (art. 4, literal c, Ley 1581, que releva el consentimiento cuando existe mandato legal o judicial).

### 5.3 Recomendación operativa

1. Entregar al trabajador, al inicio de la relación laboral o antes de usar la app con sus datos, el **aviso de privacidad** (arts. 14 y 15, Decreto 1377 de 2013) y la presente política.
2. Obtener autorización escrita o electrónica con, como mínimo: identificación del responsable, finalidad, datos tratados, derechos del titular y canal de atención.
3. Conservar prueba de la autorización (art. 8, Decreto 1377 de 2013; art. 17, literal b, Ley 1581).
4. No condicionar la vinculación laboral a la entrega de datos que no sean necesarios para la relación o para una obligación legal.

> **Revisar con abogado:** en la relación laboral existe subordinación, y la doctrina y la autoridad han discutido si el consentimiento del trabajador es verdaderamente libre. Un abogado laboralista debe definir, para el caso concreto, qué datos se amparan en una obligación legal, cuáles requieren autorización y cómo redactar el formato para que sea válido y no se convierta en una cláusula abusiva.

---

## 6. Datos de niños, niñas y adolescentes

El artículo 7 de la Ley 1581 prohíbe el tratamiento de datos de niños, niñas y adolescentes, salvo los de naturaleza pública, y el artículo 12 del Decreto 1377 de 2013 exige que el tratamiento respete el interés superior del menor y que la autorización la otorgue su **representante legal**, previa valoración de la opinión del menor según su madurez.

La aplicación está pensada para relaciones laborales de personas adultas. Si se usa para liquidar a un **aprendiz menor de edad** o a un trabajador adolescente con autorización para trabajar:

- Verificar la autorización de trabajo del menor conforme al Código Sustantivo del Trabajo.
- Obtener la autorización del representante legal para el tratamiento de sus datos.
- Extremar la minimización y el acceso restringido.

> **Revisar con abogado:** cualquier uso con datos de menores debe validarse caso a caso.

---

## 7. `localStorage`: qué se guarda, cómo se borra y qué riesgos tiene

### 7.1 Naturaleza

`localStorage` es un almacén del navegador asociado al origen del sitio. **No está cifrado**, persiste después de cerrar el navegador y puede ser leído por el mismo sitio y, en ciertos escenarios, por extensiones del navegador o por terceros que comprometan el dispositivo.

### 7.2 Implicaciones

- Quien tenga acceso físico o remoto al dispositivo y al perfil del navegador puede leer la información.
- Si el navegador tiene **sincronización activada** (Chrome, Edge, cuentas corporativas), el contenido puede replicarse en otros dispositivos vinculados a la misma cuenta.
- Borrar la caché o los datos del sitio elimina el borrador guardado, pero **no** elimina los archivos PDF, CSV o JSON que ya se hayan exportado.
- El proveedor de la aplicación no puede borrar datos del navegador del usuario; solo el usuario puede hacerlo.

### 7.3 Cómo eliminar los datos

1. Usar la opción de borrado dentro de la aplicación, si existe.
2. Si no existe, borrar los datos del sitio desde la configuración del navegador (sitios web → datos almacenados → eliminar).
3. Revisar y eliminar los archivos exportados que ya no se necesiten (carpeta de descargas, correo, nube, USB).
4. Si el equipo es compartido, eliminar también el perfil de usuario del sistema operativo o los respaldos.

### 7.4 Recomendaciones

- Usar un perfil de navegador exclusivo para el trabajo y con sincronización desactivada.
- No usar la app en equipos públicos o compartidos con datos reales.
- Cerrar sesión del sistema operativo al terminar.

---

## 8. Conservación y supresión

El artículo 11 del Decreto 1377 de 2013 permite recolectar, almacenar, usar o circular datos solo durante el tiempo razonable y necesario para la finalidad, y obliga a suprimirlos cuando esta se cumpla, salvo que exista un deber legal o contractual de conservación.

Criterios orientativos para el archivo laboral colombiano:

| Tipo de información | Referencia | Plazo orientativo |
|---|---|---|
| Derechos laborales y soportes de liquidación | Prescripción general de acciones laborales, art. 488 del Código Sustantivo del Trabajo (modificado por la Ley 2466 de 2025) | 3 años desde que la obligación se hace exigible |
| Libros y papeles contables | Art. 60 del Código de Comercio, modificado por el art. 28 de la Ley 962 de 2005 | 10 años desde el cierre o el último asiento |
| Obligaciones tributarias y parafiscales | Estatuto Tributario y normativa de seguridad social | Según el término que defina el contador |

**Regla de oro:** conservar lo que exija la ley, no más. Cuando el plazo se cumpla, suprimir el dato del `localStorage` y de los respaldos, y dejar constancia de la supresión.

> **Revisar con abogado y contador:** los plazos anteriores son referencias generales. El plazo aplicable depende del tipo de documento, del régimen tributario y de si hay un proceso en curso. La tabla de retención debe aprobarla un profesional.

---

## 9. Medidas de seguridad

El artículo 4, literal g), de la Ley 1581 y el artículo 17, literal d), imponen manejar la información con medidas técnicas, humanas y administrativas que eviten su adulteración, pérdida, consulta o acceso no autorizado.

Como la seguridad depende del dispositivo del empleador, las medidas mínimas son:

- **Control de acceso:** contraseña o biometría en el equipo; usuario del sistema operativo individual; bloqueo automático de pantalla.
- **Cifrado del disco:** FileVault (macOS), BitLocker (Windows) o equivalente en Linux.
- **Actualizaciones:** sistema operativo, navegador y extensiones al día.
- **Extensiones:** instalar solo las necesarias y revisar sus permisos; una extensión maliciosa puede leer `localStorage`.
- **Exportaciones:** guardar los PDF/CSV/JSON en una carpeta controlada, con acceso restringido; no dejarlos en Descargas ni enviarlos por canales informales sin necesidad.
- **Respaldos:** si se hacen, que sean cifrados y con acceso limitado; un respaldo sin cifrar es una copia de riesgo.
- **Dispositivos:** no usar equipos personales de terceros ni equipos públicos con datos reales.
- **Baja del trabajador:** definir quién conserva el soporte, dónde y por cuánto tiempo.

### 9.1 Incidentes de seguridad

Si se pierde el dispositivo, se detecta acceso no autorizado o se filtra un archivo exportado, el empleador debe:

1. Contener el incidente (bloqueo remoto, cambio de contraseñas, retiro del archivo).
2. Documentar qué pasó, qué datos se vieron afectados y a quiénes.
3. Evaluar la notificación a la Superintendencia de Industria y Comercio, conforme al artículo 17, literal n), de la Ley 1581, que impone informar las violaciones a los códigos de seguridad cuando existan riesgos para los titulares.
4. Informar a los trabajadores afectados si el riesgo es relevante.

> **Revisar con abogado:** la obligación y el procedimiento de notificación de incidentes deben confirmarse con la normativa y las instrucciones vigentes de la SIC al momento del hecho.

---

## 10. Transferencias y transmisiones internacionales

- **La aplicación no transfiere ni transmite datos.** No hay servidor, encargado ni destinatario.
- **El proveedor de hosting** puede tratar datos técnicos de conexión (IP, agente de usuario) en sus registros. Si está fuera de Colombia, el proveedor debe evaluar la transferencia conforme al artículo 26 de la Ley 1581.
- **Si el empleador exporta y envía** un PDF, CSV o JSON por correo, WhatsApp, nube o cualquier otro medio, esa transferencia la decide el empleador y debe evaluar:
  - que el destinatario sea necesario para la finalidad;
  - que exista autorización o una excepción del artículo 26 de la Ley 1581;
  - que el país de destino ofrezca un nivel adecuado de protección o se configure una excepción.

**No hay transmisión a encargados por parte de la aplicación.** Si el empleador contrata a un contador, a un abogado o a un servicio de nube, ese tercero puede ser Encargado o Responsable según el caso, y requiere contrato y instrucciones (art. 25, Decreto 1377 de 2013).

### 10.1 RGPD

El RGPD (Reglamento UE 2016/679) no resulta aplicable por defecto a un empleador colombiano que trata datos de trabajadores en Colombia y no ofrece bienes o servicios a personas en la Unión Europea. Si el empleador tiene trabajadores o establecimientos en la UE, o usa proveedores que tratan datos allí, debe evaluar su aplicabilidad con un abogado.

---

## 11. Derechos del titular

El artículo 8 de la Ley 1581 reconoce al titular los derechos a:

1. **Conocer, actualizar y rectificar** sus datos frente al responsable o encargado.
2. **Solicitar prueba de la autorización** otorgada, salvo las excepciones legales.
3. **Ser informado**, previa solicitud, sobre el uso dado a sus datos.
4. **Presentar quejas** ante la Superintendencia de Industria y Comercio por infracciones a la ley.
5. **Revocar la autorización y/o solicitar la supresión** del dato cuando el tratamiento no respete los principios, derechos y garantías legales.
6. **Acceder en forma gratuita** a sus datos personales.

### 11.1 Cómo se ejercen

El titular, sus causahabientes, su representante o apoderado pueden presentar la solicitud por el canal indicado en la sección 12, acreditando identidad o representación (art. 20, Decreto 1377 de 2013).

### 11.2 Plazos

| Tipo de solicitud | Plazo legal | Prórroga máxima |
|---|---|---|
| Consulta (art. 14, Ley 1581) | 10 días hábiles desde el recibo | 5 días hábiles más, informando motivos y fecha |
| Reclamo (art. 15, Ley 1581) | 15 días hábiles desde el día siguiente al recibo | 8 días hábiles más, informando motivos y fecha |

Durante el trámite del reclamo debe insertarse la leyenda **"reclamo en trámite"** en la base de datos (art. 15, numeral 2, Ley 1581).

### 11.3 Antes de acudir a la SIC

El artículo 16 de la Ley 1581 exige agotar el trámite de consulta o reclamo ante el responsable antes de presentar la queja ante la Superintendencia. La SIC atiende por su sede electrónica y sus canales oficiales (`www.sic.gov.co`).

### 11.4 Límite al derecho de supresión

La supresión y la revocatoria no proceden cuando el titular tenga un deber legal o contractual de permanecer en la base de datos (art. 9, Decreto 1377 de 2013). Por eso, el empleador puede negar motivadamente la supresión de datos que está obligado a conservar, pero debe suprimir lo que no tenga respaldo legal.

El literal e) del artículo 8 de la Ley 1581 fue declarado **condicionalmente exequible** por la Corte Constitucional. En la práctica, el titular puede solicitar la revocatoria o la supresión y el responsable debe responder de fondo y motivadamente; la SIC puede ordenar la medida cuando verifique una conducta contraria a la ley. No es admisible responder con una negativa genérica.

> **Revisar con abogado:** la procedencia de la supresión en cada caso (por ejemplo, cuando hay un proceso judicial o una obligación contable pendiente) debe evaluarse con el expediente a la mano.

---

## 12. Canal de atención y responsable

| Campo | Dato |
|---|---|
| Responsable | `[NOMBRE O RAZÓN SOCIAL DEL EMPLEADOR]` |
| NIT | `[NIT]` |
| Domicilio | `[CIUDAD, DEPARTAMENTO]` |
| Dirección | `[DIRECCIÓN FÍSICA]` |
| Correo para privacidad | `[CORREO DE PRIVACIDAD]` |
| Teléfono | `[TELÉFONO]` |
| Persona o área responsable | `[PERSONA O ÁREA ENCARGADA DE ATENDER SOLICITUDES]` |
| Horario de atención | `[HORARIO]` |

El artículo 23 del Decreto 1377 de 2013 exige designar a una persona o área que asuma la función de protección de datos y tramite las solicitudes de los titulares. En una micro o pequeña empresa puede ser el gerente, el área de talento humano o quien haga sus veces, pero debe estar identificado y disponible.

**Recomendación:** usar un correo dedicado (`privacidad@...`) y no el correo personal de un empleado, para que la solicitud no se pierda cuando esa persona cambie de cargo.

---

## 13. Registro Nacional de Bases de Datos (RNBD)

El artículo 25 de la Ley 1581 crea el RNBD, administrado por la SIC. El Decreto 090 de 2018 limitó la obligación de inscripción a:

- sociedades y entidades sin ánimo de lucro con **activos totales superiores a 100.000 UVT**;
- personas jurídicas de naturaleza pública.

Para 2026, con una UVT de $52.374 (Resolución DIAN 000238 de 2025), el umbral equivale aproximadamente a **$5.237.400.000** en activos totales. Las personas naturales no están obligadas a inscribirse, aunque sí deben cumplir el resto de la Ley 1581.

**Nota:** la obligación de registrar no se deduce del número de empleados ni de los ingresos. Si el empleador es una sociedad que supera el umbral, debe verificar los plazos y trámites vigentes en `www.sic.gov.co`, que la SIC actualiza periódicamente.

---

## 14. Vigencia, cambios y versión

- **Vigencia de esta política:** desde su publicación hasta que se reemplace por una nueva versión.
- **Vigencia de la base de datos:** mientras exista la relación laboral y durante los plazos legales de conservación aplicables.
- **Cambios sustanciales:** si cambia la identificación del responsable o la finalidad, el empleador debe comunicarlo al titular antes de implementar la nueva política y, si cambia la finalidad, obtener nueva autorización (art. 5, Decreto 1377 de 2013).
- **Control de versiones:** registrar fecha, cambio y responsable de la aprobación.

| Versión | Fecha | Cambio | Aprobó |
|---|---|---|---|
| 1.0 | 9/11/2026 | Versión inicial | `[PENDIENTE]` |

---

## 15. Fuentes consultadas

Consultadas el 9 de noviembre de 2026:

- Ley 1581 de 2012, texto vigente: `http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html`
- Decreto 1377 de 2013, texto compilado: `https://normativa.colpensiones.gov.co/compilacion/docs/decreto_1377_2013.htm`
- Decreto 1074 de 2015, capítulos 25 y 26 (compilación): `https://www.suin-juriscol.gov.co`
- SIC, Registro Nacional de Bases de Datos: `https://www.sic.gov.co/registro-nacional-de-bases-de-datos`
- SIC, preguntas frecuentes RNBD: `https://sic.gov.co/preguntas-frecuentes-rnbd`
- Decreto 090 de 2018 (ámbito del RNBD).
- Ley 962 de 2005, artículo 28 (conservación de libros y papeles).
- Código de Comercio, artículo 60.
- Código Sustantivo del Trabajo, artículo 488 (modificado por la Ley 2466 de 2025).
- Ley 2466 de 2025, texto oficial: `https://sidn.ramajudicial.gov.co`

---

## 16. Limitación

Este documento es una política de privacidad operativa, no un concepto jurídico. No sustituye la revisión de un abogado con acceso al caso concreto, al contrato de trabajo, a la estructura societaria y a los flujos reales de datos del empleador. La normativa y las instrucciones de la SIC cambian; la fecha de revisión indica el corte de esta versión.

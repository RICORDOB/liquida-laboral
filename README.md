# Liquida Laboral

Calculadora de liquidaciones laborales definitivas en Colombia. 100% local: sin
backend, sin cuentas y sin que los datos salgan del navegador.

> **Resultado orientativo.** No es asesoría jurídica ni contable. Verifica los
> parámetros y los casos especiales con un contador o abogado laboralista antes
> de pagar.

## Qué calcula

- Cesantías e intereses sobre cesantías
- Prima de servicios
- Vacaciones causadas y no disfrutadas
- Indemnización por despido sin justa causa (Art. 64 CST)
- Indemnización por falta de preaviso (Art. 46 CST)
- Salario y auxilio de transporte pendientes
- Sanción por mora (Art. 65 CST)
- Deducciones: salud, pensión, fondo de solidaridad, retención y otras

Cada concepto muestra su base, días, fórmula y la norma que lo respalda, para
que el cálculo sea auditable.

## Modos de uso

- **Individual**: formulario guiado con vista previa en vivo y resumen final.
- **Lote CSV**: procesa varios trabajadores desde una plantilla; los errores de
  una fila no bloquean a las demás.
- **Historial**: guarda casos en `localStorage` y permite exportar/importar JSON.
- **Guía**: fórmulas, plazos legales, parámetros por año y preguntas frecuentes.

## Parámetros

Los SMMLV, auxilio de transporte y UVT están versionados por año (2015–2026) en
`src/engine/parametros.ts`. Verifica siempre la fuente oficial antes de pagar.

### Salario mínimo por año

Al marcar **«El trabajador devenga el salario mínimo»**, el motor segmenta el
periodo por año (y por semestre para la prima) y aplica el SMMLV y el auxilio
vigentes en cada tramo. Así, un contrato que empezó en 2021 y terminó en 2026 se
liquida con el SMMLV de cada año, no con el de 2026. Las vacaciones, la
indemnización y el salario pendiente usan el SMMLV del año de retiro.

> **Nota 2026**: el Decreto 1469 de 2025 fue suspendido provisionalmente por el
> Consejo de Estado y reafirmado por decreto del 18 de febrero de 2026.

## Stack

- **Vite + React 19 + TypeScript** (UI)
- **Tailwind CSS v4** (estilos)
- **Vitest + fast-check** (motor de cálculo y pruebas de propiedades)
- **PapaParse** (CSV)
- **jsPDF + jspdf-autotable** (PDF)

El motor de cálculo es TypeScript puro en `src/engine/`, independiente del
framework: recibe una entrada, devuelve un resultado auditable.

## Arquitectura

```
src/
├── engine/        # Motor de cálculo (sin React)
│   ├── calculo.ts     # Núcleo de liquidación
│   ├── fechas.ts      # Utilidades de fechas
│   ├── parametros.ts  # SMMLV, auxilio, UVT por año
│   ├── formato.ts     # Formato COP / números
│   ├── formulario.ts  # Conversión formulario <-> entrada
│   ├── validacion.ts  # Validación de entradas
│   ├── csv.ts         # Procesamiento por lote
│   └── pdf.ts         # Generación de PDF
├── lib/           # Persistencia y utilidades del navegador
│   ├── storage.ts     # localStorage (casos y borrador)
│   ├── descargas.ts   # Descargas en el navegador
│   └── markdown.tsx   # Renderizado de documentos legales
├── components/    # UI base (Icon, Card, Button, Field...)
├── features/
│   ├── liquidacion/   # Formulario + resultado
│   ├── lote/          # Procesamiento CSV
│   ├── historial/     # Casos guardados
│   ├── guia/          # Fórmulas y referencia
│   └── legal/         # Aviso, privacidad y términos
└── App.tsx        # Enrutado de vistas, header y footer
```

## Supuestos de la versión 1

- Los días se cuentan calendario, incluyendo ingreso y retiro; la proporción usa
  años de 360 días.
- Cesantías y prima se calculan sobre el salario reportado. Si hubo cambios,
  reporta el promedio del último año, o marca «salario mínimo» para que se use el
  SMMLV de cada año.
- Las cesantías ya consignadas y la prima ya pagada se excluyen con fechas
  opcionales.
- La retención en la fuente se ingresa manualmente; no se calcula sola.
- No cubre sector público, cesantías retroactivas, convenciones colectivas,
  salario en especie ni regímenes especiales.
- Parámetros cargados de 2015 a 2026; periodos anteriores a 2015 usan el SMMLV
  de 2015 (con advertencia).

## Desarrollo

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción
npm test           # pruebas del motor (vitest)
```

## Cumplimiento legal

El proyecto incluye borradores en `docs/legal/` (también servidos en
`/legal/*.md`): política de privacidad, términos, disclaimer y checklist de
cumplimiento. Son **borradores operativos** con placeholders (`[RAZÓN SOCIAL]`,
`[NIT]`, `[CORREO]`) que debes completar y hacer revisar por un abogado antes de
usar la app con datos reales.

## Privacidad

Nada sale del navegador: no hay analítica, cookies ni llamadas a terceros. Los
datos se guardan en `localStorage` y se exportan a PDF/CSV/JSON solo cuando tú lo
decides. En equipos compartidos, usa un perfil exclusivo y borra la información
al terminar.

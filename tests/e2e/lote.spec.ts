import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import writeXlsxFile from 'write-excel-file/node'
import { prepararApp } from './helpers'

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const ENCABEZADOS = [
  'documento',
  'nombre',
  'fecha_ingreso',
  'fecha_retiro',
  'tipo_contrato',
  'tipo_salario',
  'salario_basico',
  'promedio_variable',
  'auxilio_transporte',
  'salario_minimo',
  'motivo_terminacion',
  'vacaciones_disfrutadas',
  'dias_salario_pendiente',
  'cesantias_consignadas_hasta',
  'ultimo_pago_prima',
  'incluir_sancion_mora',
  'fecha_pago_liquidacion',
  'otras_deducciones',
  'retencion_fuente',
]

// Fila 1 válida, fila 2 con salario 0 (debe ir a errores sin bloquear a la primera).
const FILA_VALIDA = [
  '123',
  'Ana Pérez',
  '2024-01-15',
  '2026-06-30',
  'indefinido',
  'fijo',
  1_750_905,
  0,
  'si',
  'no',
  'renuncia',
  0,
  0,
  '2025-12-31',
  '2026-06-30',
  'no',
  '',
  0,
  0,
]

const FILA_INVALIDA = [
  '456',
  'Juan Roto',
  '2024-01-15',
  '2026-06-30',
  'indefinido',
  'fijo',
  0,
  0,
  'si',
  'no',
  'renuncia',
  0,
  0,
  '2025-12-31',
  '2026-06-30',
  'no',
  '',
  0,
  0,
]

async function subirXlsx(page: Page, filas: (string | number)[][]) {
  const buffer = await writeXlsxFile(filas).toBuffer()
  await page.setInputFiles('#archivoLote', {
    name: 'lote.xlsx',
    mimeType: MIME_XLSX,
    buffer,
  })
}

test.describe('Lote Excel', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
    await page.locator('header').getByRole('button', { name: 'Lote Excel' }).click()
  })

  test('procesa varias filas y separa los errores sin bloquear al resto', async ({ page }) => {
    await subirXlsx(page, [ENCABEZADOS, FILA_VALIDA, FILA_INVALIDA])

    await expect(page.getByText('Filas leídas')).toBeVisible()
    await expect(page.getByText('Resultados (1)')).toBeVisible()
    await expect(page.getByText('Filas con errores (1)')).toBeVisible()

    // La fila válida aparece en la tabla de resultados (celda) y la inválida
    // queda registrada con su mensaje de error, sin bloquear a la primera.
    await expect(page.getByRole('cell', { name: 'Ana Pérez', exact: true })).toBeVisible()
    await expect(page.getByText('El salario básico debe ser mayor que cero.')).toBeVisible()
  })

  test('avisa cuando no se encontraron filas de datos', async ({ page }) => {
    await subirXlsx(page, [ENCABEZADOS])

    await expect(
      page.getByText('No se encontraron filas. Revisa que el archivo tenga encabezados y datos.'),
    ).toBeVisible()
  })

  test('procesa datos pegados directamente desde el portapapeles', async ({ page }) => {
    const texto = [
      'documento\tnombre\tfecha_ingreso\tfecha_retiro\tsalario_basico',
      '123\tAna Pérez\t2024-01-15\t2026-06-30\t1750905',
      '456\tJuan Roto\t2024-01-15\t2026-06-30\t0',
    ].join('\n')

    await page.locator('#textoPegado').fill(texto)
    await page.getByRole('button', { name: 'Procesar datos pegados' }).click()

    await expect(page.getByText('Filas leídas')).toBeVisible()
    await expect(page.getByText('Resultados (1)')).toBeVisible()
    await expect(page.getByText('Filas con errores (1)')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Ana Pérez', exact: true })).toBeVisible()
  })
})

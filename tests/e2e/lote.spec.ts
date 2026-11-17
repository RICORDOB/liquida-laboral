import { test, expect } from '@playwright/test'
import { prepararApp } from './helpers'

// Fila 1 válida, fila 2 con salario 0 (debe ir a errores sin bloquear a la primera).
const CSV_LOTE = [
  'documento;nombre;fecha_ingreso;fecha_retiro;tipo_contrato;tipo_salario;salario_basico;auxilio_transporte;salario_minimo;motivo_terminacion;vacaciones_disfrutadas;dias_salario_pendiente;cesantias_consignadas_hasta;ultimo_pago_prima;incluir_sancion_mora;fecha_pago_liquidacion;otras_deducciones;retencion_fuente',
  '123;Ana Pérez;2024-01-15;2026-06-30;indefinido;fijo;1750905;si;no;renuncia;0;0;2025-12-31;2026-06-30;no;;0;0',
  '456;Juan Roto;2024-01-15;2026-06-30;indefinido;fijo;0;si;no;renuncia;0;0;2025-12-31;2026-06-30;no;;0;0',
].join('\n')

test.describe('Lote CSV', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
    await page.locator('header').getByRole('button', { name: 'Lote CSV' }).click()
  })

  test('procesa varias filas y separa los errores sin bloquear al resto', async ({ page }) => {
    await page.getByLabel('O pega el CSV').fill(CSV_LOTE)
    await page.getByRole('button', { name: 'Procesar texto' }).click()

    await expect(page.getByText('Filas leídas')).toBeVisible()
    await expect(page.getByText('Resultados (1)')).toBeVisible()
    await expect(page.getByText('Filas con errores (1)')).toBeVisible()

    // La fila válida aparece en la tabla de resultados (celda) y la inválida
    // queda registrada con su mensaje de error, sin bloquear a la primera.
    await expect(page.getByRole('cell', { name: 'Ana Pérez', exact: true })).toBeVisible()
    await expect(page.getByText('El salario básico debe ser mayor que cero.')).toBeVisible()
  })

  test('avisa cuando no se encontraron filas', async ({ page }) => {
    await page.getByLabel('O pega el CSV').fill('documento;nombre\n')
    await page.getByRole('button', { name: 'Procesar texto' }).click()

    await expect(
      page.getByText('No se encontraron filas. Revisa que el archivo tenga encabezados y datos.'),
    ).toBeVisible()
  })
})

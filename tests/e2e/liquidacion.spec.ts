import { test, expect } from '@playwright/test'
import { CASO_VALIDO, calcular, llenarFormularioValido, prepararApp } from './helpers'

test.describe('Liquidación individual', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
  })

  test('muestra la vista previa en vivo al completar datos válidos', async ({ page }) => {
    await llenarFormularioValido(page)

    // El subtítulo del neto estimado solo aparece cuando ya hay preview calculado.
    await expect(page.getByText(/días liquidados/)).toBeVisible()
  })

  test('calcula y muestra el resultado final', async ({ page }) => {
    await llenarFormularioValido(page)
    await calcular(page)

    await expect(page.getByText('Liquidación calculada')).toBeVisible()
    await expect(page.getByRole('heading', { name: CASO_VALIDO.nombre })).toBeVisible()
    await expect(page.getByText('Neto a pagar').first()).toBeVisible()
  })

  test('permite volver a editar desde el resultado', async ({ page }) => {
    await llenarFormularioValido(page)
    await calcular(page)

    await page.getByRole('button', { name: 'Editar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Liquidación laboral definitiva' }),
    ).toBeVisible()
  })
})

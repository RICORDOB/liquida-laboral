import { test, expect } from '@playwright/test'
import { CASO_VALIDO, calcular, llenarFormularioValido, prepararApp } from './helpers'

async function guardarCaso(page: import('@playwright/test').Page) {
  await llenarFormularioValido(page)
  await calcular(page)
  await page.getByRole('button', { name: 'Guardar caso' }).click()
}

test.describe('Historial', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
  })

  test('guarda un caso y lo muestra en el historial', async ({ page }) => {
    await guardarCaso(page)

    await page.locator('header').getByRole('button', { name: 'Historial' }).click()

    await expect(page.getByText(CASO_VALIDO.nombre)).toBeVisible()
    await expect(page.getByText('Neto a pagar').first()).toBeVisible()
  })

  test('elimina un caso guardado', async ({ page }) => {
    await guardarCaso(page)
    await page.locator('header').getByRole('button', { name: 'Historial' }).click()

    await page
      .getByRole('button', { name: `Eliminar ${CASO_VALIDO.nombre}` })
      .click()
    await page.getByRole('button', { name: 'Sí, eliminar' }).click()

    await expect(page.getByText('No hay casos guardados todavía')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'
import { prepararApp } from './helpers'

test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
  })

  test('navega entre las vistas principales', async ({ page }) => {
    const header = page.locator('header')

    await expect(
      page.getByRole('heading', { name: 'Liquidación laboral' }),
    ).toBeVisible()

    await header.getByRole('button', { name: 'Lote Excel' }).click()
    await expect(
      page.getByRole('heading', { name: 'Liquida varios trabajadores desde un Excel' }),
    ).toBeVisible()

    await header.getByRole('button', { name: 'Historial' }).click()
    await expect(
      page.getByRole('heading', { name: 'Liquidaciones guardadas' }),
    ).toBeVisible()

    await header.getByRole('button', { name: 'Guía' }).click()
    await expect(
      page.getByRole('heading', { name: 'Cómo se calcula cada concepto' }),
    ).toBeVisible()
  })

  test('accede a la vista legal desde el footer', async ({ page }) => {
    await page.locator('footer').getByRole('button', { name: 'Aviso legal' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tus datos y esta herramienta' }),
    ).toBeVisible()
  })
})

test.describe('Aviso legal', () => {
  test('solicita aceptar el aviso la primera vez y lo desbloquea', async ({ page }) => {
    // Sin marcar el aviso como aceptado: solo se limpia el almacenamiento.
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')

    await expect(page.getByText('Antes de continuar')).toBeVisible()

    const continuar = page.getByRole('button', { name: 'Continuar' })
    await expect(continuar).toBeDisabled()

    await page.getByRole('checkbox', { name: /Entiendo y acepto/ }).check()
    await continuar.click()

    await expect(page.getByText('Antes de continuar')).toHaveCount(0)
  })
})

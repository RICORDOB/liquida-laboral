import { test, expect } from '@playwright/test'
import { prepararApp } from './helpers'

test.describe('Validación del formulario', () => {
  test.beforeEach(async ({ page }) => {
    await prepararApp(page)
  })

  test('muestra errores al calcular sin datos', async ({ page }) => {
    await page.getByRole('button', { name: 'Calcular liquidación' }).click()

    await expect(page.getByText('Revisa estos datos')).toBeVisible()
    // Cada mensaje aparece también junto al campo; usamos .first() para evitar strict mode.
    await expect(page.getByText('Ingresa el nombre del trabajador.').first()).toBeVisible()
    await expect(page.getByText('La fecha de ingreso no es válida.').first()).toBeVisible()
    await expect(page.getByText('El salario básico debe ser mayor que cero.').first()).toBeVisible()
  })

  test('valida que la fecha de retiro no sea anterior al ingreso', async ({ page }) => {
    await page.getByLabel('Nombre completo').fill('Ana María Pérez')
    await page.getByLabel('Fecha de ingreso').fill('2026-06-30')
    await page.getByLabel('Fecha de retiro').fill('2024-01-15')
    await page.getByLabel('Salario básico mensual').fill('1750905')

    await page.getByRole('button', { name: 'Calcular liquidación' }).click()

    await expect(page.getByText('Revisa estos datos')).toBeVisible()
    await expect(
      page.getByText('La fecha de retiro no puede ser anterior a la fecha de ingreso.').first(),
    ).toBeVisible()
  })
})

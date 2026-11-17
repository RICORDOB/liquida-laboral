import type { Page } from '@playwright/test'

/** Clave del aviso legal (coincide con `CLAVE_AVISO` en src/App.tsx). */
const CLAVE_AVISO = 'liquida-laboral:aviso-aceptado:v1'

/** Caso válido mínimo: contrato indefinido, salario fijo, renuncia. */
export const CASO_VALIDO = {
  nombre: 'Ana María Pérez',
  fechaIngreso: '2024-01-15',
  fechaRetiro: '2026-06-30',
  salario: '1750905',
}

/**
 * Prepara una página limpia para la mayoría de tests: borra localStorage
 * (sin casos ni borrador previos) y marca el aviso legal como aceptado.
 */
export async function prepararApp(page: Page) {
  await page.addInitScript(
    (claveAviso) => {
      localStorage.clear()
      localStorage.setItem(claveAviso, '1')
    },
    CLAVE_AVISO,
  )
  await page.goto('/')
}

/** Completa los campos mínimos para un cálculo válido. */
export async function llenarFormularioValido(page: Page) {
  await page.getByLabel('Nombre completo').fill(CASO_VALIDO.nombre)
  await page.getByLabel('Fecha de ingreso').fill(CASO_VALIDO.fechaIngreso)
  await page.getByLabel('Fecha de retiro').fill(CASO_VALIDO.fechaRetiro)
  await page.getByLabel('Salario básico mensual').fill(CASO_VALIDO.salario)
}

/** Hace clic en el botón principal que dispara el cálculo. */
export async function calcular(page: Page) {
  await page.getByRole('button', { name: 'Calcular liquidación' }).click()
}

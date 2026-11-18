import { test, expect } from '@playwright/test'
import { calcular, llenarFormularioValido } from './helpers'

const CLAVE_AVISO = 'liquida-laboral:aviso-aceptado:v1'
const CLAVE_EMPRESA = 'liquida-laboral:empresa:v1'

test.describe('Empresa', () => {
  test('guarda los datos de la empresa y persisten tras recargar', async ({ page }) => {
    // Solo se marca el aviso como aceptado (sin borrar en cada recarga).
    await page.addInitScript((clave) => {
      localStorage.setItem(clave, '1')
    }, CLAVE_AVISO)
    await page.goto('/')

    await page.locator('header').getByRole('button', { name: 'Empresa' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tu empresa en los documentos' }),
    ).toBeVisible()

    await page.getByLabel('Razón social o nombre').fill('Mi Empresa S.A.S.')
    await page.getByLabel('NIT').fill('900.123.456-7')
    await page.getByRole('button', { name: 'Guardar datos' }).click()
    await expect(page.getByRole('button', { name: 'Guardado' })).toBeVisible()

    // Recarga y confirma que los datos quedaron en el navegador.
    await page.reload()
    await page.locator('header').getByRole('button', { name: 'Empresa' }).click()
    await expect(page.getByLabel('Razón social o nombre')).toHaveValue('Mi Empresa S.A.S.')
    await expect(page.getByLabel('NIT')).toHaveValue('900.123.456-7')
  })

  test('genera el PDF con los datos de la empresa y el logo', async ({ page }) => {
    await page.addInitScript(
      ({ claveAviso, claveEmpresa }) => {
        localStorage.setItem(claveAviso, '1')
        // Logo válido de 2×2 píxeles generado en el navegador.
        const canvas = document.createElement('canvas')
        canvas.width = 2
        canvas.height = 2
        const contexto = canvas.getContext('2d')
        if (contexto) {
          contexto.fillStyle = '#0f766e'
          contexto.fillRect(0, 0, 2, 2)
        }
        localStorage.setItem(
          claveEmpresa,
          JSON.stringify({
            razonSocial: 'Mi Empresa S.A.S.',
            nit: '900.123.456-7',
            ciudad: 'Bogotá D.C.',
            direccion: 'Calle 1 # 2-3',
            telefono: '601 000 0000',
            correo: 'contacto@miempresa.com',
            logo: canvas.toDataURL('image/png'),
          }),
        )
      },
      { claveAviso: CLAVE_AVISO, claveEmpresa: CLAVE_EMPRESA },
    )
    await page.goto('/')

    await llenarFormularioValido(page)
    await calcular(page)

    const descarga = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar PDF' }).click()
    const archivo = await descarga
    expect(archivo.suggestedFilename()).toContain('.pdf')
  })
})

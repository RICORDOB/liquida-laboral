import { describe, expect, it } from 'vitest'
import { diffDiasInclusivo, fechaValida, inicioSemestre, sumarDias } from './fechas'

describe('fechas', () => {
  it('valida fechas ISO reales', () => {
    expect(fechaValida('2026-02-28')).toBe(true)
    expect(fechaValida('2026-02-29')).toBe(false)
    expect(fechaValida('2024-02-29')).toBe(true)
    expect(fechaValida('2026-13-01')).toBe(false)
    expect(fechaValida('')).toBe(false)
  })

  it('cuenta días calendario incluyendo ambos extremos', () => {
    expect(diffDiasInclusivo('2026-01-01', '2026-01-01')).toBe(1)
    expect(diffDiasInclusivo('2026-01-01', '2026-01-31')).toBe(31)
    expect(diffDiasInclusivo('2026-01-01', '2026-12-31')).toBe(365)
    expect(diffDiasInclusivo('2024-01-01', '2024-12-31')).toBe(366)
  })

  it('suma días sin problemas de zona horaria', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29')
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('detecta el inicio del semestre', () => {
    expect(inicioSemestre('2026-03-15')).toBe('2026-01-01')
    expect(inicioSemestre('2026-07-01')).toBe('2026-07-01')
    expect(inicioSemestre('2026-12-31')).toBe('2026-07-01')
  })
})

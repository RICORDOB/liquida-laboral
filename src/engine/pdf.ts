import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ADVERTENCIA_GENERAL } from './calculo'
import { formatearFecha } from './fechas'
import { formatCOP, formatDias } from './formato'
import type { ResultadoLiquidacion } from './types'

const TEAL: [number, number, number] = [15, 118, 110]
const SLATE: [number, number, number] = [15, 23, 42]
const MUTED: [number, number, number] = [71, 85, 105]
const LINE: [number, number, number] = [226, 232, 240]
const SOFT: [number, number, number] = [248, 250, 252]

function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function finalY(doc: jsPDF, fallback: number): number {
  const conTabla = doc as unknown as { lastAutoTable?: { finalY: number } }
  return conTabla.lastAutoTable?.finalY ?? fallback
}

export function generarPDF(resultado: ResultadoLiquidacion): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margen = 14
  const anchoUtil = 210 - margen * 2
  const { entrada, parametros } = resultado

  doc.setFillColor(...TEAL)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Liquidación laboral definitiva', margen, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Liquida Laboral · Colombia', margen, 21)
  doc.text(`Generado: ${formatearFecha(new Date().toISOString().slice(0, 10))}`, 196, 21, {
    align: 'right',
  })

  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(entrada.empleado.nombre || 'Trabajador sin nombre', margen, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)

  const datosIzquierda = [
    `Documento: ${entrada.empleado.documento || '—'}`,
    `Contrato: ${entrada.contrato.tipo}`,
    `Ingreso: ${formatearFecha(entrada.contrato.fechaIngreso)}`,
    `Retiro: ${formatearFecha(entrada.contrato.fechaRetiro)}`,
    `Días liquidados: ${resultado.diasTotales} (${formatDias(resultado.aniosEquivalentes)} años)`,
  ]

  const datosDerecha = [
    `Salario base: ${formatCOP(resultado.salarioOrdinario)}`,
    `Auxilio de transporte: ${formatCOP(resultado.auxilio)}`,
    `Tipo de salario: ${entrada.contrato.tipoSalario}`,
    `Motivo: ${entrada.terminacion.motivo.replace(/_/g, ' ')}`,
    `SMMLV ${parametros.anio}: ${formatCOP(parametros.smmlv)}`,
  ]

  datosIzquierda.forEach((linea, indice) => {
    doc.text(linea, margen, 46 + indice * 4.5)
  })
  datosDerecha.forEach((linea, indice) => {
    doc.text(linea, margen + anchoUtil / 2, 46 + indice * 4.5)
  })

  let y = 72

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...TEAL)
  doc.text('Devengos', margen, y)
  y += 3

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Base', 'Días', 'Fórmula', 'Valor', 'Norma']],
    body: resultado.conceptos.map((concepto) => [
      concepto.nombre,
      formatCOP(concepto.base),
      formatDias(concepto.dias),
      concepto.formula,
      formatCOP(concepto.valor),
      concepto.norma,
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      textColor: SLATE,
      lineColor: LINE,
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: TEAL,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    alternateRowStyles: { fillColor: SOFT },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 23, halign: 'right' },
      2: { cellWidth: 12, halign: 'right' },
      3: { cellWidth: 46 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 33 },
    },
    margin: { left: margen, right: margen },
  })

  y = finalY(doc, y) + 7

  if (resultado.deducciones.length > 0) {
    if (y > 235) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...TEAL)
    doc.text('Deducciones', margen, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Base', 'Fórmula', 'Valor', 'Norma']],
      body: resultado.deducciones.map((deduccion) => [
        deduccion.nombre,
        formatCOP(deduccion.base),
        deduccion.formula,
        formatCOP(deduccion.valor),
        deduccion.norma,
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        textColor: SLATE,
        lineColor: LINE,
        lineWidth: 0.1,
      },
      headStyles: { fillColor: [190, 24, 93], textColor: 255, fontSize: 7.2 },
      alternateRowStyles: { fillColor: SOFT },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 50 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 22 },
      },
      margin: { left: margen, right: margen },
    })

    y = finalY(doc, y) + 7
  }

  if (y > 225) {
    doc.addPage()
    y = 20
  }

  doc.setFillColor(240, 253, 250)
  doc.setDrawColor(...TEAL)
  doc.roundedRect(margen, y, anchoUtil, 26, 2, 2, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text('Total devengado', margen + 5, y + 7)
  doc.text('Total deducciones', margen + 5, y + 13)
  doc.text('Neto a pagar', margen + 5, y + 21)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE)
  doc.setFontSize(9)
  doc.text(formatCOP(resultado.totalDevengado), 196, y + 7, { align: 'right' })
  doc.text(formatCOP(resultado.totalDeducciones), 196, y + 13, { align: 'right' })
  doc.setFontSize(13)
  doc.setTextColor(...TEAL)
  doc.text(formatCOP(resultado.netoPagar), 196, y + 21, { align: 'right' })

  y += 33

  if (resultado.advertencias.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(180, 83, 9)
    doc.text('Advertencias', margen, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)

    for (const advertencia of resultado.advertencias) {
      const lineas = doc.splitTextToSize(`- ${advertencia}`, anchoUtil)
      if (y + lineas.length * 3.4 > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(lineas, margen, y)
      y += lineas.length * 3.4 + 1
    }

    y += 3
  }

  if (y > 250) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...SLATE)
  doc.text('Parámetros aplicados', margen, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  const parametrosTexto = `SMMLV ${parametros.anio}: ${formatCOP(
    parametros.smmlv,
  )} · Auxilio: ${formatCOP(parametros.auxilioTransporte)} · UVT: ${formatCOP(
    parametros.uvt,
  )} · Fuente: ${parametros.fuente}`
  doc.text(doc.splitTextToSize(parametrosTexto, anchoUtil), margen, y)
  y += 8

  const disclaimer = doc.splitTextToSize(ADVERTENCIA_GENERAL, anchoUtil)
  doc.setFontSize(6.8)
  doc.setTextColor(100, 116, 139)
  doc.text(disclaimer, margen, y)

  const totalPaginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Liquida Laboral · Documento de estimación · Página ${pagina} de ${totalPaginas}`,
      105,
      290,
      { align: 'center' },
    )
  }

  return doc
}

export function descargarPDF(resultado: ResultadoLiquidacion): void {
  const doc = generarPDF(resultado)
  const nombre = `liquidacion-${slug(resultado.entrada.empleado.nombre || 'trabajador')}-${
    resultado.entrada.contrato.fechaRetiro
  }.pdf`
  doc.save(nombre)
}

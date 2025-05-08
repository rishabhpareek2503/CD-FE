/**
 * Data Export Service
 * Handles exporting data to various formats (PDF, Excel, CSV)
 */

import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

export type ExportFormat = "pdf" | "excel" | "csv"

interface ExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  orientation?: "portrait" | "landscape"
}

export class DataExportService {
  public static exportData(data: any[], format: ExportFormat, options: ExportOptions): void {
    switch (format) {
      case "pdf":
        this.exportToPDF(data, options)
        break
      case "excel":
        this.exportToExcel(data, options.filename || "data")
        break
      case "csv":
        this.exportToCSV(data, options.filename || "data")
        break
      default:
        throw new Error("Unsupported export format")
    }
  }

  public static exportSensorData(
    data: any[],
    device: any,
    format: ExportFormat,
    dateRange?: { from: Date; to: Date },
  ): void {
    const filename = `sensor-data-${device.id}-${new Date().toISOString().split("T")[0]}`
    const title = `Sensor Data for ${device.name || device.id}`
    const subtitle = `Device ID: ${device.id} - Location: ${device.location || "Unknown"}`

    // Add date range to subtitle if provided
    const dateRangeText = dateRange
      ? `\nDate Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
      : ""

    this.exportData(data, format, {
      filename,
      title,
      subtitle: subtitle + dateRangeText,
      orientation: "landscape",
    })
  }

  public static exportDeviceHistory(
    data: any[],
    device: any,
    format: ExportFormat,
    dateRange?: { from: Date; to: Date },
  ): void {
    const filename = `device-history-${device.id}-${new Date().toISOString().split("T")[0]}`
    const title = `Historical Data for ${device.name || device.id}`
    const subtitle = `Device ID: ${device.id} - Location: ${device.location || "Unknown"}`

    // Add date range to subtitle if provided
    const dateRangeText = dateRange
      ? `\nDate Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
      : ""

    this.exportData(data, format, {
      filename,
      title,
      subtitle: subtitle + dateRangeText,
      orientation: "landscape",
    })
  }

  public static exportReport(
    data: any[],
    reportType: string,
    format: ExportFormat,
    options?: { deviceId?: string; dateRange?: { from: Date; to: Date } },
  ): void {
    const date = new Date().toISOString().split("T")[0]
    const filename = `${reportType.toLowerCase().replace(/\s+/g, "-")}-report-${date}`
    const title = `${reportType} Report`

    let subtitle = `Generated on ${new Date().toLocaleString()}`
    if (options?.deviceId) {
      subtitle += `\nDevice ID: ${options.deviceId}`
    }
    if (options?.dateRange) {
      subtitle += `\nDate Range: ${options.dateRange.from.toLocaleDateString()} to ${options.dateRange.to.toLocaleDateString()}`
    }

    this.exportData(data, format, {
      filename,
      title,
      subtitle,
      orientation: reportType.includes("Compliance") ? "portrait" : "landscape",
    })
  }

  private static exportToPDF(data: any[], options: ExportOptions): void {
    const { title, subtitle, orientation } = options
    const doc = new jsPDF({
      orientation: orientation || "portrait",
      unit: "pt",
      format: "a4",
    })

    // Add title and subtitle
    if (title) {
      doc.setFontSize(18)
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" })
    }
    if (subtitle) {
      doc.setFontSize(10)
      const subtitleLines = subtitle.split("\n")
      let yPos = 60
      subtitleLines.forEach((line) => {
        doc.text(line, doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" })
        yPos += 15
      })
    }

    // Add timestamp
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      doc.internal.pageSize.getWidth() - 120,
      doc.internal.pageSize.getHeight() - 20,
    )

    // Add company logo/name
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text("HEEPL Wastewater Monitoring", 40, doc.internal.pageSize.getHeight() - 20)

    // AutoTable configuration
    const startY = subtitle ? subtitle.split("\n").length * 15 + 70 : 70
    const headerStyles = {
      fillColor: [26, 78, 126], // HEEPL blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
    }
    const alternateRowStyles = { fillColor: [240, 240, 240] }

    // Prepare headers and data for autoTable
    const headers = Object.keys(data[0] || {})
    const tableData = data
      .map((item) => Object.values(item))(
        // Add the table to the PDF
        doc as any,
      )
      .autoTable({
        head: [headers],
        body: tableData,
        startY: startY,
        headStyles: headerStyles,
        alternateRowStyles: alternateRowStyles,
        margin: { top: 80 },
        didDrawPage: (data: any) => {
          // Add header to each page
          doc.setFontSize(10)
          doc.setTextColor(40, 40, 40)
          doc.text(title || "Data Export", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })

          // Add page number
          doc.setFontSize(8)
          doc.text(
            `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" },
          )
        },
      })

    // Save the PDF
    doc.save(`${options.filename || "data-export"}.pdf`)
  }

  private static exportToExcel(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

    // Auto-size columns
    const colWidths = this.getColumnWidths(data)
    worksheet["!cols"] = colWidths.map((width) => ({ wch: width }))

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  private static exportToCSV(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private static getColumnWidths(data: any[]): number[] {
    if (data.length === 0) return []

    const headers = Object.keys(data[0])
    const widths = headers.map((header) => Math.max(header.length, 10)) // Start with header length or minimum 10

    // Check each row's data length
    data.forEach((row) => {
      headers.forEach((header, index) => {
        const value = String(row[header] || "")
        widths[index] = Math.max(widths[index], value.length)
      })
    })

    // Cap maximum width
    return widths.map((width) => Math.min(width, 50))
  }
}

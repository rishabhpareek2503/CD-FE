# Wastewater Monitoring Dashboard API Documentation

## Introduction

This document provides information about the API endpoints available in the Wastewater Monitoring Dashboard. These APIs are used internally by the frontend application and can also be accessed by external systems with proper authentication.

## Authentication

All API requests require authentication using Firebase Authentication. Include the Firebase ID token in the Authorization header:

\`\`\`
Authorization: Bearer <firebase-id-token>
\`\`\`

## API Endpoints

### Device Data

#### Get Latest Device Data

Retrieves the latest sensor data for a specific device.

- **URL**: `/api/devices/:id/latest-data`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Device ID
- **Response**:
  \`\`\`json
  {
    "deviceId": "WW-001",
    "timestamp": "2023-06-15T10:30:00Z",
    "readings": {
      "pH": 7.2,
      "BOD": 120,
      "COD": 350,
      "TSS": 150,
      "Temperature": 45,
      "DO": 6.5,
      "Conductivity": 1200,
      "Turbidity": 3.2
    }
  }
  \`\`\`

#### Get Historical Device Data

Retrieves historical sensor data for a specific device within a date range.

- **URL**: `/api/devices/:id/historical-data`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Device ID
- **Query Parameters**:
  - `from`: Start date (ISO format)
  - `to`: End date (ISO format)
  - `parameters`: Comma-separated list of parameters to include (optional)
- **Response**:
  \`\`\`json
  {
    "deviceId": "WW-001",
    "data": [
      {
        "timestamp": "2023-06-15T10:30:00Z",
        "readings": {
          "pH": 7.2,
          "BOD": 120,
          "COD": 350,
          "TSS": 150
        }
      },
      {
        "timestamp": "2023-06-15T10:35:00Z",
        "readings": {
          "pH": 7.3,
          "BOD": 118,
          "COD": 345,
          "TSS": 148
        }
      }
    ]
  }
  \`\`\`

### Notifications

#### Send Push Notification

Sends a push notification to a user.

- **URL**: `/api/notifications/push`
- **Method**: `POST`
- **Request Body**:
  \`\`\`json
  {
    "title": "High pH Level Alert",
    "body": "Device WW-001 has reported pH levels above the acceptable range.",
    "deviceId": "WW-001",
    "level": "critical"
  }
  \`\`\`
- **Response**:
  \`\`\`json
  {
    "success": true,
    "messageId": "1234567890"
  }
  \`\`\`

#### Send Email Notification

Sends an email notification to a user.

- **URL**: `/api/notifications/email`
- **Method**: `POST`
- **Request Body**:
  \`\`\`json
  {
    "subject": "High pH Level Alert",
    "text": "Device WW-001 has reported pH levels above the acceptable range.",
    "deviceId": "WW-001",
    "level": "critical"
  }
  \`\`\`
- **Response**:
  \`\`\`json
  {
    "success": true,
    "messageId": "1234567890"
  }
  \`\`\`

### Reports

#### Generate Report

Generates a report based on specified parameters.

- **URL**: `/api/reports/generate`
- **Method**: `POST`
- **Request Body**:
  \`\`\`json
  {
    "reportType": "daily",
    "deviceId": "WW-001",
    "dateRange": {
      "from": "2023-06-15T00:00:00Z",
      "to": "2023-06-15T23:59:59Z"
    },
    "parameters": ["pH", "BOD", "COD", "TSS"],
    "format": "pdf"
  }
  \`\`\`
- **Response**:
  \`\`\`json
  {
    "success": true,
    "reportId": "RPT-001",
    "downloadUrl": "https://example.com/reports/RPT-001.pdf"
  }
  \`\`\`

#### Get Report List

Retrieves a list of generated reports.

- **URL**: `/api/reports`
- **Method**: `GET`
- **Query Parameters**:
  - `deviceId`: Filter by device ID (optional)
  - `reportType`: Filter by report type (optional)
  - `from`: Start date (ISO format, optional)
  - `to`: End date (ISO format, optional)
- **Response**:
  \`\`\`json
  {
    "reports": [
      {
        "id": "RPT-001",
        "name": "Daily Operations Report",
        "type": "daily",
        "deviceId": "WW-001",
        "createdAt": "2023-06-15T10:30:00Z",
        "status": "completed",
        "fileSize": "1.2 MB",
        "downloadUrl": "https://example.com/reports/RPT-001.pdf"
      },
      {
        "id": "RPT-002",
        "name": "Weekly Performance Summary",
        "type": "weekly",
        "deviceId": "WW-002",
        "createdAt": "2023-06-10T14:45:00Z",
        "status": "completed",
        "fileSize": "3.5 MB",
        "downloadUrl": "https://example.com/reports/RPT-002.pdf"
      }
    ]
  }
  \`\`\`

### AI Predictions

#### Get Chemical Dosing Prediction

Retrieves AI-powered chemical dosing recommendations for a device.

- **URL**: `/api/predictions/chemical-dosing/:deviceId`
- **Method**: `GET`
- **URL Parameters**:
  - `deviceId`: Device ID
- **Response**:
  \`\`\`json
  {
    "deviceId": "WW-001",
    "timestamp": "2023-06-15T10:30:00Z",
    "prediction": {
      "chemical": "Alum",
      "quantity": 40,
      "dosageUnit": "ml/L",
      "efficiency": 95,
      "cost": 120
    },
    "parameters": {
      "pH": 7.2,
      "BOD": 120,
      "COD": 350,
      "TSS": 150,
      "Temperature": 45
    }
  }
  \`\`\`

#### Get Fault Diagnosis

Retrieves fault diagnosis for a device.

- **URL**: `/api/predictions/fault-diagnosis/:deviceId`
- **Method**: `GET`
- **URL Parameters**:
  - `deviceId`: Device ID
- **Response**:
  \`\`\`json
  {
    "deviceId": "WW-001",
    "timestamp": "2023-06-15T10:30:00Z",
    "hasFault": true,
    "severity": "medium",
    "faults": [
      {
        "parameter": "pH",
        "value": 8.7,
        "threshold": 8.5,
        "severity": "medium",
        "description": "pH level is above the acceptable range",
        "impact": "May affect biological treatment efficiency"
      }
    ],
    "recommendations": [
      "Adjust pH control system",
      "Check chemical dosing pumps",
      "Verify pH sensor calibration"
    ]
  }
  \`\`\`

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON object with error details:

\`\`\`json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid device ID",
    "details": {
      "parameter": "deviceId"
    }
  }
}
\`\`\`

## Rate Limiting

API requests are rate-limited to 100 requests per minute per user. If you exceed this limit, you'll receive a `429 Too Many Requests` response.

## Webhooks

The system can send webhook notifications for various events. To configure webhooks, contact the system administrator.

## Support

For API support, contact api-support@example.com.
\`\`\`

## Conclusion

This comprehensive implementation plan addresses all the identified gaps in the wastewater monitoring dashboard project. By implementing these improvements, you'll significantly enhance the functionality, reliability, and user experience of the application.

Key improvements include:

1. **Data Synchronization**: A robust service to ensure consistency between Firestore and Realtime Database
2. **Error Handling**: Comprehensive error boundaries and utilities for graceful error management
3. **Offline Support**: Service worker implementation for offline functionality and data synchronization
4. **Testing Infrastructure**: Jest and React Testing Library setup with sample tests
5. **Data Export**: Flexible export functionality for reports and data in multiple formats
6. **User Management**: Complete admin interface for managing users and permissions
7. **Deployment Pipeline**: CI/CD configuration for automated testing and deployment
8. **Documentation**: Comprehensive user and API documentation

These improvements make the application more robust, maintainable, and user-friendly. The modular approach allows you to implement these changes incrementally, prioritizing based on your specific needs and resources.
\`\`\`


```ts file="lib/export-service.ts"
[v0-no-op-code-block-prefix]import * as XLSX from "xlsx"
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

  public static exportSensorData(data: any[], device: any, format: ExportFormat, options: any): void {
    const filename = `sensor-data-${device.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}`
    const title = `Sensor Data for ${device.name}`
    const subtitle = `Device ID: ${device.id} - Location: ${device.location}`
    
    this.exportData(data, format, {
      filename,
      title,
      subtitle,
      orientation: 'landscape'
    })
  }

  private static exportToPDF(data: any[], options: ExportOptions): void {
    const { title, subtitle, orientation } = options
    const doc = new jsPDF({
      orientation: orientation || "portrait",
      unit: "pt",
      format: "letter",
    })

    // Add title and subtitle
    if (title) {
      doc.setFontSize(20)
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 50, { align: "center" })
    }
    if (subtitle) {
      doc.setFontSize(12)
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 70, { align: "center" })
    }

    // AutoTable configuration
    const startY = title ? 90 : 50 // Adjust start Y position based on title
    const columnStyles = {}
    const headerStyles = { fillColor: [26, 78, 126] } // HEEPL blue

    // Prepare headers and data for autoTable
    const headers = Object.keys(data[0] || {})
    const tableData = data.map((item) => Object.values(item))

    // Add the table to the PDF
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: startY,
      columnStyles: columnStyles,
      headStyles: headerStyles,
    })

    // Save the PDF
    doc.save(`${options.filename || "data"}.pdf`)
  }

  private static exportToExcel(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  private static exportToCSV(data: any[], filename: string): void {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data))
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

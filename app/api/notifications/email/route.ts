import { NextResponse } from "next/server"
import { collection, getDocs, query, where } from "firebase/firestore"
import nodemailer from "nodemailer"

import { db } from "@/lib/firebase"

export async function POST(request: Request) {
  try {
    const { subject, text, deviceId, level } = await request.json()

    // Get users who should receive this notification
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(query(usersRef, where("notificationPreferences.emailEnabled", "==", true)))

    const recipients: string[] = []
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      if (userData.email) {
        recipients.push(userData.email)
      }
    })

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, message: "No recipients found" })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Create email content with styling based on alert level
    const levelColor = level === "critical" ? "#ff0000" : level === "warning" ? "#ff9900" : "#0099ff"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${levelColor}; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">${subject}</h2>
        </div>
        <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
          <p>${text}</p>
          <p>Device ID: ${deviceId}</p>
          <p>Alert Level: <strong style="color: ${levelColor};">${level.toUpperCase()}</strong></p>
          <p>Time: ${new Date().toLocaleString()}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This is an automated message from your Wastewater Monitoring System. 
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `

    // Send email to all recipients
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipients.join(", "),
      subject: `[${level.toUpperCase()}] ${subject}`,
      html: htmlContent,
    }

    if (process.env.NODE_ENV === "production" && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      await transporter.sendMail(mailOptions)
      console.log(`Email notification sent to ${recipients.length} recipients`)
    } else {
      // In development or if credentials are missing, log instead of sending
      console.log("Email would be sent in production:", mailOptions)
    }

    return NextResponse.json({ success: true, recipients: recipients.length })
  } catch (error) {
    console.error("Error sending email notification:", error)
    return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
  }
}

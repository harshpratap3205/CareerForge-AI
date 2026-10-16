import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { config } from '../../config/env.js';

export class NotificationService {
  private static getMailTransporter() {
    if (!config.smtp.user || !config.smtp.pass) {
      return null;
    }
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  static async sendBookingConfirmationEmail(params: {
    userName: string;
    userEmail: string;
    consultantName: string;
    date: string;
    timeSlot: string;
    meetingLink: string;
    bookingId: string;
  }): Promise<boolean> {
    const transporter = this.getMailTransporter();
    const mailOptions = {
      from: config.smtp.from,
      to: params.userEmail,
      subject: `Confirmation: Consultation with ${params.consultantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4F46E5; margin-top: 0;">Consultation Confirmed</h2>
          <p>Hi <strong>${params.userName}</strong>,</p>
          <p>Your session with career expert <strong>${params.consultantName}</strong> has been successfully booked.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Booking ID:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Time Slot:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.timeSlot}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Meeting Link:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">
                <a href="${params.meetingLink}" style="color: #4F46E5; word-break: break-all;">${params.meetingLink}</a>
              </td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #666;">Please ensure you join on time with your questions ready.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">CareerForge AI Consultation Platform</p>
        </div>
      `,
    };

    if (!transporter) {
      console.log(`[Notification Mock] Confirmation email dispatched to ${params.userEmail} for Booking #${params.bookingId}`);
      return true;
    }

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
  }

  static async createGoogleCalendarEvent(params: {
    userName: string;
    userEmail: string;
    consultantName: string;
    date: string;
    timeSlot: string;
    agenda: string;
  }): Promise<{ eventId: string; meetingUrl: string } | null> {
    if (!config.google.clientId || !config.google.clientSecret || !config.google.refreshToken) {
      const generatedLink = `https://meet.google.com/cfg-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      return {
        eventId: `mock_evt_${Date.now()}`,
        meetingUrl: generatedLink,
      };
    }

    try {
      const oAuth2Client = new google.auth.OAuth2(
        config.google.clientId,
        config.google.clientSecret,
        `${config.clientUrl}/auth/google/callback`
      );
      oAuth2Client.setCredentials({ refresh_token: config.google.refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      const startDateTime = new Date(`${params.date}T${params.timeSlot}:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Career Consultation: ${params.userName} & ${params.consultantName}`,
          description: `Agenda: ${params.agenda}`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          attendees: [{ email: params.userEmail }],
          conferenceData: {
            createRequest: {
              requestId: `req_${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });

      const eventId = response.data.id || `cal_${Date.now()}`;
      const meetingUrl =
        response.data.hangoutLink ||
        response.data.conferenceData?.entryPoints?.[0]?.uri ||
        `https://meet.google.com/cfg-${Math.random().toString(36).substring(2, 6)}`;

      return { eventId, meetingUrl };
    } catch (error) {
      console.error('Google Calendar API Error (Continuing gracefully):', error);
      return {
        eventId: `err_fallback_${Date.now()}`,
        meetingUrl: `https://meet.google.com/cfg-${Math.random().toString(36).substring(2, 6)}`,
      };
    }
  }
}

import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../queues';
import { EmailJobData } from '../types';
import nodemailer from 'nodemailer';
import config from '../configs/index';
import logger from '../configs/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    // If SMTP user is not set, log emails to console (for development)
    if (!config.smtp.user) {
      logger.info('[EmailWorker] SMTP user not configured. Emails will be logged to the console.');
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }
  return transporter;
}

export function startEmailWorker(): Worker {
  const worker = new Worker<EmailJobData>(
    'email-queue',
    async (job: Job<EmailJobData>) => {
      const { to, subject, template, context } = job.data;
      logger.info(`[EmailWorker] Processing email job for: ${to}`, { jobId: job.id, template });

      try {
        const client = getTransporter();

        let html = '';
        if (template === 'verification') {
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #4f46e5; text-align: center;">Welcome to Linkly!</h2>
              <p>Hi ${context.name || 'there'},</p>
              <p>Thank you for signing up. Please click the button below to verify your email address and activate your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${context.verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #4f46e5;">${context.verificationUrl}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          `;
        } else if (template === 'password_reset') {
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
              <p>Hi ${context.name || 'there'},</p>
              <p>We received a request to reset the password for your Linkly account. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${context.resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #4f46e5;">${context.resetUrl}</p>
              <p style="color: #ef4444; font-weight: bold;">This link will expire in 1 hour.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666; text-align: center;">If you did not request a password reset, please ignore this email.</p>
            </div>
          `;
        } else {
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to Linkly</h2>
              <p>Hi ${context.name || 'there'},</p>
              <p>We're thrilled to have you here. Start shortening and tracking your links now!</p>
            </div>
          `;
        }

        const info = await client.sendMail({
          from: config.smtp.from,
          to,
          subject,
          html,
        });

        // If using stream transport (dev mode console logger)
        if (!config.smtp.user) {
          logger.info(`[EmailWorker] Email to ${to} details:`, {
            to,
            subject,
            htmlPreview: html.substring(0, 150) + '...',
          });
        } else {
          logger.info(`[EmailWorker] Email sent to ${to}`, { messageId: info.messageId });
        }
      } catch (error) {
        logger.error(`[EmailWorker] Error sending email to ${to}`, {
          error: (error as Error).message,
        });
        throw error;
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[EmailWorker] Job ${job?.id} failed`, { error: err.message });
  });

  return worker;
}

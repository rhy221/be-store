import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: configService.get<string>('MAIL_USER'),
                pass: configService.get<string>('MAIL_PASS')
            }
        });
    }

    async sendVerificationEmail(to: string, token: string) {
        const verifyUrl = `http://localhost:3000/auth/verify?token=${token}`;

        const mailOptions = {
            from: `"HHCloset" <${"support@hhcloset.com"}>`,
            to,
            subject: 'Verify your email',
            html: `
                <h3>Email Verification</h3>
                <p>Click the link below to verify your email address:</p>
                <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
                `,
        };

    try {
      await this.transporter.sendMail(mailOptions);
      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send verification email');
    }
    }

    async sendResetPassEmail(to: string, token: string) {
        const resetPassUrl = `http://localhost:3000/auth/verify?token=${token}`;

        const mailOptions = {
            from: `"HHCloset" <${"support@hhcloset.com"}>`,
            to,
            subject: 'Reset your password',
            html: `
                <h3>Reset your password</h3>
                <p>Click the link below to reset your password:</p>
                <a href="${resetPassUrl}" target="_blank">${resetPassUrl}</a>
                `,
        };

    try {
      await this.transporter.sendMail(mailOptions);
      return { message: 'Reset password email sent. Please check your inbox.' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send reset password email');
    }
    }
}

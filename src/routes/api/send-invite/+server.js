// @ts-nocheck
import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '$env/static/private';

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const createEmailTemplate = (groupName, inviteUrl) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Group Invitation</h1>
        <p style="font-size: 16px;">Hello!</p>
        <p style="font-size: 16px;">You've been invited to join <strong>${groupName}</strong> on S 24/7.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #ff6600; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;">
                Accept Invitation
            </a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link:</p>
        <p style="font-size: 14px; color: #666;">${inviteUrl}</p>
    </div>
`;

export async function POST({ request }) {
	const { email, inviteId, groupName } = await request.json();
	const inviteUrl = `http://localhost:5173/invite?invite=${inviteId}`;

	try {
		await transporter.sendMail({
			from: `"S 24/7" <${EMAIL_USER}>`,
			to: email,
			subject: 'Group Invitation - S 24/7',
			html: createEmailTemplate(groupName, inviteUrl)
		});

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Email Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to send email' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

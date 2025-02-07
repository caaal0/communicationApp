import nodemailer from 'nodemailer';
import imap from 'imap-simple';
import {simpleParser} from 'mailparser';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "uploads/" });

const sendEmail = async (req, res) => {
    try {
        const { from, to, subject, text, attachments } = req.body;
        if (!to || !subject || !text) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        console.log(from, to, subject, text, attachments);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: from || process.env.EMAIL, // Your email
                pass: process.env.EMAIL_PASS, // Your App Password
            },
            });
    
        if (!to || !subject || !text) {
          return res.status(400).json({ error: "Missing required fields" });
        }
    
        let attachmentURL = null;
        const emailAttachments = [];
    
        // Upload to Cloudinary
        if (attachments.length > 0) {
            for(const attachment of attachments){
                const filePath = `./temp/${attachment.filename}`;
                fs.writeFileSync(filePath, Buffer.from(attachment.content, "base64"));
                console.log('uploading to cloudinary');
                const result = await cloudinary.uploader.upload(filePath, {
                    resource_type: "auto", // Accepts all file types
                    folder: "email_attachments",
                });
        
                // attachmentURL = result.secure_url; // Get Cloudinary URL
                // Attach the Cloudinary file URL to the email
                emailAttachments.push({
                    filename: attachment.filename,
                    path: result.secure_url, // URL instead of local file
                });
            
                // Delete local file after upload
                fs.unlinkSync(filePath);
            }
        }
    
        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to,
          subject,
          text,
          attachments: emailAttachments,
        });
    
        res.json({ success: true, message: "Email sent successfully" });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
      }
};

const fetchInbox = async (req, res) => {
    try {
        const email = req.params.email;
        const config = {
            imap: {
                user: email,
                password: process.env.EMAIL_PASS,
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                tlsOptions: { rejectUnauthorized: false },
                tls: true,
                authTimeout: 5000,
            },
        };

        const connection = await imap.connect(config);
        await connection.openBox("INBOX");

        const searchCriteria = [["SINCE", "February 6, 2025"]]; // Adjust the date as needed
        const fetchOptions = {
            bodies: ["HEADER", "TEXT", ""], // Include the full email body
            markSeen: false,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const parsedEmails = await Promise.all(
            messages.map(async (msg) => {
                const all = msg.parts.find((part) => part.which === "");
                const id = msg.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";
                const emailContent = idHeader + all.body;

                // Parse the email using mailparser
                const parsed = await simpleParser(emailContent);

                return {
                    id: id, // Unique ID of the email
                    from: parsed.from.value[0], // Sender
                    subject: parsed.subject, // Subject
                    date: parsed.date, // Date sent
                    body: parsed.text || parsed.html, // Plain text or HTML body
                    attachments: parsed.attachments, // Attachments (if any)
                };
            })
        );

        connection.end();
        res.status(200).json({ success: true, data: parsedEmails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

export default {
    sendEmail,
    fetchInbox,
}
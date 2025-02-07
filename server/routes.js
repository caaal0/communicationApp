import express from 'express';

// Import the controllers
import auth from './controllers/auth.js';
import user from './controllers/user.js';
import sms from './controllers/sms.js';
import email from './controllers/email.js';
import chat from './controllers/chat.js';
import { makeCall, voiceResponse } from './utils/twilio.js';

import multer from 'multer';

const upload = multer({ dest: "uploads/" });

const router = express.Router();

//auth
router.post('/api/auth/signup', auth.signup);
router.post('/api/auth/login', auth.login);

//user mgmt
router.get('/api/user/:id', user.getUser);

//sms
router.post('/api/sms/send', sms.sendSMSController);
router.post('/api/sms/receive', sms.receiveSMSController);
router.get('/api/sms/received', sms.fetchReceivedMessages);

//email
router.post('/api/email/send', email.sendEmail);
router.get('/api/email/inbox/:email', email.fetchInbox);

//chat
router.post('/api/chat/send', chat.saveMessage);
router.get('/api/chat/messages', chat.getMessages);

//call
router.post('/api/call', makeCall);
router.post('api/voice', voiceResponse);

export default router;
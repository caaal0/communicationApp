import { sendSMS } from '../utils/twilio.js';
import db from '../firebase.js'
import FireStore from '@google-cloud/firestore';

const sendSMSController = async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).json({ success: false, error: "Phone number and message are required." });
    }

    const result = await sendSMS(phoneNumber, message);
    if (result.success) {
        return res.status(201).json({ success: true, sid: result.sid });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
};

const receiveSMSController = async (req, res) => {
    const { From, Body } = req.body;
    console.log(`Received SMS from ${From}: ${Body}`);

    //store in firestore
    try{
        const response = await db.collection('messages').add({
            from: From,
            body: Body,
            receivedAt: FireStore.Timestamp.now(),
        });
        console.log("Message stored in Firestore with ID:", response.id);
        res.status(200).send('<Response><Message></Message></Response>');
    }catch(error){
        console.error("Error storing message in Firestore:", error);
        res.status(500).send('<Response><Message></Message></Response>');
    }

    // res.status(200).send(`<Response><Message>Thanks for your message!</Message></Response>`);
};

const fetchReceivedMessages = async (req, res) => {
    try {
        const snapshot = await db.collection('messages').orderBy('receivedAt', 'desc').get();
        //convert receivedAt to Date objects

        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                from: data.from,
                body: data.body,
                receivedAt: data.receivedAt.toDate(),
            }
        });
        // console.log("Fetched messages:", messages);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    sendSMSController,
    receiveSMSController,
    fetchReceivedMessages,
}
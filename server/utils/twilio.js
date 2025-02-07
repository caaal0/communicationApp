import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendSMS(to, message) {
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      // from: "+18777804236",
      to: to,
    });
    console.log("SMS sent successfully:", response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

export const makeCall = async (req, res) => {
  try {
    const { to } = req.body;

    const call = await client.calls.create({
      url: "https://25fa-2001-4453-523-7200-5043-da56-b08a-15e0.ngrok-free.app/api/voice", // This should return TwiML instructions
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Twilio webhook to handle the voice response
export const voiceResponse = (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hello, this is a test call from your omni-channel app.");
  res.type("text/xml").send(twiml.toString());
};
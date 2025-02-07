import db from "../firebase.js"; // Ensure you have Firestore initialized
import { collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";
import FireStore from '@google-cloud/firestore';
// Save message to Firestore
const saveMessage = async (req, res) => {
  try {
    const { senderId, message } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({ error: "Sender ID and message are required" });
    }

    await addDoc(collection(db, "chats"), {
      senderId,
      message,
      timestamp: FireStore.Timestamp.now(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Could not save message" });
  }
};

// Retrieve messages from Firestore
const getMessages = async (req, res) => {
  try {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Could not retrieve messages" });
  }
};

export default { saveMessage, getMessages };
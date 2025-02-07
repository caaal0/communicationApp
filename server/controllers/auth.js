import admin from 'firebase-admin';
import db from '../firebase.js';

const signup = async (req, res) => {
    const { email, password, name, phoneNumber } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });
        const newUser = {
            id: userRecord.uid,
            email: email,
            name: name,
            phoneNumber: phoneNumber,
        }
        const response = await db.collection('users').doc(newUser.id).set(newUser);
        res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const login = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Extract token from the header
    
        if (!token) {
          return res.status(401).send({ success: false, msg: 'No token provided' });
        }
    
        // Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const user = await admin.auth().getUser(decodedToken.uid); // Get the user data
        // console.log(user);
        res.status(200).send({ success: true, user: user });
      } catch (err) {
        res.status(500).send({ success: false, msg: 'Unable to login', error: err.message });
      }
};


export default {
    signup,
    login,
    //me,
}
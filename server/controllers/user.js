import db from '../firebase.js';

const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const user = userDoc.data();
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

export default {
    getUser,
}
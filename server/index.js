import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

app.listen( process.env.PORT || 8080 , () => {
    console.log(`Server is running on ${process.env.PORT || 8080}`);
});
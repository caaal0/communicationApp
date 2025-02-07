import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useUserStore } from "@/stores/user";
import axios from "axios";

// login helper
export async function loginHelper(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    const userStore = useUserStore();

    // Send token to backend
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/login`,
      {}, // Body is empty (if needed, you can add data here)
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      const data = response.data;
      userStore.setUser(data); // Update Pinia store with user data
      return data;
    } else {
      console.error("Login failed:", response);
      return { success: false };
    }
  } catch (error) {
    console.error('Error:', error);
    let msg = '';
    if(error.code === 'auth/invalid-email'){
      msg = 'invalid-email'
    }else if(error.code === 'auth/invalid-credential'){
      msg = 'invalid-credential';
    }else{
      msg = 'login-error';
    }
    // alert('Login error.');
    return {success: false, msg, error};
  }
}

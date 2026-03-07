import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ setPage,setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [popupEmail, setPopupEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form values before validation:', { email: form.email, password: form.password });
  
    if (validate()) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        
        const firebaseUser = userCredential.user;
      
      if (!firebaseUser.emailVerified) {
        await auth.signOut(); 
        setErrors({ 
          general: 'Please verify your email before logging in. Check your inbox for the verification link.' 
        });
        return;
      }
      
      const token = await firebaseUser.getIdToken();

        const response = await fetch('http://localhost:5001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
           },
          body: JSON.stringify({ email: form.email, firebaseuid: firebaseUser.uid, password: form.password })
        });
        
        if (response.status === 423) {
          setShowReviewPopup(true);
          setErrors({});
          return;
        }
        
        const data = await response.json();
        console.log('Server response:', data);
        
        if (response.ok) {
          localStorage.setItem('token', token); 
          localStorage.setItem('backendToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('userid', data.user.userid);
          setUser(data.user.username); 
          setPage("home");
         
          setPopupEmail(data.user.username); 
          setShowPopup(true);
          setForm({ email: "", password: "" });
          setErrors({});
          console.log('Login successful:', data);

          console.log("Response OK:", response.ok);
console.log("Full backend data:", data);
console.log("User object:", data.user);
console.log("User ID:", data.user?.userid);
//window.location.reload();
          
        } else {
          
          if (data.errors && data.errors.general) {
            setErrors({ general: data.errors.general });
          } else {
            setErrors({ general: data.message || 'Login failed' });
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
          setErrors({ general: 'No account found with this email' });
        } else if (error.code === 'auth/wrong-password') {
          setErrors({ general: 'Incorrect password' });
        } else if (error.code === 'auth/invalid-email') {
          setErrors({ email: 'Invalid email address' });
        } else if (error.code === 'auth/too-many-requests') {
          setErrors({ general: 'Too many failed attempts. Please try again later.' });
        } else {
          setErrors({ general: error.message || 'Network error. Please try again.' });
        }
      }
    }
  };
 


  return (
    <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
        <nav className="bg-[#384959] text-white text-center py-3 text-lg font-semibold">LOGIN</nav>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <svg className="h-12 w-12 text-[#384959]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M5.121 17.804A9 9 0 0112 15a9 9 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#384959]"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#384959]"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-[#384959] text-white py-2 rounded-lg hover:bg-[#2c3a47] transition"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Login as Admin?{" "}
           <span
            className="text-[#384959] font-semibold hover:underline cursor-pointer"
            onClick={() => setPage("admin-login")}
          >
          Admin Login
          </span>
          </p>

          <p className="mt-2 text-center text-sm">
            Don’t have an account?{" "}
            <span
  className="text-[#384959] font-semibold hover:underline cursor-pointer"
  onClick={() => setPage("register")}
>
  Register
</span>

          </p>
        </div>
      </div>
      {errors.general && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
      <div className="flex justify-center mb-4">
        <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="mb-4 text-lg font-semibold text-red-600">Login Failed!</p>
      <p className="mb-4 text-sm text-gray-600">{errors.general}</p>
      <button
        onClick={() => setErrors({})}
        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Try Again
      </button>
    </div>
  </div>
)}
{showReviewPopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
      <div className="flex justify-center mb-4">
        <svg className="h-12 w-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mb-2 text-lg font-semibold text-orange-600">Account under review</p>
      <p className="mb-4 text-sm text-gray-600">Your account has been temporarily disabled by the admin.</p>
      <button
        onClick={() => setShowReviewPopup(false)}
        className="bg-[#384959] text-white px-6 py-2 rounded-lg hover:bg-[#2c3a47] transition"
      >
        OK
      </button>
    </div>
  </div>
)}
      {/* popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
            <p className="mb-4 text-lg font-semibold text-green-600">Logged in Successfully!</p>
            <button
        onClick={() => {
          setShowPopup(false);
          setPage("home");
          setUser(popupEmail); 
        }}
        className="bg-[#384959] text-white px-6 py-2 rounded-lg hover:bg-[#2c3a47] transition"
      >
        OK
      </button>

          </div>
        </div>
      )}

      
    </div>
  );
}


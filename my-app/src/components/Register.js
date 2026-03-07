import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

export default function Register({ setPage }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) newErrors.confirmPassword = "Confirm your password";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        // Step 1: Create user with Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        
        const firebaseUser = userCredential.user;
        console.log('Firebase user created:', firebaseUser.uid);
        
        // Step 2: Send email verification
        await sendEmailVerification(firebaseUser);

        const response = await fetch('http://localhost:5001/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: form.name,  
            email: form.email,
            password: form.password,
            firebaseuid: firebaseUser.uid,
          })
        });
        const data = await response.json();
        if (response.ok) {
         
          setShowPopup(true);
          setForm({ name: "", email: "", password: "", confirmPassword: "" });
          setErrors({});
          console.log('Registration successful:', data);
        } else {
          await firebaseUser.delete();
          if (data.message === 'User already exists') {
            setErrors({ general: data.message });
          } else if (data.errors) {
            setErrors(data.errors);
          } else {
            setErrors({ general: data.message });
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
          setErrors({ general: 'This email is already registered' });
        } else if (error.code === 'auth/invalid-email') {
          setErrors({ email: 'Invalid email address' });
        } else if (error.code === 'auth/weak-password') {
          setErrors({ password: 'Password should be at least 6 characters' });
        } else {
          setErrors({ general: error.message || 'Registration failed. Please try again.' });
        }
      }
    }
  };
  return (
    <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
        <nav className="bg-[#384959] text-white text-center py-3 text-lg font-semibold">
          REGISTER
        </nav>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <svg className="h-12 w-12 text-[#384959]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M5.121 17.804A9 9 0 0112 15a9 9 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#384959]"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

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

            <div>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#384959]"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-[#384959] text-white py-2 rounded-lg hover:bg-[#2c3a47] transition"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
              <span
              className="text-[#384959] font-semibold hover:underline cursor-pointer"
              onClick={() => setPage("login")}
              >
            Login
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
      <p className="mb-4 text-lg font-semibold text-red-600">{errors.general}</p>
      <button
        onClick={() => setErrors({})}
        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
      >
        OK
      </button>
    </div>
  </div>
)}
      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
          <p className="mb-4 text-lg font-semibold text-green-600">Registered Successfully! Now Proceed with Login</p>
            <button
              onClick={() => {
                setShowPopup(false);
                navigate("/login");
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

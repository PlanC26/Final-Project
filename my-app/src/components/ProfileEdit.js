import React, { useState, useEffect } from "react";
import { Pencil, LogOut, ArrowLeft, User } from "lucide-react"; 

export default function ProfileEdit({setPage}) {
  const [user, setUser] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [editableFields, setEditableFields] = useState({
    name: false,
    email: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setForm({
        name: parsedUser.username,
        email: parsedUser.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleEdit = (field) => {
    setEditableFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    alert("Profile updated successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("You have been logged out!");
    window.location.reload();
    setPage("home");
  };
  const handleBack = () => {
    setPage("home");
  };
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Call API to delete account
      alert("Account deleted successfully!");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setPage("home");
    }
  };
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#384959] text-white px-4 py-3">
          <button className="text-lg">
            <ArrowLeft />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 hover:text-gray-300">
            <span>Logout</span>
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Profile Icon */}
          <div className="flex justify-center mb-6">
            <User className="h-20 w-20 text-black border-2 border-gray-400 rounded-full p-2" />
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium">Name :</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  readOnly={!editableFields.name}
                  className={`w-full border rounded-lg px-4 py-2 mt-1 ${
                    editableFields.name ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => toggleEdit("name")}
                className="mt-6 text-gray-600 hover:text-black"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium">Email :</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  readOnly={!editableFields.email}
                  className={`w-full border rounded-lg px-4 py-2 mt-1 ${
                    editableFields.email ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => toggleEdit("email")}
                className="mt-6 text-gray-600 hover:text-black"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>

            {/* Password Section */}
            <div>
              <label className="block text-gray-700 font-medium">Current Password :</label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 mt-1"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium">New Password :</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 mt-1"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium">Confirm New Password :</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2c3a47] text-white py-2 rounded-lg hover:bg-[#384959] transition"
            >
              Save Changes
            </button>

            {/* Delete Account */}
            <button
              type="button"
              onClick={handleDelete}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Delete Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

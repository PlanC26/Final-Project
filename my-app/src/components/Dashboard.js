import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F4FFFF] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">User Dashboard</h2>
        <p className="mb-6">Welcome — this is a placeholder dashboard.</p>
        <button onClick={() => navigate("/login")} className="bg-[#384959] text-white px-4 py-2 rounded">Logout</button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import "./App2.css";

export default function AdminDashboard({ setPage }) {
  const [activeTab, setActiveTab] = useState("reported");
  const [selectedReportName, setSelectedReportName] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [messageText, setMessageText] = useState("Add message");

  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [reports, setReports] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [adminPosts, setAdminPosts] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  /* ================= FETCH ALL WEEKLY REPORTS ================= */
  useEffect(() => {
  if (activeTab === "plan") {
    const fetchPDF = async () => {
      try {
        setLoadingReports(true);

        const response = await fetch(
          "http://localhost:5001/api/weekly-reports/latest"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch PDF");
        }

        const blob = await response.blob();

        const fileURL = window.URL.createObjectURL(blob);

        setPdfUrl(fileURL);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setPdfUrl(null);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchPDF();
  }
}, [activeTab]);

  /* ================= FETCH REPORTED USERS ================= */
  useEffect(() => {
    const fetchReported = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/reported-users");
        const data = await res.json();
        setReportedUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("fetch reported users error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReported();
  }, []);
  useEffect(() => {
  if (activeTab !== "status") return;

  const fetchPosts = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("http://localhost:5001/api/admin/posts");
      const data = await res.json();
      setAdminPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  fetchPosts();
}, [activeTab]);

  const toggleDisabled = async (id, disabled) => {
  try {
    const res = await fetch(
      `http://localhost:5001/api/users/${id}/disabled`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      }
    );

    if (!res.ok) {
      alert("Failed to update user");
      return;
    }

    setReportedUsers((prev) =>
      prev.map((u) =>
        u.reported_user_id === id ? { ...u, disabled } : u
      )
    );
  } catch (err) {
    console.error(err);
  }
};
  const handleDisable = (id) => toggleDisabled(id, true);
  const handleEnable = (id) => toggleDisabled(id, false);
  const updateStatus = async (id, newStatus) => {
  try {
    await fetch(
      `http://localhost:5001/api/admin/posts/${id}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    // Update UI instantly
    setAdminPosts((prev) =>
      prev.map((p) =>
        p.post_id === id ? { ...p, status: newStatus } : p
      )
    );

  } catch (err) {
    console.error("Status update error:", err);
  }
};

  const handleSelectReport = (name) => {
    setSelectedReportName((prev) => (prev === name ? null : name));
    setShowConfirmation(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="navbar">Admin Dashboard</div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "reported" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("reported");
            setShowConfirmation(false);
          }}
        >
          Reported Users
        </button>
        <button
          className={`tab ${activeTab === "plan" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("plan");
            setShowConfirmation(false);
          }}
        >
          Plan Sharing
        </button>
        <button
  className={`tab ${activeTab === "status" ? "active" : ""}`}
  onClick={() => setActiveTab("status")}
>
  Status Update
</button>
      </div>


      {/* ================= REPORTED USERS SECTION ================= */}
      {activeTab === "reported" && (
        <div className="card">
          <h3>
            <h3>Total Reported Users: {reportedUsers.length}</h3>
          </h3>

          {/* <input
            type="text"
            placeholder="Search reported users by user id or reason"
            className="search-box"
          /> */}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table>
<thead>
  <tr>
    <th>User ID</th>
    <th>Total Reports</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
  {reportedUsers.map((u, index) => (
    <tr key={index}>
      {/* USER ID */}
      <td>{u.reported_user_id}</td>

      {/* REPORT COUNT */}
      <td>{u.total_reports}</td>

      {/* STATUS */}
      <td>
        {u.disabled ? (
          <span style={{ color: "red", fontWeight: "bold" }}>
            Disabled
          </span>
        ) : (
          <span style={{ color: "green" }}>
            Active
          </span>
        )}
      </td>

      {/* ACTION */}
      {/* <td>
        {u.disabled ? (
          <button
            className="action-btn approve"
            onClick={() => toggleDisabled(u.reported_user_id, false)}
          >
            Enable
          </button>
        ) : (
          <button
            className="action-btn block"
            onClick={() => toggleDisabled(u.reported_user_id, true)}
          >
            Disable
          </button>
        )}
      </td> */}
    </tr>
  ))}

  {reportedUsers.length === 0 && (
    <tr>
      <td colSpan={4} style={{ textAlign: "center" }}>
        No reported users
      </td>
    </tr>
  )}
</tbody>
            </table>
          )}
        </div>
      )}

      {/* ================= PLAN SHARING SECTION ================= */}
{activeTab === "plan" && (
  <div className="card">
    <h3>Weekly Reports</h3>

    {loadingReports ? (
      <p>Loading report...</p>
    ) : pdfUrl ? (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <span>1. Weekly Report</span>

          {/* VIEW */}
          <button
            className="action-btn approve"
            onClick={() => window.open(pdfUrl, "_blank")}
          >
            View
          </button>

          {/* DOWNLOAD */}
          <a
            href={pdfUrl}
            download="weekly-report.pdf"
            className="action-btn approve"
          >
            Download
          </a>

          {/* SHARE */}
         <button
  className="action-btn block"
  onClick={async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/send-weekly-report",
        { method: "POST" }
      );

      if (res.ok) {
        alert("Report emailed successfully ✅");
      } else {
        alert("Failed to send report ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending email");
    }
  }}
>
  Share
</button>
        </div>
      </>
    ) : (
      <p>No report available</p>
    )}
  </div>
)}
{activeTab === "status" && (
  <div className="card">
    <h3>Status Update</h3>

    {loadingStatus ? (
      <p>Loading...</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Place</th>
            <th>Issue Reported</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {adminPosts.map((post) => (
            <tr key={post.post_id}>
              <td>{post.location}</td>
              <td>{post.title}</td>
              <td>
                <select
                  value={post.status}
                  onChange={(e) =>
                    updateStatus(post.post_id, e.target.value)
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
    </div>
  );
}
import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register"; 
import AdminLogin from "./components/AdminLogin";
import ProfileEdit from "./components/ProfileEdit";
import AdminDashboard from "./components/AdminDashboard";
import RegisterComplaint from "./components/RegisterComplaint";
import TrackProgress from "./components/TrackProgress";
import './App.css'; 
import ProtectedRoute from './components/ProtectedRoute';
import {Pencil} from "lucide-react";


export default function App() {

  React.useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser) {
    setUser(storedUser.username);
  }
}, []);


  React.useEffect(() => {
  fetch("http://localhost:5001/api/posts")
    .then(res => res.json())
    .then(data => {
      setComplaints(data);
      setFilteredComplaints(data);
      const userData = JSON.parse(localStorage.getItem("user"));

      if (userData) {
        const filtered = data.filter(
          (post) => post.userid === userData.userid
        );

        setMyComplaints(filtered);
      }
    })
    .catch(err => console.error("Error fetching complaints:", err));
}, []);

  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [showReportFor, setShowReportFor] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [sortType, setSortType] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
// Fetch My Complaints (only when user exists and page is mycomplaints)

const handleReport = async (reportedUserId, reason) => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (!currentUser) {
    setPage("login");
    return;
  }

  try {
    await fetch("http://localhost:5001/api/report-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedUserId,
        reportedBy: currentUser.userid, // ✅ FIXED
        reason,
      }),
    });

    alert("Report submitted");
    setShowReportFor(null);
  } catch (err) {
    console.error(err);
    alert("Error reporting");
  }
};
const handleUpvote = async (postId) => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (!currentUser) {
    setPage("login");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5001/api/posts/${postId}/upvote`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: currentUser.userid
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      setComplaints(prev =>
        prev.map(c =>
          c.post_id === postId
            ? { ...c, noofupvotes: data.upvotes }
            : c
        )
      );
    }

  } catch (err) {
    console.error("Upvote error:", err);
  }
};

const fetchComments = async (postId) => {
  try {
    const res = await fetch(
      `http://localhost:5001/api/posts/${postId}/comments`
    );
    const data = await res.json();

    setComments(prev => ({
      ...prev,
      [postId]: data
    }));

  } catch (err) {
    console.error("Fetch comments error:", err);
  }
};
const handleSaveEdit = async (postId) => {
  const userData = JSON.parse(localStorage.getItem("user"));

  if (!userData) {
    setPage("login");
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5001/api/posts/${postId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: userData.userid,
          description: editedDescription
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // Update UI without reload
    setMyComplaints(prev =>
      prev.map(p =>
        p.post_id === postId
          ? { ...p, description: editedDescription }
          : p
      )
    );

    setEditingId(null);
    alert("Complaint updated successfully");

  } catch (error) {
    console.error(error);
    alert("Error updating complaint");
  }
};
const handleAddComment = async (postId) => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (!currentUser) {
    setPage("login");
    return;
  }

  if (!newComment.trim()) return;

  try {
    const res = await fetch(
      `http://localhost:5001/api/posts/${postId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: currentUser.userid,
          comment_text: newComment
        })
      }
    );

    if (res.ok) {
      setNewComment("");
      fetchComments(postId); // Refresh comments
    }

  } catch (err) {
    console.error("Add comment error:", err);
  }
};  
const applyFilters = () => {
  let temp = [...complaints];

  // Filter by location
  if (locationFilter !== "") {
    temp = temp.filter(c =>
      c.location?.toLowerCase().includes(locationFilter.toLowerCase())
    );
  }

  // Sort by likes
  if (sortType === "likes-high") {
    temp.sort((a, b) => b.noofupvotes - a.noofupvotes);
  }

  if (sortType === "likes-low") {
    temp.sort((a, b) => a.noofupvotes - b.noofupvotes);
  }

  // Sort by date
  if (sortType === "date-new") {
    temp.sort((a, b) => new Date(b.createdate) - new Date(a.createdate));
  }

  if (sortType === "date-old") {
    temp.sort((a, b) => new Date(a.createdate) - new Date(b.createdate));
  }

  setFilteredComplaints(temp);
};
React.useEffect(() => {
  applyFilters();
}, [sortType, locationFilter, complaints]);

  return (
    <div className="font-sans bg-[#F4FFFF] min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#384959] text-white px-8 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
        <img src={process.env.PUBLIC_URL + "/logo.jpg"} alt="Plan C Logo" className="h-15 w-50" />
       
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => setPage("home")} className="hover:text-[#F4FFFF]">HOME</button>
          <button onClick={() => setPage("about")} className="hover:text-[#F4FFFF]">ABOUT</button>
          <button onClick={() => setPage("complaints")} className="hover:text-[#F4FFFF]">VIEW COMPLAINTS</button>
          
          {user ? (
            <span className="text-[#F4FFFF] font-semibold">{user}</span>
          ) : (
          <button 
            onClick={() => setPage("login")} 
            className="hover:text-[#F4FFFF]"
          >
          LOGIN/REGISTER
          </button>
)}

          <img 
            src={process.env.PUBLIC_URL + "/user.jpg"}
            alt="User Icon" 
            className="h-8 w-10 cursor-pointer"
            onClick={() => setPage("profile")} 
          />
        </div>
      </nav>

      {/* Page Content */}
      {page === "home" && (
  <>
    {/*Home page */}
    <section className="flex flex-col md:flex-row items-center justify-between px-12 py-16 flex-grow">
      <div className="md:w-1/2">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#384959]">
          Plan C – Your Voice in Urban Planning
        </h1>
        <p className="text-gray-700 leading-relaxed mb-6">
          An AI-powered citizen platform for Kozhikode that makes it easy
          to report civic issues, track their progress, and ensure your
          voice shapes urban planning decisions.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const userData = localStorage.getItem('user');
              if (userData) {
                setPage("register-complaint");
              } else {
                setPage("login");
              }
            }} 
            className="px-5 py-2 rounded-lg bg-[#384959] text-white hover:bg-[#4c6274]"
          >
            REGISTER COMPLAINT
          </button>

          <button onClick={() => setPage("track-progress")} className="px-5 py-2 rounded-lg bg-[#A7C7E7] text-[#384959] hover:bg-[#91b6dc]">
            TRACK PROGRESS
          </button>
        </div>
      </div>
      <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
      <img src={process.env.PUBLIC_URL + "/city.jpg"} alt="City Illustration" className="max-w-sm" />
      </div>
    </section>

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-12 py-12">
            <div className="bg-[#A7C7E7] rounded-xl p-6 text-center shadow">
              <h3 className="font-bold text-lg mb-2 text-[#384959]">TRANSPARENCY</h3>
              <p className="text-gray-700 text-sm">
                Every complaint is visible to all citizens with realtime status
                updates, ensuring accountability.
              </p>
            </div>
            <div className="bg-[#A7C7E7] rounded-xl p-6 text-center shadow">
              <h3 className="font-bold text-lg mb-2 text-[#384959]">CITIZEN EMPOWERMENT</h3>
              <p className="text-gray-700 text-sm">
                Your voice matters – report issues, upvote complaints, and
                influence planning decisions.
              </p>
            </div>
            <div className="bg-[#A7C7E7] rounded-xl p-6 text-center shadow">
              <h3 className="font-bold text-lg mb-2 text-[#384959]">AI PLANNING</h3>
              <p className="text-gray-700 text-sm">
                AI-powered classification and mapping help prioritize issues for
                quicker and more-efficient resolution.
              </p>
            </div>
          </section>
        </>
      )}
    


{/* Page Content */}
{page === "about" && (
  <>
    <section className="px-12 py-12 flex flex-col items-center text-center">
      <h3 className="font-bold text-lg mb-3 text-[#384959]">About Us</h3>
      <p className="text-gray-700 max-w-2xl leading-relaxed text-sm">
        This project is created by Ameya Arul, Rifana Sherin, Sania KS, and Shreya Baiju, four passionate students who believe in using AI for the benefit of society.
        Our dream is to build a simple platform powered by smart technology that everyone can use easily, so that everyone's voice is heard and every problem gets attention.
      </p>
    </section>

    {/* How This Helps People */}
    <section className="px-12 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#A7C7E7] rounded-xl p-6 shadow">
        <h3 className="font-bold text-lg mb-3 text-[#384959]">How this helps people</h3>
        <ul className="text-gray-700 list-disc list-inside space-y-2 text-sm">
          <li>AI ensures that the most urgent and genuine complaints get noticed quickly.</li>
          <li>Makes it easy for everyone to raise their voice about problems in their area.</li>
          <li>Saves time and brings more transparency between citizens and city planners.</li>
        </ul>
      </div>

      {/* Our Goals */}
      <div className="bg-[#A7C7E7] rounded-xl p-6 shadow">
        <h3 className="font-bold text-lg mb-3 text-[#384959]"> Our Goals</h3>
        <ul className="text-gray-700 list-disc list-inside space-y-2 text-sm">
          <li>Use AI technology to improve living standards for citizens.</li>
          <li>Make cities cleaner, safer, and more organized.</li>
          <li>Encourage active participation of people in city planning and development.</li>
        </ul>
      </div>
    </section>

    {/* About Us */}
  
  </>
)}
      {page === "complaints" && (
        <section className="px-12 py-12 flex-grow">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => setPage("home")} 
              className="text-white bg-[#384959] px-4 py-2 rounded-lg hover:bg-[#4c6274]"
            >
              ← Back
            </button>
            <div className="flex gap-4 text-[#384959]">
              <button onClick={() => setPage("register-complaint")} className="hover:underline font-bold">
              Register Complaint
              </button>

              <span>|</span>
              <button
              onClick={() => setPage("mycomplaints")}
              className="hover:underline font-bold">View my Complaints</button>
            </div>
          </div>
<div className="flex gap-4 mb-6">

<input
  type="text"
  placeholder="Filter by location"
  className="border px-3 py-1 rounded"
  value={locationFilter}
  onChange={(e) => setLocationFilter(e.target.value)}
/>

<select
  className="border px-3 py-1 rounded"
  value={sortType}
  onChange={(e) => setSortType(e.target.value)}
>
  <option value="">Sort</option>
  <option value="likes-high">Most liked</option>
  <option value="likes-low">Least liked</option>
  <option value="date-new">Newest</option>
  <option value="date-old">Oldest</option>
</select>

</div>
          {/* Complaints grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
  {/*{complaints.map((c) => (*/}
  {filteredComplaints.map((c) => (
    <div
      key={c.post_id}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden flex flex-col"
    >
      {/* Image Section */}
      <div className="relative">
       <img
  src={`http://localhost:5001/uploads/${c.image}`}
 
  className="w-full h-48 object-cover"
/>
        {/* Report Icon */}
        <img
          src={process.env.PUBLIC_URL + "/flag.jpeg"}
          alt="Report"
          className="absolute top-3 right-3 w-6 h-6 cursor-pointer bg-white p-1 rounded-full shadow"
          onClick={() =>
  setShowReportFor(
    showReportFor === c.post_id ? null : c.post_id
  )
}
        />

        {showReportFor === c.post_id && (
          <div className="absolute top-12 right-3 bg-white border rounded shadow-md z-10">
            {["Spam", "Harassment", "Fake Complaint", "Others"].map(
              (reason) => (
                <div
                  key={reason}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleReport(c.userid, reason)}
                >
                  {reason}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
      <p className="text-sm font-semibold text-gray-600">
      {c.location}
</p>

<p className="text-lg font-bold text-[#384959] mt-1">
  {c.title}
</p>

<p className="text-sm text-gray-700 mt-2">
  {c.description}
</p>

        {/* Status Badge
        <span
          className={`inline-block mt-2 px-3 py-1 text-xs rounded-full w-fit ${
            c.status === "Resolved"
              ? "bg-green-100 text-green-700"
              : c.status === "In Progress"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {c.status}
        </span> */}

        {/* Bottom Row */}
        <div className="flex justify-between items-center mt-auto pt-4">

  <div
    className="flex items-center gap-2 text-[#384959] cursor-pointer hover:scale-105 transition"
    onClick={() => handleUpvote(c.post_id)}
  >
    <img
      src={process.env.PUBLIC_URL + "/upvote.jpg"}
      alt="Upvote"
      className="w-5 h-5"
    />
    <span className="text-sm font-medium">
      {c.noofupvotes}
    </span>
  </div>


         <button
  className="flex items-center gap-2 px-4 py-2 bg-[#384959] text-white text-sm font-medium rounded-full shadow-sm hover:bg-[#4c6274] transition-all"
  onClick={() => {
    if (activeCommentPost === c.post_id) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(c.post_id);
      fetchComments(c.post_id);
    }
  }}
>
  💬 Comment
</button>
        </div>
        {activeCommentPost === c.post_id && (
  <div className="mt-4 border-t pt-3">

    {/* Existing Comments */}
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {comments[c.post_id]?.map(comment => (
        <div key={comment.comment_id} className="text-sm">
          <span className="font-semibold text-[#384959]">
            {comment.username}:
          </span>{" "}
          {comment.comment_text}
        </div>
      ))}
    </div>

    {/* Add Comment */}
    <div className="flex mt-2 gap-2">
      <input
        type="text"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 border rounded px-2 py-1 text-sm"
      />
      <button
        onClick={() => handleAddComment(c.post_id)}
        className="bg-[#384959] text-white px-3 py-1 rounded text-sm"
      >
        Send
      </button>
    </div>

  </div>
)}
      </div>
    </div>
  ))}
</div>
        </section>
      )}

{page === "mycomplaints" && (
  <ProtectedRoute setPage={setPage}>
    <div className="flex-grow px-12 py-8">
      <button
        onClick={() => setPage("complaints")}
        className="mb-6 px-4 py-2 bg-[#384959] text-white rounded hover:bg-[#4c6274]"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {myComplaints.map((c) => (
  <div key={c.post_id} className="bg-white rounded-lg shadow p-4">

    <img
      src={`http://localhost:5001/uploads/${c.image}`}
      alt={c.title}
      className="w-full h-40 object-cover rounded-lg mb-3"
    />

    <p className="text-sm font-bold">LOCATION: {c.location}</p>
    <p className="text-sm font-bold">COMPLAINT: {c.title}</p>
    <p className="text-sm">STATUS: {c.status}</p>



    {/* DESCRIPTION EDIT SECTION */}
    <div className="mt-2">
      {editingId === c.post_id ? (
        <>
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSaveEdit(c.post_id)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded"
            >
              SAVE
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="px-3 py-1 bg-gray-400 text-white text-sm rounded"
            >
              CANCEL
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm mt-2">
            <strong>Description:</strong> {c.description}
          </p>
          <button
            onClick={() => {
              setEditingId(c.post_id);
              setEditedDescription(c.description);
            }}
            className="mt-2 px-3 py-1 bg-[#384959] text-white text-sm rounded hover:bg-[#4c6274]"
          >
            EDIT POST
          </button>
        </>
      )}
    </div>

    {/* DELETE */}
    <div className="flex items-center space-x-5 mt-4">
      <button
        onClick={() => setPage("track-progress")}
        className="px-3 py-1 bg-[#384959] text-white text-sm rounded hover:bg-[#4c6274]"
      >
        TRACK PROGRESS
      </button>

      <img
        src={process.env.PUBLIC_URL + "/bin.jpg"}
        alt="Delete"
        className="ml-2 h-6 w-5 cursor-pointer hover:scale-110 transition"
        onClick={async () => {
          const userData = JSON.parse(localStorage.getItem("user"));
          if (!userData) {
            setPage("login");
            return;
          }

          if (!window.confirm("Are you sure you want to delete this complaint?")) {
            return;
          }

          try {
            const res = await fetch(
              `http://localhost:5001/api/posts/${c.post_id}`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userData.userid })
              }
            );

            const data = await res.json();

            if (!res.ok) {
              alert(data.message);
              return;
            }

            setMyComplaints(prev =>
              prev.filter(p => p.post_id !== c.post_id)
            );

            alert("Complaint deleted successfully");

          } catch (error) {
            console.error(error);
            alert("Error deleting complaint");
          }
        }}
      />
    </div>

  </div>
))}
        </div>
      </div>
    </ProtectedRoute>
  )}
                 

      {page === "login" && <Login setPage={setPage} setUser={setUser} />}
      {page === "register" && <Register setPage={setPage} />}
      {page === "admin-login" && <AdminLogin setPage={setPage} />}
      {page === "profile" && (
  <ProtectedRoute setPage={setPage}>
    <ProfileEdit setPage={setPage} />
  </ProtectedRoute>
)}
      {page === "admin-dashboard" && <AdminDashboard setPage={setPage} />}
      {page === "register-complaint" && (
  <ProtectedRoute setPage={setPage}>
    <RegisterComplaint setPage={setPage} />
  </ProtectedRoute>
)}
      {page === "track-progress" && <TrackProgress setPage={setPage} />}





      {/* Footer */}
      <footer className="bg-[#384959] py-6 text-center text-white text-sm">
        Copyright 2026 <br />
        All rights reserved. Powered by Government Engineering College
        Kozhikode
      </footer>
    </div>
  );
}

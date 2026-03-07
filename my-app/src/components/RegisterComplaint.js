import React from 'react';
import OSMMap from '../components/OSMMap';
import Modal from '../components/Modal';
import './App3.css';

export default function RegisterComplaint({ setPage }) {
  const [open, setOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState('');
  const fileInputRef = React.useRef(null);
  const [details, setDetails] = React.useState('');
  const [error, setError] = React.useState('');
  const [location, setLocation] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [title, setTitle] = React.useState('');

const handleRegister = async (e) => {
  e.preventDefault();

  if (!title.trim()) {
  setError('Please enter complaint title.');
  return;
}

  if (!details.trim()) {
    setError('Please enter complaint details.');
    return;
  }

  if (!location) {
    setError('Please select location on map.');
    return;
  }

  setError('');

  try {
    const formData = new FormData();
    formData.append('userid', localStorage.getItem('userid')); // or from auth context
    
    formData.append('description', details);
    formData.append('lat', location.lat);
    formData.append('lng', location.lng);

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    const response = await fetch('http://localhost:5001/api/posts', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || 'Failed to register complaint');
      return;
    }

    setOpen(true);
    setDetails('');
    setLocation(null);
    setSelectedFile(null);
    setFileName('');

  } catch (error) {
    console.error(error);
    setError('Server not connected');
  }
};

  return (
    <div className="page page-light">


      <div className="page-inner">
        <div className="page-title">REGISTER COMPLAINT</div>

        <div className="register-grid">
          <div className="register-left">
            <div className="avatar">👤</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                setFileName(file ? file.name : '');
                setSelectedFile(file);
              }}
            />
            <button
              className="secondary wide"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Upload Image
            </button>
            {fileName ? <div style={{ fontSize: 12 }}>Selected: {fileName}</div> : null}
            <input
  className="input"
  type="text"
  placeholder="Enter complaint title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>
            <textarea
              className="input"
              rows="5"
              placeholder="Enter complaint details here"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-invalid={!!error}
            />
            {error ? <div style={{ color: '#b00020', fontSize: 12 }}>{error}</div> : null}

            {/* Location input */}
            <input
              className="input"
              placeholder="Location details"
              value={location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : ''}
              readOnly
            />

            <button className="primary wide" onClick={handleRegister}>Register Complaint</button>
          </div>

          <div className="register-map">
            {/* Connected map */}
            <OSMMap height={420} value={location} onChange={setLocation} />
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registration Successful!" okText="OK">
        Your complaint has been successfully registered.
      </Modal>
    </div>
  );
}

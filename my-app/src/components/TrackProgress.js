import React from 'react';
import OSMMap from '../components/OSMMap';
import './App3.css';

export default function TrackProgress({ setPage }) {
  return (
    <div className="page page-light">
     

      <div className="page-inner">
        <div className="page-title">TRACK PROGRESS</div>

        <div className="track-layout">
          <div className="map-board">
            <OSMMap height={420} selectable={false} />
          </div>
          <aside className="legend">
            <div className="legend-row"><span className="dot red" /> Pending</div>
            <div className="legend-row"><span className="dot yellow" /> In Progress</div>
            <div className="legend-row"><span className="dot green" /> Solved</div>
          </aside>
        </div>
      </div>
    </div>
  );
}



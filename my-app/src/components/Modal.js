import React from 'react';

export default function Modal({ open, onClose, title, children, okText = 'OK' }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        {title ? <div className="modal-title">{title}</div> : null}
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="primary" onClick={onClose}>{okText}</button>
        </div>
      </div>
    </div>
  );
}



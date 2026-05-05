import React from 'react';
import './Unauthenticated.scss';

const Unauthenticated = () => {
  return (
    <div className="unauthenticated-container">
      <div className="unauthenticated-content">
        <h1>Access Denied</h1>
        <p>You are not authenticated. Please login to access this application.</p>
      </div>
    </div>
  );
};

export default Unauthenticated;

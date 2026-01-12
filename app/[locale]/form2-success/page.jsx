'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Home, Plus, FileText } from 'lucide-react';

const Form2Success = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [copySuccess, setCopySuccess] = useState(false);

  return (
    <div className="page-container">
      {/* Logo in top left corner */}
      <div className="logo-container">
        <a href="/" className="logo-link">
        <img
                        src="/assets/images/logos/logo.png"
                        style={{ height: '70px' }}
                        alt="Logo"
                        title="Logo"
                        
                      />
        </a>
      </div>

      {/* Main Content Card */}
      <div className="main-card">
        {/* Success Icon */}
        <div className="success-icon-container">
          <CheckCircle 
            size={64} 
            className="success-icon"
          />
        </div>

        {/* Success Message */}
        <div className="message-container">
          <h1 className="success-title">
            Submission Successful
          </h1>
          <p className="success-description">
            Your document has been submitted successfully and is pending notary approval.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="button-container">
          {/* Return to Home Button */}
          <Link href="/" className="button-link">
            <button className="primary-button">
              <Home size={18} className="button-icon" />
              <span>Return to Home</span>
            </button>
          </Link>
          
          {/* Submit Another Document Button */}
          <Link href="/forms2" className="button-link">
            <button className="secondary-button">
              <Plus size={18} className="button-icon" />
              <span>Submit Another Document</span>
            </button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        /* Reset and base styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
        }

        /* Page container */
        .page-container {
          min-height: 100vh;
          background-color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
        }

        /* Logo styles */
        .logo-container {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          z-index: 10;
        }

        .logo-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #1C2434;
          font-weight: 600;
          font-size: 1.25rem;
          transition: opacity 0.2s ease;
        }

        .logo-link:hover {
          opacity: 0.8;
        }

        .logo-icon {
          margin-right: 0.5rem;
          color: #1C2434;
        }

        .logo-text {
          color: #1C2434;
        }

        /* Main card styles */
        .main-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          padding: 3rem;
          max-width: 28rem;
          width: 100%;
          text-align: center;
        }

        /* Success icon styles */
        .success-icon-container {
          margin: 0 auto 2rem auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-icon {
          color: #059669;
          stroke-width: 2;
        }

        /* Message styles */
        .message-container {
          margin-bottom: 2.5rem;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1C2434;
          margin-bottom: 1rem;
          line-height: 1.3;
        }

        .success-description {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.6;
        }

        /* Button container */
        .button-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .button-link {
          display: block;
          text-decoration: none;
        }

        /* Button base styles */
        .primary-button,
        .secondary-button {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          font-size: 1rem;
        }

        /* Primary button styles */
        .primary-button {
          background-color: #1C2434;
          color: white;
        }

        .primary-button:hover {
          background-color: #2a3441;
        }

        .primary-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px #1C2434, 0 0 0 4px rgba(28, 36, 52, 0.2);
        }

        /* Secondary button styles */
        .secondary-button {
          background-color: white;
          color: #1C2434;
          border: 2px solid #1C2434;
        }

        .secondary-button:hover {
          background-color: #f9fafb;
        }

        .secondary-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px #1C2434, 0 0 0 4px rgba(28, 36, 52, 0.2);
        }

        /* Button icon styles */
        .button-icon {
          margin-right: 0.5rem;
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .main-card {
            padding: 2rem;
            margin-top: 4rem;
          }
          
          .logo-container {
            top: 1rem;
            left: 1rem;
          }
          
          .logo-text {
            display: none;
          }
          
          .success-title {
            font-size: 1.25rem;
          }
          
          .success-description {
            font-size: 0.875rem;
          }
        }

        @media (max-width: 480px) {
          .page-container {
            padding: 0.5rem;
          }
          
          .main-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Form2Success; 
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';

export default function FormSuccessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  return (
    <>
      <style jsx>{`
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          margin-right: 300px;
        }
        .content-area {
          flex: 1;
          padding: 2rem;
          background-color: #f8f9fa;
        }
        .card {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 2rem;
        }
        .progress-sidebar {
          width: 300px;
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          border-left: 1px solid rgba(0,0,0,0.1);
          background-color: #091534;
          z-index: 1000;
        }
        @media (max-width: 768px) {
          .page-container { margin-right: 0; }
          .content-area { padding: 1rem; }
          .progress-sidebar { display: none; }
        }
      `}</style>

      <div className="page-container">
        <div className="content-area d-flex align-items-center justify-content-center">
          <div className="card text-center" style={{ maxWidth: 720, width: '100%' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#2D3748', fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
              {t('Payment Complete')}
            </h2>
            <p style={{ color: '#718096', fontSize: 16, marginBottom: 24 }}>
              {t('Thank you! Your payment was successful. You will receive a confirmation email shortly.')}
            </p>

            <div className="d-flex gap-3 justify-content-center">
              <Link legacyBehavior href={`/${locale}`}>
                <a className="btn" style={{ backgroundColor: '#274171', color: 'white', padding: '10px 30px', borderRadius: 6 }}>
                  {t('Go to Home')}
                </a>
              </Link>
              <Link legacyBehavior href={`/${locale}/form-step1`}>
                <a className="btn btn-outline-secondary" style={{ padding: '10px 30px', borderRadius: 6 }}>
                  {t('Start a new form')}
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={5} />
      </div>
    </>
  );
}



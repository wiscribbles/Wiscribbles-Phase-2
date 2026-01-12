# WiScribble Platform Documentation

## 1. Introduction

WiScribble is a Next.js 14 application that guides users through drafting, signing, and notarizing legal documents. It provides multi-step document workflows, e-sign vs. live notary services, payments, and a comprehensive admin control center. Authentication, persistence, and file storage rely on Firebase, while Supabase enables real-time collaboration. Cloudinary stores stamped PDFs, and pdf-lib/pdfjs handle document rendering and stamping. Styling is primarily via Bootstrap 5 with Tailwind utilities. Internationalization is powered by `next-intl`.

### Key Technologies
- Next.js 14 App Router, React 18
- Firebase Auth, Firestore, Storage, Analytics
- Supabase for collaborative sessions
- Cloudinary for document storage
- pdf-lib, pdfjs-dist for PDF processing
- Bootstrap 5, Tailwind/PostCSS/Sass
- EmailJS, ZegoCloud UIKit, Stripe integrations
- Localization through `next-intl`

### Repository Structure
- `app/`: Locale-aware pages, layouts, and API routes
- `components/`: Form steps, admin interface, reusable UI, video modules, shared widgets
- `services/`: Firestore access helpers, synchronization utilities
- `context/`, `contexts/`: Auth and workflow providers
- `config/`, `constants/`: Document type registry and menu configs
- `hooks/`, `store/`, `utils/`: Custom hooks, Zustand stores, shared helpers
- `scripts/`: Maintenance scripts for Firestore data hygiene
- `docs/`: Internal guides (deployment, user flows, etc.)
- `public/`: Static assets (logos, icons, sample documents)

## 2. Application Shell

Every page renders inside global providers defined in `app/layout.jsx`. `AuthProvider` and `WorkflowProvider` wrap the application, and a toast channel (`Notifications`) is always available. `middleware.js` enforces localized routing via `next-intl`.

### Root Layout (`app/layout.jsx`)
- Imports a Google Font (`Inter`) and applies it globally.
- Wraps children with `AuthProvider` and `WorkflowProvider`.
- Renders toast notifications via `Notifications`.
- Sets default metadata for the site.

```jsx
// app/layout.jsx
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { WorkflowProvider } from '../contexts/WorkflowContext';
import Notifications from '../components/Notifications';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WiScribble',
  description: 'Document Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WorkflowProvider>
            {children}
            <Notifications position="top-right" maxNotifications={5} />
          </WorkflowProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Localization Middleware (`middleware.js`, `i18n/routing.js`)
- Uses `next-intl` `defineRouting` to register supported locales (`en`, `es`).
- Middleware strips API and static asset routes while enforcing locale segments.
- Ensures localized URLs like `/en/...` and `/es/...`.

```javascript
// middleware.js
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
```

## 3. Authentication & Authorization

### Auth Context (`context/AuthContext.jsx`)
- Listens to Firebase Auth state with `onAuthStateChanged`.
- On login, fetches user profile from Firestore (`users` collection) and merges fields such as `role`, `status`, `staffRole`.
- Provides `user` and `loading` state to children. Renders nothing until loading completes to prevent flicker.

```jsx
// context/AuthContext.jsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              ...userDoc.data(),
            });
          } else {
            setUser({
              uid: authUser.uid,
              email: authUser.email,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            uid: authUser.uid,
            email: authUser.email,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Sign-In Flow (`components/SignInEmailForm.jsx`)
- Single email/password form using `react-hook-form` with localized validation messages.
- On mount, stores any `redirect` query parameter in `sessionStorage`.
- After successful authentication:
  - Blocks users with non-active statuses (`pending_review`, `suspended`, etc.).
  - Redirects to stored return URL if present.
  - Otherwise sends admins and staff to `/<locale>/admin`, others to `/<locale>/dashboard`.
- Logs Firebase errors and shows human-readable messages.

```jsx
// components/SignInEmailForm.jsx (excerpt)
"use client";

import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, getUserData } from "../firebase";
import { useAuth } from '@/context/AuthContext';

// ...

useEffect(() => {
  const redirectTarget = searchParams.get('redirect');
  if (redirectTarget) {
    sessionStorage.setItem('returnUrl', redirectTarget);
  }
}, [searchParams]);

useEffect(() => {
  if (!loading && user) {
    const storedReturnUrl = sessionStorage.getItem('returnUrl');
    const shouldRouteToAdmin =
      (user.role === 'admin' || user.signUpAs === 'Admin' || user.isStaff === true || user.staffRole === 'operations') &&
      (!user.status || user.status === 'active' || user.status === 'approved');

    if (storedReturnUrl) {
      sessionStorage.removeItem('returnUrl');
      router.replace(storedReturnUrl.startsWith('/') ? storedReturnUrl : `/${locale}${storedReturnUrl}`);
    } else if (shouldRouteToAdmin) {
      router.replace(`/${locale}/admin`);
    } else {
      router.replace(`/${locale}/dashboard`);
    }
  }
}, [user, loading, router, locale]);

const onSubmit = async (data) => {
  setServerError(null);
  setIsSubmitting(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    if (userCredential.user) {
      const { success, data: userData } = await getUserData(userCredential.user.uid);
      if (success) {
        console.log("User signed in successfully:", userData);
      } else {
        setServerError("Failed to retrieve user data. Please try again.");
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    // ... error handling omitted for brevity
  } finally {
    setIsSubmitting(false);
  }
};
```

### Sign-Up Flow (`components/SignUpForm2.jsx`)
- Handles detailed registration with file uploads for identification and optional notary certificate.
- Determines `role` (`notary`, `attorney`, `business`, etc.) and default `status` (`pending_review` for professionals, `active` otherwise).
- Saves user metadata to Firestore via `storeUserData`.
- Logs debug output to the console when validation prevents submission to aid QA.

```jsx
// components/SignUpForm2.jsx (role + status helpers)
const getRoleFromSignUp = (value) => {
  switch (value) {
    case 'Notary':
      return 'notary';
    case 'Attorney':
      return 'attorney';
    case 'Business':
      return 'business';
    case 'Real Estate Agent':
      return 'real_estate_agent';
    default:
      return 'user';
  }
};

const determineInitialStatus = (value) => {
  if (value === 'Notary' || value === 'Attorney') {
    return 'pending_review';
  }
  return 'active';
};

const userData = {
  uid: userCredential.user.uid,
  signUpAs: data.signUpAs,
  role: getRoleFromSignUp(data.signUpAs),
  status: determineInitialStatus(data.signUpAs),
  // ...additional fields saved to Firestore
};
```

### Admin Guard (`components/AdminGuard.jsx`)
- Protects all admin routes.
- Redirects unauthenticated users to `/<locale>/auth/signin?redirect=<return>`.
- Grants access when `role === 'admin'`, `signUpAs === 'Admin'`, `isStaff === true`, or `staffRole === 'operations'`.
- Shows a loading spinner while auth state resolves.

```jsx
// components/AdminGuard.jsx
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const segments = pathname?.split('/') ?? [];
  const locale = segments.length > 1 && segments[1] ? segments[1] : 'en';
  const loginPath = `/${locale}/auth/signin`;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirectTarget = encodeURIComponent(pathname || `/${locale}/admin`);
      router.replace(`${loginPath}?redirect=${redirectTarget}`);
      return;
    }

    const isAuthorized =
      user.role === 'admin' ||
      user.signUpAs === 'Admin' ||
      user.isStaff === true ||
      user.staffRole === 'operations';

    if (!isAuthorized) {
      router.replace('/');
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Preparing your admin workspace...</p>
      </div>
    );
  }

  const isAuthorized =
    user.role === 'admin' ||
    user.signUpAs === 'Admin' ||
    user.isStaff === true ||
    user.staffRole === 'operations';

  if (!isAuthorized) {
    router.replace(loginPath);
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
```

## 4. Workflow Orchestration

### Workflow Provider (`contexts/WorkflowContext.js`)
- Manages the user journey through document selection, form steps, service choice (e-sign vs. notary), payment, video call, signing, and completion.
- Tracks form data, validation errors, collaborators, payment state, signature data, and notifications.
- Dispatch functions cover navigation (`nextFormSection`, `prevFormSection`), service selection, video call lifecycle, and real-time synchronization hooks.

```jsx
// contexts/WorkflowContext.js (excerpt)
'use client';

import React, { createContext, useContext, useReducer } from 'react';

export const WORKFLOW_STATES = {
  DOCUMENT_SELECTION: 'document_selection',
  FORM_FILLING: 'form_filling',
  SERVICE_SELECTION: 'service_selection',
  PAYMENT: 'payment',
  VIDEO_CALL: 'video_call',
  DOCUMENT_SIGNING: 'document_signing',
  COMPLETED: 'completed',
};

const initialState = {
  currentStep: WORKFLOW_STATES.DOCUMENT_SELECTION,
  selectedDocumentType: null,
  selectedSubtype: null,
  documentConfig: null,
  formData: {},
  currentFormSection: 0,
  formErrors: {},
  selectedService: null,
  signatures: {},
  notifications: [],
  isLoading: false,
};

function workflowReducer(state, action) {
  switch (action.type) {
    case 'SET_DOCUMENT_TYPE':
      return {
        ...state,
        selectedDocumentType: action.payload.documentType,
        selectedSubtype: action.payload.subtype || null,
        documentConfig: action.payload.config,
        formData: {},
        currentFormSection: 0,
        formErrors: {},
      };
    // ...additional cases handle navigation, collaboration, payments, etc.
    default:
      return state;
  }
}

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const actions = {
    setDocumentType: (documentType, config, subtype = null) =>
      dispatch({ type: 'SET_DOCUMENT_TYPE', payload: { documentType, config, subtype } }),
    updateFormField: (fieldId, value) =>
      dispatch({ type: 'UPDATE_FORM_FIELD', payload: { fieldId, value } }),
    // ...other action helpers omitted for brevity
  };

  return (
    <WorkflowContext.Provider value={{ state, actions }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
```

### Multi-Step Form Page (`app/[locale]/form-step3/page.jsx`)
- Loads document configuration from `config/documentTypes.js` based on prior selections stored in localStorage.
- Saves form data to both localStorage and Firestore for real-time recovery.
- Uses `DocumentFormFactory` to render either declarative JSON-driven forms or legacy React components.
- Navigates to `/form-step4` on proceed.

```jsx
// app/[locale]/form-step3/page.jsx (excerpt)
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveDocumentFormData, getFormData } from '@/utils/formStorage';
import { saveDocumentFormDataLocalAndDB } from '@/utils/documentFormStorage';
import DocumentFormFactory from '@/components/documentForms/DocumentFormFactory';
import { getDocumentConfig } from '@/config/documentTypes';

export default function DocumentFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentFormData, setDocumentFormData] = useState({});
  const [documentConfig, setDocumentConfig] = useState(null);

  useEffect(() => {
    const savedData = getFormData().step1;
    if (savedData && savedData.documentType) {
      setSelectedDocument(savedData.documentType);
    }
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      setDocumentConfig(getDocumentConfig(selectedDocument));
    } else {
      setDocumentConfig(null);
    }
  }, [selectedDocument]);

  const handleDocumentFormDataChange = useCallback(async (data) => {
    setDocumentFormData(data);
    if (selectedDocument) {
      try {
        saveDocumentFormData(selectedDocument, data);
        await saveDocumentFormDataLocalAndDB(selectedDocument, data);
      } catch (error) {
        console.error('Error saving document form data:', error);
        saveDocumentFormData(selectedDocument, data);
      }
    }
  }, [selectedDocument]);

  const handleProceedFromForm = useCallback(() => {
    router.push(`/${locale}/form-step4`);
  }, [router, locale]);

  // ...JSX omitted (header, cards, sidebar, etc.)
}
```

### DocumentFormFactory (`components/documentForms/DocumentFormFactory.jsx`)
- Decides between:
  - Dynamic rendering via `DynamicFormRenderer` when a document type is registered in `config/documentTypes.js`.
  - Specialized subcomponents for legacy forms (e.g., `PowerOfAttorneyForm`, `PassportApplicationForm`).
- Handles power-of-attorney subtypes (`durable`, `limited`, `real estate`) by mapping to base config with subtype overrides.
- Provides consistent styling and container wrappers for forms.

```jsx
// components/documentForms/DocumentFormFactory.jsx (excerpt)
'use client';

import DynamicFormRenderer from '../DynamicFormRenderer/DynamicFormRenderer';
import PowerOfAttorneyForm from './PowerOfAttorneyForm';
import PassportApplicationForm from './PassportApplicationForm';
import UploadDocumentForm from './UploadDocumentForm';
import { documentTypes } from '@/config/documentTypes';

const DocumentFormFactory = ({ documentType, formData, onFormDataChange, onProceed }) => {
  const powerOfAttorneySubtypeMap = {
    'durable-financial-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'durable_financial' },
    'limited-special-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'limited_special' },
    'real-estate-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'real_estate' },
  };

  const subtypeInfo = powerOfAttorneySubtypeMap[documentType];

  if (subtypeInfo) {
    const docConfig = documentTypes[subtypeInfo.baseType];
    if (docConfig?.sections?.length > 0) {
      return (
        <DynamicFormRenderer
          documentType={subtypeInfo.baseType}
          subtype={subtypeInfo.subtype}
          formData={formData}
          onFieldChange={(fieldId, value) => onFormDataChange({ ...formData, [fieldId]: value })}
          onSubmit={onProceed}
          mode="normal"
        />
      );
    }
  }

  const docConfig = documentTypes[documentType];
  if (docConfig?.sections?.length > 0) {
    return (
      <DynamicFormRenderer
        documentType={documentType}
        formData={formData}
        onFieldChange={(fieldId, value) => onFormDataChange({ ...formData, [fieldId]: value })}
        onSubmit={onProceed}
        mode="normal"
      />
    );
  }

  switch (documentType) {
    case 'power-of-attorney':
      return <PowerOfAttorneyForm formData={formData} onFormDataChange={onFormDataChange} onProceed={onProceed} />;
    case 'passport-application':
      return <PassportApplicationForm formData={formData} onFormDataChange={onFormDataChange} onProceed={onProceed} />;
    case 'custom-document':
      return <UploadDocumentForm formData={formData} onFormDataChange={onFormDataChange} onProceed={onProceed} />;
    default:
      return null;
  }
};

export default DocumentFormFactory;
```

### Signature Capture (`components/SignatureField.jsx`)
- Reusable signature component built atop `react-signature-canvas`.
- Manages clearing, loading existing signatures, and saving images as PNG data URLs.
- Shows an overlay prompt “Sign here” when empty.

```jsx
// components/SignatureField.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureField = ({ label, helperText, value, onChange, height = 120, style = {} }) => {
  const canvasRef = useRef(null);
  const storedValueRef = useRef(value || null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (value && value !== storedValueRef.current) {
      try {
        canvas.fromDataURL(value);
        storedValueRef.current = value;
        setIsEmpty(false);
      } catch (error) {
        console.warn('Unable to load saved signature', error);
      }
    } else if (!value && storedValueRef.current) {
      canvas.clear();
      storedValueRef.current = null;
      setIsEmpty(true);
    } else if (!value && typeof canvas.isEmpty === 'function' && !canvas.isEmpty()) {
      canvas.clear();
      setIsEmpty(true);
    }
  }, [value]);

  const handleSignatureEnd = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.isEmpty()) {
      onChange('');
      storedValueRef.current = null;
      setIsEmpty(true);
      return;
    }

    const dataUrl = canvas.getTrimmedCanvas().toDataURL('image/png');
    storedValueRef.current = dataUrl;
    onChange(dataUrl);
    setIsEmpty(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.clear();
    storedValueRef.current = null;
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>{label}</div>}
      <div
        style={{
          border: '2px solid #333',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          padding: '12px',
          width: '100%',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
          <SignatureCanvas
            ref={canvasRef}
            penColor="#274171"
            backgroundColor="#ffffff"
            throttle={16}
            canvasProps={{
              width: 600,
              height,
              style: {
                width: '100%',
                height: '100%',
                borderRadius: '4px',
                cursor: 'crosshair',
              },
            }}
            onEnd={handleSignatureEnd}
          />
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#A0AEC0',
                pointerEvents: 'none',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              Sign here
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#4A5568' }}>
            {helperText || 'Draw your signature inside the box'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #274171',
              color: '#274171',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureField;
```

## 5. Admin Operations Panel

### Shell (`components/admin/AdminShell.jsx`)
- Responsive admin layout with:
  - Gradient sidebar, active state highlights, and icon badges.
  - Centered white logo + tagline.
  - Live date and time in the header, refreshed every 30 seconds.
  - User profile (name + role) pinned to the left of the header.
  - Sign out buttons for desktop and mobile views (trigger Firebase `signOut`).
  - Collapsible mobile drawer with navigation and sign-out option.
- Navigation items: Overview, User Accounts, Notarizations, Payments, Commissioners (Settings removed per feedback).
- Adds right margin to the main content area for breathing room.

```jsx
// components/admin/AdminShell.jsx (excerpt)
'use client';

import { Menu, X, LayoutDashboard, Users, FileText, CreditCard, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

const navigationItems = [
  { label: 'Overview', slug: '', icon: LayoutDashboard, description: 'Platform performance and metrics' },
  { label: 'User Accounts', slug: '/users', icon: Users, description: 'Manage platform members and onboarding' },
  { label: 'Notarizations', slug: '/notarizations', icon: FileText, description: 'Audit executed and scheduled notarizations' },
  { label: 'Payments', slug: '/payments', icon: CreditCard, description: 'Review transactions and payouts' },
  { label: 'Commissioners', slug: '/commissioners', icon: ShieldCheck, description: 'Review commissioner of oaths applications' },
];

const AdminShell = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out');
      router.replace(`/${locale}/auth/signin`);
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('Unable to sign out, please try again.');
    }
  };

  const renderNavItems = () =>
    navigationItems.map((item) => {
      const Icon = item.icon;
      const href = `${basePath}${item.slug}`;
      const isActive = item.slug === activeSlug;

      return (
        <Link key={href} href={href} className="text-decoration-none d-block">
          <div
            className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 ${
              isActive ? 'bg-white text-dark shadow-sm' : 'text-white-50'
            }`}
          >
            <span
              className={`d-flex align-items-center justify-content-center rounded-circle ${
                isActive ? 'bg-primary text-white shadow-sm' : 'text-white-50 border border-white border-opacity-25'
              }`}
              style={{ width: 32, height: 32 }}
            >
              <Icon size={18} />
            </span>
            <div className="d-flex flex-column">
              <span className={`fw-semibold ${isActive ? 'text-dark' : 'text-white'}`}>{item.label}</span>
              <small className={`mb-0 ${isActive ? 'text-muted' : 'text-white-50'}`}>{item.description}</small>
            </div>
          </div>
        </Link>
      );
    });

  // ...header and mobile drawer omitted for brevity
};

export default AdminShell;
```

### Overview Dashboard (`app/[locale]/admin/page.jsx`)
- Fetches aggregated metrics and recent activity via `AdminService`:
  - Pending notarizations, active users, pending reviews, scheduled payouts.
  - Tables for “Notarizations in Progress”, “Accounts Awaiting Approval”, “Scheduled Payments”.
- Uses badges with readable color contrast (e.g., `text-gray-600` for status).
- Removes action columns/buttons where requested.
- Shows loading spinner while data loads and logs errors to console.

```jsx
// app/[locale]/admin/page.jsx (excerpt)
'use client';

import { fetchAdminDashboardMetrics, fetchNotarizationSubmissions, fetchUsers, fetchPaymentTransactions } from '@/services/AdminService';

useEffect(() => {
  let isMounted = true;

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [metricData, recentNotarizations, reviewUsers, scheduledPayments] = await Promise.all([
        fetchAdminDashboardMetrics(),
        fetchNotarizationSubmissions({ limit: 5, includeCompleted: false }),
        fetchUsers({ status: 'pending_review', limit: 5 }),
        fetchPaymentTransactions({ status: 'scheduled', limit: 5 }),
      ]);

      if (!isMounted) return;
      setMetrics(metricData);
      setNotarizations(recentNotarizations);
      setPendingUsers(reviewUsers);
      setPayments(scheduledPayments);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadDashboard();
  return () => {
    isMounted = false;
  };
}, []);

<RecentTable
  title="Notarizations in Progress"
  headers={['Reference', 'Client', 'Document', 'Status', 'Submitted']}
  rows={notarizations.map((submission) => ({
    id: submission.id,
    cells: [
      { content: submission.referenceNumber || '—', className: 'fw-semibold text-primary' },
      `${submission?.step1?.firstName ?? ''} ${submission?.step1?.lastName ?? ''}`.trim() || '—',
      submission?.document?.name || submission?.step2?.documentType || '—',
      <span className="badge bg-primary bg-opacity-75 text-gray-600 text-capitalize font-weight-bold">
        {submission.status || 'pending'}
      </span>,
      new Date(submission.submittedAt || submission.createdAt || Date.now()).toLocaleString(),
    ],
  }))}
  emptyLabel="No active notarization workflows at the moment."
/>;
```

### User Management (`app/[locale]/admin/users/page.jsx`)
- Provides filters for status and role, excluding admin users by default.
- Normalizes `status` and `role` values to avoid “unknown” labels.
- Shows call-to-action buttons (Approve, Decline, Activate, Suspend) based on current status.
- Detail panel reveals contact info, verification assets, and review notes with a “Copy full record” button.

```jsx
// app/[locale]/admin/users/page.jsx (excerpt)
const normalizeStatus = (status) => {
  if (!status) return 'pending_review';
  return status.toLowerCase();
};

const statusBadgeClass = (status) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'approved':
    case 'active':
      return 'bg-success-subtle text-dark';
    case 'pending_review':
    case 'pending':
      return 'bg-warning-subtle text-dark';
    case 'rejected':
      return 'bg-danger-subtle text-dark';
    case 'suspended':
      return 'bg-secondary-subtle text-dark';
    default:
      return 'bg-light text-dark';
  }
};

const loadUsers = async () => {
  try {
    setLoading(true);
    const result = await fetchUsers({
      status: selectedStatus,
      role: selectedRole,
      limit: 200,
    });
    const filtered = result.filter((user) => (user.role || user.signUpAs || '').toLowerCase() !== 'admin');
    setUsers(filtered);
  } catch (error) {
    console.error('Failed to load users:', error);
    toast.error('Unable to load user accounts');
  } finally {
    setLoading(false);
  }
};

<span className={`badge ${statusBadgeClass(user.status)}`}>
  {formatStatusLabel(user.status)}
</span>
```

### Notarizations, Payments, Commissioners Pages
- Load data using `AdminService` helper functions.
- Log errors to console instead of user-facing toasts (per request).
- Provide context-specific actions (process payments, audit submissions, review commissioner applications).

## 6. Firestore Service Layer

### AdminService (`services/AdminService.js`)
- Centralizes Firestore queries for admin dashboards.
- Strategies:
  - Uses client-side sorting when filters are applied to avoid Firestore composite indexes (`shouldSortClientSide`).
  - Provides helper methods (`fetchUsers`, `fetchNotarizationSubmissions`, `fetchPaymentTransactions`, `fetchCommissionerApplications`) returning normalized arrays.
  - `fetchAdminDashboardMetrics` aggregates key counts while excluding admin roles.
- Update functions (`updateUserStatus`, `updateNotarizationStatus`, `markPaymentAsProcessed`) ensure `updatedAt` metadata is stamped.
- `recordPaymentTransaction` and `recordCommissionerApplication` provide consistent default fields (`status`, timestamps).
- `fetchAdminSettings` / `updateAdminSettings` read/write a central `adminSettings/global` document.

```javascript
// services/AdminService.js (excerpt)
'use client';

import { db, auth } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const SUBMISSIONS_COLLECTION = 'formSubmissions';
const PAYMENTS_COLLECTION = 'paymentTransactions';
const COMMISSIONER_APPLICATIONS_COLLECTION = 'commissionerApplications';

const buildQueryWithFilters = (baseCollection, filters = [], sort = null, limitValue = null) => {
  const clauses = [collection(db, baseCollection)];

  filters.filter(Boolean).forEach((filter) => clauses.push(where(filter.field, filter.operator, filter.value)));

  if (sort) {
    clauses.push(orderBy(sort.field, sort.direction ?? 'desc'));
  }

  if (limitValue) {
    clauses.push(firestoreLimit(limitValue));
  }

  return query(...clauses);
};

export const fetchUsers = async ({ role, status, limit: limitValue = 100, sortBy = 'createdAt', sortDirection = 'desc' } = {}) => {
  const filters = [];
  if (role && role !== 'all') {
    filters.push({ field: 'role', operator: '==', value: role });
  }

  if (status && status !== 'all') {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const shouldSortClientSide = Boolean(sortBy) && filters.length > 0;

  const builtQuery = buildQueryWithFilters(
    USERS_COLLECTION,
    filters,
    shouldSortClientSide ? null : sortBy ? { field: sortBy, direction: sortDirection } : null,
    limitValue,
  );

  const snapshot = await getDocs(builtQuery);
  const users = snapshot.docs.map((userDoc) => ({
    id: userDoc.id,
    ...userDoc.data(),
  }));

  if (shouldSortClientSide) {
    users.sort((a, b) => {
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';
      if (aValue === bValue) return 0;
      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }

  return limitValue ? users.slice(0, limitValue) : users;
};

export const updateUserStatus = async (userId, { status, reviewerId, notes = '' }) => {
  if (!userId || !status) {
    throw new Error('User ID and status are required to update user status');
  }

  const now = new Date().toISOString();

  const updates = {
    status,
    reviewerId: reviewerId ?? auth.currentUser?.uid ?? null,
    reviewNotes: notes,
    updatedAt: now,
  };

  if (status === 'approved') {
    updates.approvedAt = now;
    updates.rejectedAt = null;
  } else if (status === 'rejected') {
    updates.rejectedAt = now;
    updates.approvedAt = null;
  }

  await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
};

export const fetchAdminDashboardMetrics = async () => {
  const [pendingNotarySubmissions, activeUsers, pendingUsers, pendingPayments] = await Promise.all([
    fetchNotarizationSubmissions({ status: 'pending', limit: 200 }),
    fetchUsers({ status: 'active', limit: 200, sortBy: null }),
    fetchUsers({ status: 'pending_review', limit: 200, sortBy: null }),
    fetchPaymentTransactions({ status: 'scheduled', limit: 200 }),
  ]);

  const isAdmin = (user) => (user.role || user.signUpAs || '').toLowerCase() === 'admin';

  return {
    pendingNotarizations: pendingNotarySubmissions.length,
    activeUsers: activeUsers.filter((user) => !isAdmin(user)).length,
    pendingUsers: pendingUsers.filter((user) => !isAdmin(user)).length,
    pendingPayments: pendingPayments.length,
  };
};
```

### Firebase Client (`firebase.js`)
- Initializes Firebase app with env vars (`NEXT_PUBLIC_FIREBASE_*`).
- Exports shared instances: `auth`, `db`, `storage`, `analytics`.
- Provides `getUserData` (Firestore fetch) and `storeUserData` (upsert) helpers.

```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

async function getUserData(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { success: false, error };
  }
}

const storeUserData = async (userData) => {
  try {
    await setDoc(doc(db, 'users', userData.uid), userData);
    return { success: true };
  } catch (error) {
    console.error('Error storing user data:', error);
    return { success: false, error };
  }
};

export { auth, db, storage, analytics, storeUserData, getUserData };
```

### Supabase (`lib/supabase.js`)
- Creates a singleton Supabase client for real-time collaborative features.
- Pulls credentials from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
```

## 7. Serverless API Routes (`app/api/*`)

Key endpoints:
- `notarize/route.js`: Retrieves submissions, applies footer text and page numbers to PDFs with pdf-lib, uploads stamped file to Cloudinary, updates Firestore with approval metadata.
- `document-forms/save`: Persists form data for dynamic forms.
- `form2/submit`, `form2/approve`: Handles legacy form flow submissions.
- `create-payment-intent`, `stripe`: Stripe payment intent scaffolding.
- `download-document`, `generate-pdf`, `stamp-pdf`, `notary-stamp-pdf`: PDF fetch and stamping utilities.
- `send-document-email`: Email distribution using EmailJS.
- `debug-submission`, `test-cloudinary`, `test-pdf-access`: QA utilities for debugging storage and PDF access.

Each route typically imports `NextResponse` and interacts with Firebase or third-party APIs using the credentials configured via environment variables.

```javascript
// app/api/notarize/route.js (excerpt)
import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PDFDocument, rgb } from 'pdf-lib';

async function addFooterToPDF(pdfUrl, footerText) {
  const response = await fetch(pdfUrl, { method: 'GET', headers: { Accept: 'application/pdf,*/*' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from Cloudinary: ${response.status} ${response.statusText}`);
  }
  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    page.drawText(footerText, { x: 30, y: 30, size: 8, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Page ${index + 1} of ${pages.length}`, { x: width - 80, y: 15, size: 8, color: rgb(0.3, 0.3, 0.3) });
  });

  return pdfDoc.save();
}

export async function POST(request) {
  try {
    const { submissionId, notaryId, notaryName } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    const submissionRef = doc(db, 'formSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();
    const originalDocUrl = submission.step3?.documentUrl || submission.documentUrl;
    const referenceNumber = generateReferenceNumber();
    const notaryNameForFooter = notaryName || 'Authorized Notary';

    let approvedDocURL = null;
    if (originalDocUrl && originalDocUrl.toLowerCase().includes('.pdf')) {
      const footerText = `This document has been executed by ${userName} for use in the ${jurisdiction} and duly notarized by ${notaryNameForFooter} on ${formattedDate}, under reference number ${referenceNumber}`;
      const modifiedPdfBytes = await addFooterToPDF(originalDocUrl, footerText);
      approvedDocURL = await uploadToCloudinary(modifiedPdfBytes);
    } else {
      approvedDocURL = originalDocUrl;
    }

    await updateDoc(submissionRef, {
      status: 'approved',
      referenceNumber,
      approvedAt: new Date().toISOString(),
      approvedBy: { id: notaryId || 'system', name: notaryName || 'System' },
      approvedDocURL,
    });

    return NextResponse.json({ success: true, referenceNumber, approvedDocURL, message: 'Document notarized successfully' });
  } catch (error) {
    console.error('Error in notarize API route:', error);
    return NextResponse.json({ success: false, error: 'Failed to notarize document', details: error.message }, { status: 500 });
  }
}
```

## 8. Hooks, Stores, and Utilities

### Hooks (`hooks/`)
- `useMultistepForm` / `useMultistepForm2`: Manage client form navigation and validation state.
- `useDocumentForm`, `useCollaborativeForm`: Fetch and sync document configurations and data.
- `useLocalStorage`: Generic hook for persisted state sync.
- `useEmailSignIn`, `useMobileNumberSignIn`, `useEmailForgotPassword`: Auth convenience hooks.
- `useViewPort`: Responsive logic for layout adjustments.

### Zustand Store (`store/authStore.js`)
- Optional store mostly for phone-based auth flows (`signInWithPhone`, `signOut`).
- Maintains `session`, `user`, `loading`, and stores `confirmationResult` during phone OTP flows.

### Utilities (`utils/`, `utility/`)
- Storage helpers for multi-step forms (`utils/formStorage.js`).
- Document form persistence to Firestore/Cloudinary.
- Click outside detection (`utility/useClickOutside.js`), slider props, etc.

## 9. Scripts & Maintenance

### Backfill User Fields (`scripts/backfill-user-fields.js`)
- Run with `node scripts/backfill-user-fields.js` after setting `GOOGLE_APPLICATION_CREDENTIALS`.
- Populates missing fields (`role`, `status`, reviewer metadata, nullable timestamps, termsAgreed`) based on legacy data.
- Uses Firebase Admin SDK to iterate all documents in `users` collection.

```javascript
// scripts/backfill-user-fields.js (excerpt)
/* eslint-disable no-console */
const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccountCredential() {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!explicitPath) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of your Firebase service account key JSON file.');
  }
  return require(path.resolve(explicitPath));
}

const serviceAccount = loadServiceAccountCredential();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const roleFromSignUpAs = (value) => {
  if (!value) return 'user';
  switch (value.toLowerCase()) {
    case 'notary':
      return 'notary';
    case 'attorney':
      return 'attorney';
    case 'business':
      return 'business';
    case 'real estate agent':
    case 'real_estate_agent':
      return 'real_estate_agent';
    case 'admin':
      return 'admin';
    default:
      return value.toLowerCase();
  }
};

const determineInitialStatus = (doc) => {
  if (doc.status) return doc.status;
  const signUpAs = (doc.signUpAs || '').toLowerCase();
  if (signUpAs === 'notary' || signUpAs === 'attorney') {
    return 'pending_review';
  }
  return 'active';
};

async function backfillUsers() {
  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('No user documents found.');
    return;
  }

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const updates = {};

    if (!data.role) {
      updates.role = roleFromSignUpAs(data.signUpAs);
    }
    if (!data.status) {
      updates.status = determineInitialStatus(data);
    }
    if (typeof data.reviewerId === 'undefined') {
      updates.reviewerId = null;
    }
    if (typeof data.reviewNotes === 'undefined') {
      updates.reviewNotes = '';
    }
    if (typeof data.termsAgreed === 'undefined') {
      updates.termsAgreed = false;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`Updated ${doc.id}:`, updates);
    }
  }

  console.log('Backfill complete.');
}

backfillUsers().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
```

### Fix Cloudinary URLs (`scripts/fix-old-cloudinary-urls.js`)
- Repairs outdated Cloudinary references when folder structures or access modes change.

## 10. Internationalization

- Locale-aware routes use patterns like `/app/[locale]/form-step3/page.jsx`.
- Translation files live in `locales/en.json` and `locales/es.json`.
- Components use `useTranslations()` to fetch strings with fallback messages to avoid `MISSING_MESSAGE` errors.
- Navigation labels and global menus reference `i18n/navigation.js`.

## 11. Styling & Assets

- `app/globals.css` contains base styles; Bootstrap and Tailwind utilities can be combined as needed.
- Admin panel uses Bootstrap grid/components with custom gradient backgrounds.
- `public/assets` contains logos (`logo-white.png`, etc.), icons, and imagery for marketing and UI.
- `tailwind.config.js` defines design tokens if Tailwind utilities are expanded in the future.

## 12. Deployment & Environment

The root `README.md` provides a detailed deployment guide targeting a Hostinger VPS setup with PM2 and Nginx. Key steps:
1. Install Node.js 20, PM2, Nginx, Certbot.
2. Clone or upload repo to `/var/www/wiscribble`.
3. Install dependencies with `npm ci`.
4. Create `.env` with Firebase, Supabase, Zego credentials (and optional EmailJS/Stripe keys).
5. Build with `npm run build` and start via `pm2 start "npm run start" --name wiscribble`.
6. Configure Nginx reverse proxy and SSL via Certbot.

### Required Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ZEGOCLOUD_APP_ID`, `NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET`
- Optional: Stripe keys, EmailJS config (currently hardcoded), Cloudinary credentials if moving off unsigned uploads.

## 13. Extending the Platform

- **New document types**: Add entries to `config/documentTypes.js`, implement sections for the dynamic renderer, or create bespoke form components in `components/documentForms/`.
- **Admin analytics**: Extend `AdminService` to compute new metrics; update `AdminOverviewPage` with additional cards/tables. Use client-side sorting to avoid index bloat.
- **Access control**: Adjust `AdminGuard` and `SignInEmailForm` logic for new staff roles or status gating.
- **Firestore schema**: Run backfill scripts after adding new required fields; update admin tables to display these fields.
- **Localization**: Add messages in `locales/en.json` and `locales/es.json`; ensure components use translation keys with sensible defaults.
- **Styling**: Follow existing Bootstrap patterns in admin shell; prefer extending the design tokens defined in Tailwind config for consistent colors.

## 14. Testing & Debugging Tips

- Use browser console logs added in forms and sign-in flows for immediate feedback on missing fields or redirect behavior.
- Check Firebase Firestore indexes if encountering `failed-precondition` errors; however, most admin queries are now client-sorted to minimize index needs.
- Admin pages log fetch errors to the console; use browser DevTools to inspect network responses when tables appear empty.
- Consider adding Jest/Playwright tests for critical flows (not included yet) to automate regression checks.

## 15. Quick Reference

- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Run backfill script: `node scripts/backfill-user-fields.js` (with service account env set)
- Admin panel entry: `/<locale>/admin` (guarded)
- User dashboard: `/<locale>/dashboard`
- Form steps: `/form-step1` → `/form-step5` under locale

---

This document captures the current architecture, key modules, and operational considerations for WiScribble. Review and extend sections as new features ship to keep the documentation aligned with the evolving codebase.


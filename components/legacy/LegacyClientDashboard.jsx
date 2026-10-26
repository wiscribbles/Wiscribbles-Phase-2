"use client";
import { useEffect, useState } from 'react';
import { Row, Col, Nav, Card } from 'react-bootstrap';
import { auth, getUserData } from '@/firebase';
import { FiUser, FiFileText, FiSettings, FiLogOut, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { LuLayoutDashboard } from "react-icons/lu";
import NotificationBell from '@/components/NotificationBell';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES, path } from '@/lib/routes';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/**
 * The Phase 1 client dashboard, moved here from `app/[locale]/dashboard/page.jsx`.
 *
 * It is kept because it is what a CLIENT account sees and it works. It is not
 * what a partner or the Website Manager should see — and until this move, it
 * was: everyone landed here after sign-in and nothing routed to the Phase 2
 * dashboards at all. `app/[locale]/dashboard/page.jsx` is now a server-side
 * dispatcher that sends each role to its own surface and renders this one for
 * clients.
 *
 * It still reads `signUpAs` and queries `formSubmissions` directly, both of
 * which Phase 2 has replaced. That is deliberate for now: rewriting it is
 * Stage 6's client-side work, and leaving it honest about being legacy is
 * better than half-migrating it.
 */
export default function LegacyClientDashboard() {
  const [userData, setUserData] = useState(null);
  const signOut = useAuthStore((state) => state.signOut);
  const router = useRouter();
  const params = useParams();

  /* Every link here used to be locale-less — `/dashboard/profile` in an app
     whose every route is `/[locale]/…`. That is the bug `lib/routes.js` was
     written to end, and this file reintroduced it in six places. */
  const locale = params?.locale ?? 'en';
  const to = (route) => path(locale, route);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const { success, data } = await getUserData(user.uid);
        if (success) setUserData(data);
      }
    };
    fetchUserData();
  }, []);

  /* REMOVED: a `formSubmissions` query that fired when `signUpAs` was
     'notary'.

     Two things were wrong with it. `firestore.rules` denies client reads of
     that collection, so it failed with a permission error on the default
     post-sign-in screen. And it could not have been useful anyway: since
     `app/[locale]/dashboard/page.jsx` became a dispatcher, a partner account
     never reaches this component — it is routed to the partner dashboard,
     where the live request queue actually is. The notary-only navigation and
     the pending-meeting banner went with it for the same reason. */

  const memberSince = userData?.createdAt ? new Date(userData.createdAt) : null;

  return (
    <div 
      className="dashboard-container"
      data-dashboard="true"
      style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        backgroundColor: '#1c2434', 
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0
      }}>
      {/* Sidebar */}
      <div
        className="text-white d-flex flex-column"
        style={{
          backgroundColor: '#1C2434',
          width: '240px',
          minWidth: '240px',
          height: '100vh',
          position: 'relative',
          zIndex: 2,
          padding: 0,
          margin: 0,
          flexShrink: 0
        }}
      >
        <div className="p-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="text-center mb-4">
            <img
              src="/assets/images/logos/logo-white.png"
              alt="WiScribbles Logo"
              style={{ maxWidth: '100px', height: 'auto' }}
            />
          </div>
          <Nav className="flex-column" style={{ flex: 1 }}>
            <Nav.Link href={to(ROUTES.DASHBOARD)} className="text-white mb-2 d-flex align-items-center">
              <LuLayoutDashboard className="me-2" style={{ fontSize: '20px' }} /> Dashboard
            </Nav.Link>
            {/* The thing a client actually comes here to do, which the
                sidebar never offered. */}
            <Nav.Link href={to(ROUTES.NOTARIZE_NOW)} className="text-white mb-2 d-flex align-items-center">
              <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Have a document notarised
            </Nav.Link>
            <Nav.Link href={to(ROUTES.AUTHENTICATE)} className="text-white mb-2 d-flex align-items-center">
              <FiCheckCircle className="me-2" style={{ fontSize: '20px' }} /> Verify a document
            </Nav.Link>
            <Nav.Link href={to(ROUTES.PROFILE)} className="text-white mb-2 d-flex align-items-center ">
              <FiUser className="me-2" style={{ fontSize: '20px' }} /> Profile
            </Nav.Link>
            <Nav.Link href={to(ROUTES.CALENDAR)} className="text-white mb-2 d-flex align-items-center">
              <FiCalendar className="me-2" style={{ fontSize: '20px' }} /> Calendar
            </Nav.Link>
            <Nav.Link href={to(ROUTES.SETTINGS)} className="text-white mb-2 d-flex align-items-center">
              <FiSettings className="me-2" style={{ fontSize: '20px' }} /> Settings
            </Nav.Link>
          </Nav>
        </div>
        {/* Logout button OUTSIDE the .p-4, flush with the bottom */}
        <Nav.Link
          as="button"
          className="text-white mb-2 d-flex align-items-center"
          style={{
            background: 'none',
            border: 'none',
            textAlign: 'left',
            marginBottom: 0,
            width: '100%',
            padding: '20px 32px', // match .p-4 horizontal padding
            position: 'relative',
            zIndex: 3,
          }}
          onClick={async () => {
            await signOut();
            /* `/signIn` was locale-less and is also not the Phase 2 sign-in
               route. `ROUTES.SIGN_IN` is the one the guards redirect to. */
            router.push(to(ROUTES.SIGN_IN));
          }}
        >
          <FiLogOut className="me-2" style={{ fontSize: '20px' }} /> Logout
        </Nav.Link>
      </div>
      {/* Main Content */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
          height: '100vh',
          padding: '32px',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: 'calc(100vw - 240px)',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'Jost, sans-serif' }}>
              Welcome back{userData?.name ? `, ${userData.name}` : ''}
            </h2>
            <p className="text-muted">Here&apos;s your dashboard overview</p>
          </div>
          <NotificationBell pendingMeetings={[]} />
        </div>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
              <Card.Body>
                <Card.Title className="d-flex align-items-center mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  <FiUser className="me-2 text-primary" />
                  Profile Status
                </Card.Title>
                <Card.Text as="div">
                  <strong>Type:</strong> {userData?.signUpAs ?? '—'}<br />
                  <strong>Email:</strong> {userData?.email ?? '—'}<br />
                  <strong>Phone:</strong> {userData?.phone ?? '—'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
              <Card.Body>
                <Card.Title className="d-flex align-items-center mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  <FiSettings className="me-2 text-warning" />
                  Account Status
                </Card.Title>
                <Card.Text as="div">
                  <strong>Member Since:</strong><br />
                  {/* `new Date(undefined)` renders the string "Invalid Date"
                      to the user while the profile is still loading. */}
                  {memberSince && !Number.isNaN(memberSince.getTime())
                    ? memberSince.toLocaleDateString()
                    : '—'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="d-flex align-items-center mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  <FiFileText className="me-2 text-success" />
                  Your documents
                </Card.Title>
                <Card.Text as="div" className="text-muted flex-grow-1">
                  Start a notarisation, or check a reference on a document
                  somebody has given you.
                </Card.Text>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  <a className="btn btn-sm btn-primary" href={to(ROUTES.NOTARIZE_NOW)}>
                    Get started
                  </a>
                  <a className="btn btn-sm btn-outline-secondary" href={to(ROUTES.AUTHENTICATE)}>
                    Verify
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
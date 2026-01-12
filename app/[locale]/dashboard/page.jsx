"use client";
import { useEffect, useState } from 'react';
import { Container, Row, Col, Nav, Card } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { auth, getUserData } from '@/firebase';
import { FiHome, FiUser, FiFileText, FiSettings, FiLogOut, FiBell, FiCalendar } from 'react-icons/fi';
import { LuLayoutDashboard } from "react-icons/lu";
import { Poppins } from 'next/font/google';
import NotificationBell from '@/components/NotificationBell';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const t = useTranslations('dashboard');
  const signOut = useAuthStore((state) => state.signOut);
  const router = useRouter();
 

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const { success, data } = await getUserData(user.uid);
        if (success) {
          console.log('User Data:', data);
          setUserData(data);
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    // Only fetch if user is notary
    if (userData?.signUpAs?.toLowerCase() === 'notary') {
      const fetchPendingMeetings = async () => {
        const q = query(
          collection(db, 'formSubmissions'),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const meetings = querySnapshot.docs.map(doc => doc.data());
        setPendingMeetings(meetings);
      };
      fetchPendingMeetings();
    }
  }, [userData?.signUpAs]);

  // Function to check if user is a notary - case insensitive comparison
  const isNotary = userData?.signUpAs?.toLowerCase() === 'notary';
  console.log('Is Notary:', isNotary);
  console.log('SignUpAs Value:', userData?.signUpAs);

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
            <Nav.Link href="/dashboard" className="text-white mb-2 d-flex align-items-center">
              <LuLayoutDashboard className="me-2" style={{ fontSize: '20px' }} /> Dashboard
            </Nav.Link>
            <Nav.Link href="/dashboard/profile" className="text-white mb-2 d-flex align-items-center ">
              <FiUser className="me-2" style={{ fontSize: '20px' }} /> Profile
            </Nav.Link>
            {isNotary && (
              <Nav.Link href="/dashboard/document" className="text-white mb-2 d-flex align-items-center">
                <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Documents
              </Nav.Link>
            )}
            {isNotary && (
              <Nav.Link href="/dashboard/member" className="text-white mb-2 d-flex align-items-center">
                <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Members
              </Nav.Link>
            )}
            <Nav.Link href="/dashboard/calender" className="text-white mb-2 d-flex align-items-center">
              <FiCalendar className="me-2" style={{ fontSize: '20px' }} /> Calender
            </Nav.Link>
            <Nav.Link href="/dashboard/settings" className="text-white mb-2 d-flex align-items-center">
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
            router.push('/signIn');
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
            <h2 style={{ fontFamily: 'Poppins, sans-serif' }}>Welcome back, {userData?.name}</h2>
            <p className="text-muted">Here's your dashboard overview</p>
          </div>
          <NotificationBell pendingMeetings={pendingMeetings} />
        </div>
        {isNotary && pendingMeetings.length > 0 && (
          <div style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: '8px',
            padding: '16px 24px',
            marginBottom: '24px',
            color: '#ad8b00',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <FiBell style={{ fontSize: 24 }} />
            <span>
              You have {pendingMeetings.length} new meeting request{pendingMeetings.length > 1 ? 's' : ''} from member{pendingMeetings.length > 1 ? 's' : ''}.
              <a href="/dashboard/member" style={{ marginLeft: 12, color: '#ad8b00', textDecoration: 'underline' }}>View Members</a>
            </span>
          </div>
        )}
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
              <Card.Body>
                <Card.Title className="d-flex align-items-center mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  <FiUser className="me-2 text-primary" />
                  Profile Status
                </Card.Title>
                <Card.Text>
                  <strong>Type:</strong> {userData?.signUpAs}<br />
                  <strong>Email:</strong> {userData?.email}<br />
                  <strong>Phone:</strong> {userData?.phone}
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
                <Card.Text>
                  <strong>Member Since:</strong><br />
                  {new Date(userData?.createdAt).toLocaleDateString()}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bell, Lock, CreditCard, User, Shield, Eye, EyeOff, Check } from "lucide-react"
import { Poppins } from 'next/font/google'
import { Nav } from 'react-bootstrap';
import { LuLayoutDashboard } from "react-icons/lu";
import { FiUser, FiFileText, FiCalendar, FiSettings, FiLogOut } from "react-icons/fi";
import NotificationBell from '@/components/NotificationBell';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

const styles = {
  container: {
    padding: "24px",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    fontFamily: poppins.style.fontFamily,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    padding: "4px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
    fontFamily: poppins.style.fontFamily,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
    marginTop:"20px"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "20px 20px 0 20px",
    borderBottom: "1px solid #f3f4f6",
    marginBottom: "20px",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 16px 0",
    fontFamily: poppins.style.fontFamily,
  },
  cardBody: {
    padding: "0 20px 20px 20px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  inputFocus: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px",
  },
  switchContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  switchLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  switchDescription: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },
  switch: {
    position: "relative",
    width: "44px",
    height: "24px",
    backgroundColor: "#d1d5db",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  switchActive: {
    backgroundColor: "#3b82f6",
  },
  switchThumb: {
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "20px",
    height: "20px",
    backgroundColor: "white",
    borderRadius: "50%",
    transition: "transform 0.2s",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  switchThumbActive: {
    transform: "translateX(20px)",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  outlineButton: {
    backgroundColor: "transparent",
    border: "1px solid #d1d5db",
    color: "#374151",
  },
  successButton: {
    backgroundColor: "#10b981",
    color: "white",
  },
  paymentMethod: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginBottom: "16px",
  },
  paymentIcon: {
    width: "40px",
    height: "40px",
    backgroundColor: "#3b82f6",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 4px 0",
    fontFamily: poppins.style.fontFamily,
  },
  profileEmail: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
}

export default function SettingsPage() {
  const [isNotary, setIsNotary] = useState(true);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [saveStatus, setSaveStatus] = useState({
    notifications: false,
    password: false,
  })

  const signOut = useAuthStore((state) => state.signOut);
  const router = useRouter();

  useEffect(() => {
    // Fetch pending meetings for notification bell
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
  }, []);

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswords((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSaveNotifications = () => {
    setSaveStatus((prev) => ({ ...prev, notifications: true }))
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, notifications: false }))
    }, 2000)
  }

  const handleUpdatePassword = () => {
    setSaveStatus((prev) => ({ ...prev, password: true }))
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, password: false }))
      setPasswords({ current: "", new: "", confirm: "" })
    }, 2000)
  }

  const Switch = ({ checked, onChange }) => (
    <div
      style={{
        ...styles.switch,
        ...(checked ? styles.switchActive : {}),
      }}
      onClick={onChange}
    >
      <div
        style={{
          ...styles.switchThumb,
          ...(checked ? styles.switchThumbActive : {}),
        }}
      />
    </div>
  )

  return (
    <div className={poppins.className}>
      <div className="d-none d-md-block position-fixed top-0 start-0" style={{ minWidth: 220, height: '100vh', backgroundColor: "#1C2434", color: "#fff", left: 0, zIndex: 1040 }}>
        <div className="p-4">
          <div className="text-center mb-4">
            <img
              src="/assets/images/logos/logo-white.png"
              alt="WiScribbles Logo"
              style={{ maxWidth: "100px", height: "auto" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
            <Nav className="flex-column">
              <Nav.Link href="/dashboard" className="text-white mb-3 d-flex align-items-center">
                <LuLayoutDashboard className="me-2" style={{ fontSize: '20px' }} /> Dashboard
              </Nav.Link>
              <Nav.Link href="/dashboard/profile" className="text-white mb-3 d-flex align-items-center ">
                <FiUser className="me-2" style={{ fontSize: '20px' }} /> Profile
              </Nav.Link>
              {isNotary && (
                <Nav.Link href="/dashboard/document" className="text-white mb-3 d-flex align-items-center">
                  <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Documents
                </Nav.Link>
              )}
              {isNotary && (
                <Nav.Link href="/dashboard/member" className="text-white mb-2 d-flex align-items-center">
                  <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Members
                </Nav.Link>
              )}
              <Nav.Link href="/dashboard/calender" className="text-white mb-3 d-flex align-items-center">
                <FiCalendar className="me-2" style={{ fontSize: '20px' }} /> Calender
              </Nav.Link>
              <Nav.Link href="/dashboard/settings" className="text-white mb-3 d-flex align-items-center">
                <FiSettings className="me-2" style={{ fontSize: '20px' }} /> Settings
              </Nav.Link>
            </Nav>
            <div style={{ flexGrow: 1 }} />
            <Nav.Link
              as="button"
              className="text-white mb-2 d-flex align-items-center"
              style={{ background: 'none', border: 'none', textAlign: 'left' }}
              onClick={async () => {
                await signOut();
                router.push('/signIn');
              }}
            >
              <FiLogOut className="me-2" style={{ fontSize: '20px' }} /> Logout
            </Nav.Link>
          </div>
        </div>
      </div>
      <div style={{...styles.container, marginLeft: "220px", backgroundColor: "#ffffff"}}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1 style={styles.title}>Account Settings</h1>
            </div>
          </div>
          <NotificationBell pendingMeetings={pendingMeetings} />
        </div>

        <div style={styles.grid}>
          {/* Profile Settings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <User size={20} />
                Profile Information
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.profileSection}>
                <div style={styles.avatar}>AD</div>
                <div style={styles.profileInfo}>
                  <h3 style={styles.profileName}>Admin User</h3>
                  <p style={styles.profileEmail}>admin@company.com</p>
                </div>
                <button style={{ ...styles.button, ...styles.outlineButton }}>Edit Profile</button>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} type="text" defaultValue="Admin User" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input style={styles.input} type="email" defaultValue="admin@company.com" />
              </div>
              <button style={{ ...styles.button, ...styles.primaryButton }}>Update Profile</button>
            </div>
          </div>

          {/* Security Settings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Lock size={20} />
                Security Settings
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <div style={styles.passwordContainer}>
                  <input
                    style={styles.input}
                    type={showPasswords.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => handlePasswordChange("current", e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button style={styles.passwordToggle} onClick={() => togglePasswordVisibility("current")}>
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordContainer}>
                  <input
                    style={styles.input}
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => handlePasswordChange("new", e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button style={styles.passwordToggle} onClick={() => togglePasswordVisibility("new")}>
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <div style={styles.passwordContainer}>
                  <input
                    style={styles.input}
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => handlePasswordChange("confirm", e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button style={styles.passwordToggle} onClick={() => togglePasswordVisibility("confirm")}>
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(saveStatus.password ? styles.successButton : styles.primaryButton),
                }}
                onClick={handleUpdatePassword}
              >
                {saveStatus.password ? (
                  <>
                    <Check size={16} />
                    Password Updated!
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Bell size={20} />
                Notification Preferences
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.switchContainer}>
                <div>
                  <div style={styles.switchLabel}>Email Notifications</div>
                  <div style={styles.switchDescription}>Receive notifications via email</div>
                </div>
                <Switch checked={notifications.email} onChange={() => handleNotificationChange("email")} />
              </div>
              <div style={styles.switchContainer}>
                <div>
                  <div style={styles.switchLabel}>Push Notifications</div>
                  <div style={styles.switchDescription}>Receive push notifications in browser</div>
                </div>
                <Switch checked={notifications.push} onChange={() => handleNotificationChange("push")} />
              </div>
              <div style={styles.switchContainer}>
                <div>
                  <div style={styles.switchLabel}>SMS Notifications</div>
                  <div style={styles.switchDescription}>Receive important alerts via SMS</div>
                </div>
                <Switch checked={notifications.sms} onChange={() => handleNotificationChange("sms")} />
              </div>
              <div style={{ ...styles.switchContainer, borderBottom: "none" }}>
                <div>
                  <div style={styles.switchLabel}>Marketing Communications</div>
                  <div style={styles.switchDescription}>Receive updates about new features</div>
                </div>
                <Switch checked={notifications.marketing} onChange={() => handleNotificationChange("marketing")} />
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(saveStatus.notifications ? styles.successButton : styles.primaryButton),
                  marginTop: "16px",
                }}
                onClick={handleSaveNotifications}
              >
                {saveStatus.notifications ? (
                  <>
                    <Check size={16} />
                    Preferences Saved!
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          </div>

          

          {/* Security Features */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Shield size={20} />
                Advanced Security
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.switchContainer}>
                <div>
                  <div style={styles.switchLabel}>Two-Factor Authentication</div>
                  <div style={styles.switchDescription}>Add an extra layer of security</div>
                </div>
                <Switch checked={true} onChange={() => {}} />
              </div>
              <div style={{ ...styles.switchContainer, borderBottom: "none" }}>
                <div>
                  <div style={styles.switchLabel}>Login Alerts</div>
                  <div style={styles.switchDescription}>Get notified of new login attempts</div>
                </div>
                <Switch checked={false} onChange={() => {}} />
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                <button style={{ ...styles.button, ...styles.outlineButton }}>View Login History</button>
                <button style={{ ...styles.button, ...styles.outlineButton }}>Manage Sessions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client";
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardLayout({ children }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is not authenticated, redirect to sign-in page
        router.replace("/auth/signin");
      } else {
        // User is authenticated, allow access
        setAuthenticated(true);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: "100vh", width:"100%" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  // Only render the dashboard when authenticated
  return authenticated ? (
    <Container fluid>
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
    </Container>
  ) : null;
}
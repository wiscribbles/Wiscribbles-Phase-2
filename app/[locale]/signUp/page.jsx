"use client";
import { Row, Col, Container } from "react-bootstrap";
import "react-phone-input-2/lib/bootstrap.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import SignUpForm from "@/components/SignUpForm2";

const SignUp = () => {
  const st = useTranslations("sign-up");
  const t = useTranslations();

  return (
    <>
      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .signup-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .signup-main {
          flex: 1;
          margin-top: 100px;
          display: flex;
          flex-direction: column;
        }
        
        .signup-image-container {
          display: none;
          align-items: center;
          justify-content: center;
          background: transparent;
          padding: 0;
          overflow: hidden;
        }
        
        .signup-form-container {
          width: 100%;
          padding: 2rem;
          background-color: white;
          overflow-y: auto;
          max-height: calc(100vh - 100px);
        }
        
        .signup-form-content {
          max-width: 500px;
          margin: 0 auto;
          padding-top: 1rem;
        }
        
        .signup-title {
          font-family: "Jost", sans-serif;
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .signup-subtitle {
          color: #666;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        
        .signup-link {
          color: #0C1134;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .signup-link:hover {
          color: #0C1134;
          text-decoration: none;
        }
        
        /* Tablet styles */
        @media (min-width: 768px) {
          .signup-main {
            flex-direction: row;
          }
          
          .signup-image-container {
            display: flex;
            width: 50%;
            height: calc(100vh - 100px);
            position: fixed;
            left: 0;
          }
          
          .signup-form-container {
            width: 50%;
            margin-left: 50%;
            padding: 3rem;
            max-height: calc(100vh - 100px);
          }
          
          .signup-title {
            font-size: 2.5rem;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 1024px) {
          .signup-form-container {
            padding: 4rem;
          }
          
          .signup-title {
            font-size: 3rem;
          }
          
          .signup-subtitle {
            font-size: 1.1rem;
          }
        }
        
        /* Large desktop styles */
        @media (min-width: 1200px) {
          .signup-form-content {
            max-width: 600px;
          }
        }
        
        /* Mobile specific adjustments */
        @media (max-width: 767px) {
          .signup-header {
            padding: 0.75rem 1rem;
          }
          
          .signup-main {
            margin-top: 90px;
          }
          
          .signup-form-container {
            padding: 1.5rem;
            max-height: calc(100vh - 90px);
          }
          
          .signup-title {
            font-size: 1.75rem;
            text-align: center;
          }
          
          .signup-subtitle {
            text-align: center;
            font-size: 0.95rem;
          }
        }
        
        /* Extra small mobile */
        @media (max-width: 480px) {
          .signup-header {
            padding: 0.5rem;
          }
          
          .signup-main {
            margin-top: 80px;
          }
          
          .signup-form-container {
            padding: 1rem;
            max-height: calc(100vh - 80px);
          }
          
          .signup-title {
            font-size: 1.5rem;
          }
          
          .signup-subtitle {
            font-size: 0.9rem;
          }
        }
      `}</style>
      
      <div className="signup-container">
        {/* Responsive Header */}
        <header className="signup-header">
          <Link href="/">
            <img
              src="/assets/images/logos/logo.png"
              alt={t("logo_alt")}
              title={t("logo_alt")}
              style={{ 
                maxWidth: "100px",
                height: "auto"
              }}
            />
          </Link>
        </header>

        {/* Main Content */}
        <div className="signup-main">
          {/* Left Container - Image (Hidden on mobile) */}
          <div className="signup-image-container">
            <img
              src="/assets/images/background/signup.png"
              alt="Signup Illustration"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center"
              }}
            />
          </div>

          {/* Right Container - Form */}
          <div className="signup-form-container">
            <div className="signup-form-content">
              <h2 className="signup-title">{st("title")}</h2>
              <p className="signup-subtitle">{st("subtitle")}</p>
              <SignUpForm />
              <Row className="mt-3 mb-3 w-100">
                <Col>
                  <p style={{ textAlign: "center" }}>
                    {st("already_have_account")}{" "}
                    <Link href={"/signIn"} className="text-black-50 ms-1">
                      <span className="signup-link">
                        {st("sign_in")}
                      </span>
                    </Link>
                  </p>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;

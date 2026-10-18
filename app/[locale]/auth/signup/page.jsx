"use client";
import { Row, Col, Container } from "react-bootstrap";
import "react-phone-input-2/lib/bootstrap.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import SignUpForm from "@/components/auth/SignUpForm";

const SignUp = () => {
  const st = useTranslations("sign-up");
  const t = useTranslations();

  return (
    <Container fluid className="d-flex align-items-center justify-content-center p-0 position-relative">
      <Link href="/" className="position-absolute top-0 start-0 mt-4 ms-4 z-index-1">
        <img
          src="/assets/images/logos/logo-white.png"
          alt={t("logo_alt")}
          title={t("logo_alt")}
          style={{ maxWidth: "100px" }}
        />
      </Link>

      <Row className="w-100 flex-row-reverse">
        <Col
          md={6}
          className="d-flex mx-auto justify-content-center align-items-center"
          style={{ minHeight: "100vh" }}
        >
          <div className="signin-form-container">
            <h2 style={{ fontFamily: "Jost" }}>{st("title")}</h2>
            <p>{st("subtitle")}</p>
            <SignUpForm />
            <Row className="mt-3 mb-3 w-100">
              <Col>
                <p style={{textAlign:"left"}}>
                  {st("already_have_account")}{" "}
                  <Link href={"/auth/signin"} className="text-black-50 ms-1">
                    <span
                      style={{
                        color: "#0C1134",
                        textDecoration: "underline",
                        textAlign:"left"
                      }}
                    >
                      {st("sign_in")}
                    </span>
                  </Link>
                </p>
              </Col>
            </Row>
          </div>
        </Col>

        <Col md={6} className="d-flex vh-100 justify-content-center align-items-center ">
          <img
            src="/assets/images/background/signup.png"
            alt="Signup Illustration"
            className="img-fluid rounded sticky top-0"
            style={{
              maxHeight: "950px",
              maxWidth: "1000px",
              marginTop: "100px"
            }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default SignUp;

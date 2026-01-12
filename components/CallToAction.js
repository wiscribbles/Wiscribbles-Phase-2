import { useTranslations } from "next-intl";
import Link from "next/link";
useTranslations
const CallToAction = () => {
  const t = useTranslations();
  return (
    <section
      // style={{ backgroundColor: "#081A34" }}
      className="call-to-action-area bgc-black-with-lighting-half pt-80 pb-50"
    >
      <div className="container">
        <div className="row justify-content-between align-items-center">
          <div className="col-xl-7 col-lg-9">
            <div className="section-title text-white mb-25 wow fadeInUp delay-0-2s">
              <h2>Let's start the Notarization Process</h2>
              <p>
                With millions of documents notarized, our platform is a trusted
                choice for individuals and businesses worldwide.
              </p>
            </div>
          </div>
          <div className="col-lg-3 text-lg-end">
            <Link legacyBehavior href="/contact">
              <a className="theme-btn style-two mb-30 wow fadeInUp delay-0-4s">
                Let’s Get Started <i className="fas fa-angle-double-right" />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
export default CallToAction;

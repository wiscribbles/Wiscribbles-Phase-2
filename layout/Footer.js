import { useTranslations } from "next-intl";
import Link from "next/link";

const Footer = ({ footer }) => {
  switch (footer) {
    case 3:
      return null; //No footer
    case 1:
      return <Footer1 />;
    case 2:
      return <Footer2 />;

    default:
      return <DefaultFooter />;
  }
};
export default Footer;

const Footer1 = () => {
  const t = useTranslations();

  return (
    // Add home-one class to all footers
    <footer className="main-footer footer-two pt-80 bgc-lighter home-one">
      <div className="container">
        <div className="row justify-content-xl-between justify-content-center">
          <div className="col-xl-4 col-lg-5 col-md-6">
            <div className="footer-widget widget_about me-md-5 wow fadeInUp delay-0-2s">
              <div className="footer-logo mb-25">
                <Link legacyBehavior href="/">
                  <a>
                    <img src="/assets/images/logos/logo.png" alt="Logo" />
                  </a>
                </Link>
              </div>
              <p style={{ textAlign: "justify" }}>{t("footer1AboutText")}</p>
              <div className="social-style-two pt-5">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin-in" />
                </a>
                <a href="https://behance.net" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-behance" />
                </a>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-md-6">
            <div className="footer-widget widget_nav_menu wow fadeInUp delay-0-4s">
              <h4 className="footer-title">{t("footer1QuickLinks")}</h4>
              <ul
                className="list-style-two"
                style={{ flexDirection: "column" }}
              >
                <li>
                  <Link legacyBehavior href="/">
                    <a>{t("footer1LinkHome")}</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/solutions">
                    <a>{t("footer1LinkServices")}</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/contact">
                    <a>{t("footer1LinkContact")}</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/help-desk">
                    <a>{t("footer1LinkTechnicalSupport")}</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/about">
                    <a>{t("footer1LinkAboutCompany")}</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-xl-4 col-lg-6 col-md-8">
            <div className="footer-widget widget_newsletter wow fadeInUp delay-0-6s">
              <h4 className="footer-title">{t("footer1NewsletterTitle")}</h4>
              <p>{t("footer1NewsletterText")}</p>
              <form onSubmit={(e) => e.preventDefault()} action="#">
                <input
                  type="email"
                  placeholder={t("footer1SubscribePlaceholder")}
                  required=""
                />
                <button className="theme-btn">
                  {t("footer1SubscribeButton")}{" "}
                  <i className="fas fa-angle-double-right" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom mt-30 pt-25 pb-10">
        <div className="container">
          <div className="copyright-text text-center">
            <p>{t("footer1Copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Footer2 = () => (
  <footer className="main-footer bgc-dark-blue text-white rel z-1">
    <div className="container">
      <div
        className="footer-top-newsletter bgc-primary p-80"
        style={{
          backgroundImage: "url(/assets/images/footer/newsletter-bg.png)",
        }}
      >
        <div className="row justify-content-between align-items-center">
          <div className="col-xl-6 col-lg-7">
            <div className="footer-newsletter-content rmb-55 wow fadeInLeft delay-0-2s">
              <div className="section-title mb-30">
                <span className="sub-title mb-15">Our Newsletter</span>
                <h2>Subscribe Our Newsletter to Get More Updates</h2>
                <p>
                  Consectetur adipiscing eiusmod tempor incididunt labore et
                  dolores magna aliquae suspendisse ultrices gravid commodo
                  viverra
                </p>
              </div>
              <form onSubmit={(e) => e.preventDefault()} action="#">
                <div className="form-group rel mb-0 w-100">
                  <label htmlFor="email">
                    <i className="far fa-envelope" />
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    required=""
                  />
                </div>
                <button className="theme-btn style-two">
                  Subscribe <i className="fas fa-angle-double-right" />
                </button>
              </form>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="footer-newsletter-image wow fadeInRight delay-0-2s">
              <img
                src="/assets/images/footer/footer-newsletter.png"
                alt="Newsletter"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row large-gap justify-content-center">
        <div className="col-xl-7 col-lg-8">
          <div className="footer-cta text-center my-100 wow fadeInUp delay-0-2s">
            <div className="section-title">
              <h2>Let’s Design Your New Website</h2>
              <p>
                Do you want to have a website that stands out and impresses your
                clients? Then we are ready to help! Click the button below to
                contact us and discuss your ideas.
              </p>
            </div>
            <Link legacyBehavior href="/contact">
              <a className="theme-btn mt-15">
                Get a Quote <i className="fas fa-angle-double-right" />
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="copyright-area text-center pt-30 pb-15">
        <ul className="footer-menu pb-10">
          <li>
            <Link legacyBehavior href="/about">
              <a>About</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/services">
              <a>Our Services</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/how-it-works">
              <a>How We Work</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/about">
              <a>Experience</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/solutions">
              <a>Why Choose Us</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/about">
              <a>Partners</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/help-desk">
              <a>Support</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/about">
              <a>Testimonials</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/pricing">
              <a>Pricing</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/help-desk">
              <a>FAQ</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/contact">
              <a>Contacts</a>
            </Link>
          </li>
        </ul>
        <p>© Copyright {new Date().getFullYear()} WiScribbles. All rights reserved</p>
      </div>
    </div>
    <div className="wave-shapes">
      <img
        className="shape one"
        src="/assets/images/shapes/footer1.png"
        alt="Wave Shape"
      />
      <img
        className="shape two"
        src="/assets/images/shapes/footer2.png"
        alt="Wave Shape"
      />
    </div>
  </footer>
);

const DefaultFooter = () => (
  <footer className="main-footer  pt-80">
    <div className="container">
      <div className="row justify-content-xl-between justify-content-center">
        <div className="col-xl-4 col-lg-5 col-md-6">
          <div className="footer-widget widget_about me-md-5 wow fadeInUp delay-0-2s">
            <div className="footer-logo mb-25">
              <Link legacyBehavior href="/">
                <a>
                  <img src="/assets/images/logos/logo.png" alt="Logo" />
                </a>
              </Link>
            </div>
            <p>
              WiScribbles provides innovative notary and document management solutions. 
              Connect with us and experience seamless digital notarization services 
              designed for modern businesses and professionals.
            </p>
            <div className="social-style-two pt-5">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin-in" />
              </a>
              <a href="https://behance.net" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-behance" />
              </a>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6">
          <div className="footer-widget widget_nav_menu wow fadeInUp delay-0-4s">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="list-style-two">
              <li>
                <Link legacyBehavior href="/">
                  <a>Home</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/about">
                  <a>About Company</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/services">
                  <a>Our Services</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/solutions">
                  <a>Solutions</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/how-it-works">
                  <a>How It Works</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/team">
                  <a>Meet Our Team</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/pricing">
                  <a>Pricing</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/blog">
                  <a>Latest News</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/help-desk">
                  <a>Technical Support</a>
                </Link>
              </li>
              <li>
                <Link legacyBehavior href="/contact">
                  <a>Contact</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="col-xl-4 col-lg-6 col-md-8">
          <div className="footer-widget widget_newsletter wow fadeInUp delay-0-6s">
            <h4 className="footer-title">Newsletter</h4>
            <p>Sign up to get more every updates</p>
            <form onSubmit={(e) => e.preventDefault()} action="#">
              <input type="email" placeholder="Enter email" required="" />
              <button className="theme-btn">
                Subscribe Now <i className="fas fa-angle-double-right" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-bottom mt-30 pt-25 pb-10">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="copyright-text text-center text-lg-start">
              <p>
                © Copyright {new Date().getFullYear()} WiScribbles. All rights
                reserved
              </p>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="footer-bottom-menu mb-10 text-center text-lg-end">
              <ul>
                <li>
                  <Link legacyBehavior href="/dashboard/settings">
                    <a>Settings &amp; Privacy</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/about">
                    <a>About</a>
                  </Link>
                </li>
                <li>
                  <Link legacyBehavior href="/help-desk">
                    <a>FAQs</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Scroll Top Button */}
        <button className="scroll-top scroll-to-target" data-target="html">
          <span className="fas fa-angle-double-up" />
        </button>
      </div>
    </div>
  </footer>
);

import { sideBarToggle } from "@/utility";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import LangSwitcher from "@/components/LangSwitch";
import { dashboard, notarizeNow } from "@/lib/routes";
const Header = ({ header, locale, login }) => {
  switch (header) {
    case 1:
      return <Header1 />;
    case 2:
      return <Header2 />;
    case 3:
      return <PlainHeader />;
    default:
      return <DefaultHeader locale={locale} login={login} />;
  }
};
export default Header;

const Header1 = () => {
  return (
    <header className="main-header header-two">
      {/*Header-Upper*/}
      <div className="header-upper">
        <div className="container clearfix">
          <div className="header-inner rel d-flex align-items-center">
            <div className="logo-outer">
              <div className="logo">
                <Link legacyBehavior href="/">
                  <a>
                    <img
                      src="/assets/images/logos/logo-white.png"
                      alt="Logo"
                      title="Logo"
                    />
                  </a>
                </Link>
              </div>
            </div>
            <div className="nav-outer clearfix">
              <MobileMenu logo={"/assets/images/logos/logo-white.png"} />
              {/* Main Menu */}
              <nav className="main-menu d-none d-lg-block navbar-expand-lg">
                <div className="navbar-header">
                  <div className="mobile-logo my-15">
                    <Link legacyBehavior href="/">
                      <a>
                        <img
                          src="/assets/images/logos/logo-white.png"
                          alt="Logo"
                          title="Logo"
                        />
                      </a>
                    </Link>
                  </div>
                  {/* Toggle Button */}
                  <button
                    type="button"
                    className="navbar-toggle"
                    data-bs-toggle="collapse"
                    data-bs-target=".navbar-collapse"
                  >
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                  </button>
                </div>
                <div className="navbar-collapse collapse clearfix">
                  <MenuNav />
                </div>
              </nav>
              {/* Main Menu End*/}
            </div>
            {/* Nav Search */}
            <div className="nav-search py-15">
              <button className="far fa-search" />
              <form
                onSubmit={(e) => e.preventDefault()}
                action="#"
                className="hide"
              >
                <input
                  type="text"
                  placeholder="Search"
                  className="searchbox"
                  required=""
                />
                <button type="submit" className="searchbutton far fa-search" />
              </form>
            </div>
            {/* Menu Button */}
            <div className="menu-btns">
              <Link legacyBehavior href="/contact">
                <a className="theme-btn style-three">
                  Get a Quote <i className="fas fa-angle-double-right" />
                </a>
              </Link>
              {/* menu sidbar */}
              <div className="menu-sidebar d-none d-lg-block">
                <button onClick={() => sideBarToggle()}>
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*End Header Upper*/}
    </header>
  );
};

const Header2 = () => {
  return (
    <header className="main-header">
      <div className="header-top-wrap bgc-secondary text-white py-5">
        <div className="container">
          <div className="header-top">
            <div className="row align-items-center">
              <div className="col-lg-4">
                <div className="top-left text-center text-lg-start">
                  <ul>
                    <li>
                      <a href="#">About</a>
                    </li>
                    <li>
                      <a href="#">Services</a>
                    </li>
                    <li>
                      <a href="#">Faqs</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="top-right text-center text-lg-end">
                  <ul>
                    <li>
                      <i className="far fa-envelope" />{" "}
                      <a href="mailto:support@gmail.com">support@gmail.com</a>
                    </li>
                    <li>
                      <i className="far fa-phone" />{" "}
                      <a href="callto:+000(123)45699">+000 (123) 456 99</a>
                    </li>
                    <li>
                      <select className="select" name="language" id="language">
                        <option value="English">English</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*Header-Upper*/}
      <div className="header-upper">
        <div className="container clearfix">
          <div className="header-inner rel d-flex align-items-center">
            <div className="logo-outer">
              <div className="logo">
                <Link legacyBehavior href="/">
                  <a>
                    <img
                      src="/assets/images/logos/logo.png"
                      alt="Logo"
                      title="Logo"
                      className="logo dark-logo"
                    />
                    <img
                      className="light-logo logo"
                      src="/assets/images/logos/logo-white.png"
                      alt="Logo"
                      title="Logo"
                    />
                  </a>
                </Link>
              </div>
            </div>
            <div className="nav-outer clearfix">
              <MobileMenu />
              {/* Main Menu */}
              <nav className="main-menu d-none d-lg-block navbar-expand-lg">
                <div className="navbar-header">
                  <div className="mobile-logo my-15">
                    <Link legacyBehavior href="/">
                      <a>
                        <img
                          src="/assets/images/logos/logo.png"
                          alt="Logo"
                          title="Logo"
                        />
                      </a>
                    </Link>
                  </div>
                  {/* Toggle Button */}
                  <button
                    type="button"
                    className="navbar-toggle"
                    data-bs-toggle="collapse"
                    data-bs-target=".navbar-collapse"
                  >
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                  </button>
                </div>
                <div className="navbar-collapse collapse clearfix">
                  <MenuNav />
                </div>
              </nav>
              {/* Main Menu End*/}
            </div>
            {/* Nav Search */}
            <div className="nav-search py-15">
              <button className="far fa-search" />
              <form
                onSubmit={(e) => e.preventDefault()}
                action="#"
                className="hide"
              >
                <input
                  type="text"
                  placeholder="Search"
                  className="searchbox"
                  required=""
                />
                <button type="submit" className="searchbutton far fa-search" />
              </form>
            </div>
            {/* Menu Button */}
            <div className="menu-btns">
              <Link legacyBehavior href="/contact">
                <a className="theme-btn">
                  Download Now <i className="fas fa-angle-double-right" />
                </a>
              </Link>
              {/* menu sidbar */}
              <div className="menu-sidebar d-none d-lg-block">
                <button onClick={() => sideBarToggle()}>
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*End Header Upper*/}
    </header>
  );
};

const DefaultHeader = ({ locale, login }) => {
  const t = useTranslations();
  const [padding, setPadding] = useState("0rem 4rem");
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
    
    const handleResize = () => {
      if (window.innerWidth < 1250) {
        setPadding("0rem 1rem"); // Apply different padding for smaller screens
      } else {
        setPadding("0rem 4rem"); // Default padding for larger screens
      }
    };

    // Check the size on initial load
    handleResize();

    // Set up event listener for window resize with debouncing
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener("resize", debouncedResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);
  
  // Prevent hydration mismatch by using consistent initial state
  const containerPadding = isClient ? padding : "0rem 4rem";
  return (
    <header className="main-header header-three menu-absolute">
      {/*Header-Upper*/}
      <div className="header-upper">
        <div className="container-fluid clearfix" style={{ padding: containerPadding }}>
          <div className="header-inner rel d-flex align-items-center">
            <div className="logo-outer">
              <div className="logo">
                <Link legacyBehavior href="/">
                  <a>
                    <img
                      src="/assets/images/logos/Black.png"
                      srcSet="/assets/images/logos/Black@0.5x.png 0.5x, /assets/images/logos/Black.png 1x, /assets/images/logos/Black@2x.png 2x, /assets/images/logos/Black@3x.png 3x"
                      alt="Logo"
                      title="Logo"
                      style={{ height: "60px", width: "auto", maxWidth: "120px" }}
                    />
                  </a>
                </Link>
              </div>
            </div>
            <div className="nav-outer clearfix">
              <MobileMenu />
              {/* Main Menu */}
              <nav className="main-menu d-none d-lg-block navbar-expand-lg">
                <div className="navbar-header">
                  <div className="mobile-logo my-15">
                    <Link legacyBehavior href="/">
                      <a>
                        <img
                          src="/assets/images/logos/logo.png"
                          alt="Logo"
                          title="Logo"
                        />
                      </a>
                    </Link>
                  </div>
                  {/* Toggle Button */}
                  <button
                    type="button"
                    className="navbar-toggle"
                    data-bs-toggle="collapse"
                    data-bs-target=".navbar-collapse"
                  >
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                    <span className="icon-bar" />
                  </button>
                </div>
                <div className="navbar-collapse collapse clearfix">
                  <MenuNav locale={locale} />
                </div>
              </nav>
              {/* Main Menu End*/}
            </div>
            {/* Menu Button */}
            <div className="menu-btns">
              {/* Was `/auth/signin` with no locale segment. "Notarize Now"
                  should start the request, not strand the visitor on a
                  dashboard having forgotten what they came for — /request
                  bounces them through sign-in and returns them. */}
              <Link legacyBehavior href={login ? dashboard(locale) : notarizeNow(locale)}>
                <a className="theme-btn style-three">
                  {login ? t("navbar.pill-login") : t("navbar.pill-button")}
                  <i className="fas fa-angle-double-right" />
                </a>
              </Link>
              <LangSwitcher locale={locale} type={"dark"} className="d-none d-lg-block" />
              {/* menu sidebar */}
              {/* Menu sidebar (visible only on md and up) */}
              <div className="menu-sidebar d-none d-md-block">
                <button onClick={() => sideBarToggle()}>
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*End Header Upper*/}
    </header>
  );
};

const MenuNav = ({ locale }) => {
  const t = useTranslations("navbar");
  
  // Fallback function in case translations fail
  const getTranslation = (key, fallback) => {
    try {
      return t(key) || fallback;
    } catch (error) {
      console.error(`Translation error for key '${key}':`, error);
      return fallback;
    }
  };
  
  return (
    <ul className="navigation clearfix">
      <li className="dropdown text-nowrap">
        <Link href="/">{getTranslation("home", "Home")}</Link>
      </li>
      <li className="dropdown text-nowrap">
        <Link href="/solutions">{getTranslation("solutions", "Solutions")}</Link>
        <ul>
          <Link href="/solutions#1">
            <li className="dropdown">{getTranslation("solutions_dropdown.1", "Notaries")}</li>
          </Link>
          <Link href="/solutions#2">
            <li className="dropdown">{getTranslation("solutions_dropdown.2", "Attorneys")}</li>
          </Link>
          <Link href="/solutions#4">
            <li className="dropdown">{getTranslation("solutions_dropdown.3", "Businesses")}</li>
          </Link>
          <Link href="/solutions#3">
            <li className="dropdown">{getTranslation("solutions_dropdown.4", "Real Estate Agents")}</li>
          </Link>
        </ul>
        <div className="dropdown-btn">
          <span className="fas fa-chevron-down" />
        </div>
      </li>
      <li className="dropdown text-nowrap">
        <Link href="/standard-form">
          {getTranslation("standard", "Standard Forms")}
        </Link>
      </li>
      <li className="dropdown text-nowrap">
        <Link href="/authenticate" className="disabled-link">
          {getTranslation("authenticate", "Authenticate")}
        </Link>
      </li>
      <li className="text-nowrap">
        <Link href="/help-desk">{getTranslation("help", "Help Desk")}</Link>
      </li>
    </ul>
  );
};

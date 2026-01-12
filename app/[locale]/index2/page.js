"use client";
import Counter from "@/components/Counter";
import Layout from "@/layout/Layout";
import { feedbackActive } from "@/utility/sliderProps";
import Link from "next/link";
import Slider from "react-slick";
const Index2 = () => {
  return (
    <Layout footer={2} header={2}>
      <section className="hero-area bgc-dark-blue rel z-1">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 align-self-center">
              <div className="hero-content text-white my-120 rmb-0 wow fadeInLeft delay-0-2s">
                <span className="sub-title mb-35">
                  25 Years of Experience in web design solutions
                </span>
                <h1>Web Development Service Provider</h1>
                <p>
                  Sit amet consectetur adipiscing elit sed do eiusmod tempor
                  incididunt ut labore dolore magna aliquauis ipsum suspendisse
                  ultrices gravida risus
                </p>
                <div className="hero-btns pt-10">
                  <Link legacyBehavior href="/about">
                    <a className="theme-btn mt-15">
                      Discover More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                  <a
                    href="https://www.youtube.com/watch?v=9Y7ma241N8k"
                    className="mfp-iframe video-play-text mt-15"
                  >
                    <i className="fas fa-play" /> <span>How IT Works</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-5 align-self-end">
              <div className="hero-images mt-75 wow fadeInRight delay-0-2s">
                <img src="/assets/images/hero/hero-two.png" alt="Hero" />
              </div>
            </div>
          </div>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/hero1.png"
            alt="Wave Shape"
          />
          <img
            className="shape two"
            src="/assets/images/shapes/hero2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Hero Section End */}
      {/* About Area start */}
      <section className="about-area py-130 rel z-1">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-7 col-lg-6">
              <div className="about-image rmb-65 wow fadeInUp delay-0-2s">
                <img src="/assets/images/about/about.jpg" alt="About" />
                <div
                  className="years-fo-experience bgc-primary bgs-cover counter-text-wrap"
                  style={{
                    backgroundImage:
                      "url(/assets/images/about/years-fo-experience-bg.png)",
                  }}
                >
                  <Counter end={36} />
                  <h4>Years of experience in web design solutions</h4>
                </div>
              </div>
            </div>
            <div className="col-xl-5 col-lg-6">
              <div className="about-content wow fadeInUp delay-0-4s">
                <div className="section-title mb-30">
                  <span className="sub-title mb-15">
                    About digital solutions
                  </span>
                  <h2>We’re Award-winning web design studio</h2>
                </div>
                <p>
                  Our web design company specializes the professional creation
                  unique sites. Our team constantly monitors the emergence of
                  new technologies that we are not afraid to implement in web
                  projects, making them modern and high-tech. We create only
                  selling websites – this is an achievement by drawing the
                  design and working out usability.
                </p>
                <div className="client-satisfactions counter-text-wrap pt-10 pb-10">
                  <img src="/assets/images/about/hands.png" alt="Hands" />

                  <Counter end={3658} />
                  <span className="heading">Clients Satisfactions</span>
                </div>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn mt-15">
                    Learn More About Us{" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* About Area end */}
      {/* Features Area start */}
      <section className="features-area pb-100 rel z-1">
        <div className="container">
          <div className="section-title text-center mb-50">
            <span className="sub-title mb-15">Technology Features</span>
            <h2>Full Potential Modern Features</h2>
          </div>
          <div className="row row-cols-xl-7 row-cols-lg-5 row-cols-md-4 row-cols-sm-3 row-cols-2 justify-content-center">
            <div className="col">
              <div className="feature-item wow fadeInUp delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo1.png" alt="Logo" />
                </div>
                <h5>Bootstrap</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInDown delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo2.png" alt="Logo" />
                </div>
                <h5>HTML</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInUp delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo3.png" alt="Logo" />
                </div>
                <h5>CSS</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInDown delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo4.png" alt="Logo" />
                </div>
                <h5>JS</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInUp delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo5.png" alt="Logo" />
                </div>
                <h5>Angular</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInDown delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo6.png" alt="Logo" />
                </div>
                <h5>React JS</h5>
              </div>
            </div>
            <div className="col">
              <div className="feature-item wow fadeInUp delay-0-2s">
                <div className="image">
                  <img src="/assets/images/features/logo7.png" alt="Logo" />
                </div>
                <h5>Gulp.js</h5>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Area end */}
      {/* Mission Visson Area start */}
      <section className="mission-visson-area pb-130 rel z-1">
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-6">
              <div className="mission-visson-content rmb-65 wow fadeInUp delay-0-2s">
                <div className="section-title mb-35">
                  <span className="sub-title mb-15">Mission and Vision</span>
                  <h2>We aim to deliver quality creative solutions</h2>
                  <p>
                    Our web design company specializes the professional creation
                    unique sites. Our team constantly monitors the emergence of
                    new technologies that we are not afraid to implement in web
                    projects
                  </p>
                </div>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn style-three">
                    Learn More About Us{" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mission-visson-image wow fadeInUp delay-0-4s">
                <img
                  src="/assets/images/about/mission-visson.png"
                  alt="About"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/mission-vision1.png"
            alt="Wave Shape"
          />
          <img
            className="shape two"
            src="/assets/images/shapes/mission-vision2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Mission Visson Area end */}
      {/* Services Area start */}
      <section className="services-area pt-130 pb-100 rel z-1">
        <div className="container">
          <div className="section-title text-center mb-55">
            <span className="sub-title mb-15">Our Popular Services</span>
            <h2>Amazing Web Design Service</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="fab fa-react" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      <a>React js Development</a>
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-4s">
                <div className="icon">
                  <i className="flaticon-data-transfer" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      <a>React Native Development</a>
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-6s">
                <div className="icon">
                  <i className="flaticon-optimization" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      Jamstack Development
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-8s">
                <div className="icon">
                  <i className="flaticon-coding" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      Front-end development
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-carton-box" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      MVP Development
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-4s">
                <div className="icon">
                  <i className="flaticon-app-development" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      Web app Development
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-6s">
                <div className="icon">
                  <i className="flaticon-smartphone" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      Mobile app Development
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-8s">
                <div className="icon">
                  <i className="flaticon-user-experience" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/service-details">
                      Team Agumentation
                    </Link>
                  </h5>
                  <p>Focus provide beautiful layout client look make import</p>
                  <Link legacyBehavior href="/service-details">
                    <a className="read-more">
                      Read More <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Services Area end */}
      {/* Project Area start */}
      <section className="project-area pb-100 rel z-1">
        <div className="container-fluid gap-wide">
          <div className="row justify-content-center">
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-2s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project1.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-4s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project2.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-6s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project3.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-2s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project4.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-4s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project5.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="project-item wow fadeInUp delay-0-6s">
                <div className="project-iamge">
                  <img
                    src="/assets/images/projects/project6.jpg"
                    alt="Project"
                  />
                  <div className="project-over">
                    <Link legacyBehavior href="/project-details">
                      <a className="details-btn">
                        <i className="far fa-arrow-right" />
                      </a>
                    </Link>
                    <h3>Dashboard Design</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Project Area end */}
      {/* Statistics Area start */}
      <section className="statistics-area bgc-dark-blue text-white pb-130 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10">
              <div className="section-title text-center mb-50 wow fadeInUp delay-0-2s">
                <span className="sub-title mb-20">Company Statistics</span>
                <h2>
                  {`We're`} the best web development agency much more
                  achievement
                </h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-3 col-lg-4 col-6 col-small">
              <div className="counter-item counter-text-wrap wow fadeInUp delay-0-2s">
                <i className="flaticon-startup" />

                <Counter end={2365} />
                <span className="counter-title">Projects complete</span>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-6 col-small">
              <div className="counter-item counter-text-wrap wow fadeInUp delay-0-4s">
                <i className="flaticon-global" />

                <Counter end={9632} />
                <span className="counter-title">Trusted Global Clients</span>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-6 col-small">
              <div className="counter-item counter-text-wrap wow fadeInUp delay-0-6s">
                <i className="flaticon-rating" />

                <Counter end={8504} />
                <span className="counter-title">Expert Team Member</span>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-6 col-small">
              <div className="counter-item counter-text-wrap wow fadeInUp delay-0-8s">
                <i className="flaticon-trophy" />

                <Counter end={6763} />
                <span className="counter-title">Projects complete</span>
              </div>
            </div>
          </div>
          <div className="counter-cta mt-65 wow fadeInUp delay-0-2s">
            <h4>Interested ! Let’s work together</h4>
            <Link legacyBehavior href="/contact">
              <a className="theme-btn style-three white-btn">
                Get Started Now <i className="fas fa-angle-double-right" />
              </a>
            </Link>
          </div>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/counter1.png"
            alt="Wave Shape"
          />
          <img
            className="shape two"
            src="/assets/images/shapes/counter2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Statistics Area end */}
      {/* Why Choose Us Area start */}
      <section className="why-choose-area py-120 rpb-130 rel z-1 overflow-hidden">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-5 col-lg-6">
              <div className="why-choose-content pt-10 rmb-65 wow fadeInUp delay-0-2s">
                <div className="section-title mb-35">
                  <span className="sub-title mb-15">Why Choose Us</span>
                  <h2>Web design company that you can trust</h2>
                </div>
                <ul className="list-style-one">
                  <li>
                    <div className="content">
                      <h5>Competitive rates</h5>
                      <p>
                        We use strategic marketing tactics that have been proven
                        programming for most complex functions.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>Premium Development</h5>
                      <p>
                        An emphasis on cutting-edge design and modern usability
                        standards strategic marketing tactics proven.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>Retina Ready &amp; Super Flexible</h5>
                      <p>
                        Devices show more pixels square inch resulting sharperes
                        images Content moves freely across all screen
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>No contracts needed</h5>
                      <p>
                        You can increase, pause or stop our services at any time
                        leaving you completely marketing budgets.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="why-choose-image wow fadeInUp delay-0-4s">
                <img
                  src="/assets/images/about/why-choose-us.png"
                  alt="why choose us"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="circle-shapes">
          <span className="shape one wow slideInDown delay-0-2s" />
          <span className="shape two wow slideInDown delay-0-4s" />
          <span className="shape three wow slideInDown delay-0-6s" />
          <span className="shape four wow slideInDown delay-0-8s" />
        </div>
      </section>
      {/* Why Choose Us Area end */}
      {/* Support & Features Area start */}
      <section
        className="support-features-area bgs-cover bgc-lighter pt-130 pb-100 rel z-1"
        style={{
          backgroundImage:
            "url(/assets/images/features/support-features-bg.png)",
        }}
      >
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-xl-6 col-lg-7">
              <div className="support-features-wrap rmb-65 wow fadeInUp delay-0-2s">
                <div className="row">
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-responsive" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          <a>Responsive design</a>
                        </Link>
                      </h5>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-feature" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          Powerful Customization
                        </Link>
                      </h5>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-aim" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          Cool &amp; modern animations
                        </Link>
                      </h5>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-seo" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          <a>SEO Friendly Coding</a>
                        </Link>
                      </h5>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-search-location" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          Best Technical supports
                        </Link>
                      </h5>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-4 col-sm-6">
                    <div className="service-item style-two">
                      <div className="icon">
                        <i className="flaticon-settings" />
                      </div>
                      <h5>
                        <Link legacyBehavior href="/service-details">
                          Varied Layouts &amp; parallax
                        </Link>
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="support-features-content mb-30 wow fadeInUp delay-0-4s">
                <div className="section-title mb-30">
                  <span className="sub-title mb-15">
                    Support &amp; Features
                  </span>
                  <h2>Amazing web design development features</h2>
                </div>
                <p>
                  Sit amet consectetur adipiscing eiusmod tempor incididunt
                  labore et dolore magna aliquae suspendisse ultrices gravida.
                  Risus commodo viverra maecenas accumsan
                </p>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn mt-25">
                    Learn More About Us{" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Support & Features Area end */}
      {/* Team Area start */}
      <section className="team-area pt-130 pb-35 rel z-1">
        <div className="container">
          <div className="section-title text-center mb-50">
            <span className="sub-title mb-15">Our Team Member</span>
            <h2>Exclusive Team Member</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="team-member wow fadeInUp delay-0-2s">
                <div className="image">
                  <img src="/assets/images/team/member1.jpg" alt="Member" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/team-profile">
                      Richard C. Harrison
                    </Link>
                  </h5>
                  <span className="designation">Senior Manager</span>
                  <div className="social-style-one">
                    <a href="#">
                      <i className="fab fa-facebook-f" />
                    </a>
                    <a href="#">
                      <i className="fab fa-twitter" />
                    </a>
                    <a href="#">
                      <i className="fab fa-linkedin-in" />
                    </a>
                    <a href="#">
                      <i className="fab fa-instagram" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="team-member wow fadeInUp delay-0-4s">
                <div className="image">
                  <img src="/assets/images/team/member2.jpg" alt="Member" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/team-profile">
                      Richard C. Harrison
                    </Link>
                  </h5>
                  <span className="designation">Web Developer</span>
                  <div className="social-style-one">
                    <a href="#">
                      <i className="fab fa-facebook-f" />
                    </a>
                    <a href="#">
                      <i className="fab fa-twitter" />
                    </a>
                    <a href="#">
                      <i className="fab fa-linkedin-in" />
                    </a>
                    <a href="#">
                      <i className="fab fa-instagram" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="team-member wow fadeInUp delay-0-6s">
                <div className="image">
                  <img src="/assets/images/team/member3.jpg" alt="Member" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/team-profile">
                      Michael D. Jackson
                    </Link>
                  </h5>
                  <span className="designation">Business Developer</span>
                  <div className="social-style-one">
                    <a href="#">
                      <i className="fab fa-facebook-f" />
                    </a>
                    <a href="#">
                      <i className="fab fa-twitter" />
                    </a>
                    <a href="#">
                      <i className="fab fa-linkedin-in" />
                    </a>
                    <a href="#">
                      <i className="fab fa-instagram" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <div className="team-member wow fadeInUp delay-0-8s">
                <div className="image">
                  <img src="/assets/images/team/member4.jpg" alt="Member" />
                </div>
                <div className="content">
                  <h5>
                    <Link legacyBehavior href="/team-profile">
                      Damian S. Madison
                    </Link>
                  </h5>
                  <span className="designation">Product Designer</span>
                  <div className="social-style-one">
                    <a href="#">
                      <i className="fab fa-facebook-f" />
                    </a>
                    <a href="#">
                      <i className="fab fa-twitter" />
                    </a>
                    <a href="#">
                      <i className="fab fa-linkedin-in" />
                    </a>
                    <a href="#">
                      <i className="fab fa-instagram" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Team Area end */}
      {/* Pricing Area start */}
      <section className="pricing-area bgc-dark-blue text-white py-130 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10">
              <div className="section-title text-center mb-55 wow fadeInUp delay-0-2s">
                <span className="sub-title mb-20">Pricing Plan</span>
                <h2>Best Pricing Package</h2>
              </div>
            </div>
          </div>
          <div className="pricing-plan-item wow fadeInUp delay-0-2s">
            <div className="price-features">
              <h4>Basic Plan</h4>
              <ul className="list-style-two">
                <li>Landing page design (10 pages)</li>
                <li>Domin hosting provider</li>
                <li>HTML+CSS design (12 pages)</li>
                <li>Online support (24/7)</li>
                <li>Social Media Marketing</li>
                <li>WordPres development</li>
              </ul>
              <span className="badge">popular</span>
            </div>
            <div className="price-and-btn">
              <div className="content">
                <span className="price">248</span>
                <span className="save">
                  Save<span> 25%</span>
                </span>
                <Link legacyBehavior href="/pricing">
                  <a className="theme-btn style-three">
                    Choose Package <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="pricing-plan-item wow fadeInUp delay-0-2s">
            <div className="price-features">
              <h4>Standard Plan</h4>
              <ul className="list-style-two">
                <li>Landing page design (10 pages)</li>
                <li>Domin hosting provider</li>
                <li>HTML+CSS design (12 pages)</li>
                <li>Online support (24/7)</li>
                <li>Social Media Marketing</li>
                <li>WordPres development</li>
              </ul>
              <span className="badge">popular</span>
            </div>
            <div className="price-and-btn">
              <div className="content">
                <span className="price">452</span>
                <span className="save">
                  Save<span> 43%</span>
                </span>
                <Link legacyBehavior href="/pricing">
                  <a className="theme-btn style-three">
                    Choose Package <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="pricing-plan-item wow fadeInUp delay-0-2s">
            <div className="price-features">
              <h4>Premium Plan</h4>
              <ul className="list-style-two">
                <li>Landing page design (10 pages)</li>
                <li>Domin hosting provider</li>
                <li>HTML+CSS design (12 pages)</li>
                <li>Online support (24/7)</li>
                <li>Social Media Marketing</li>
                <li>WordPres development</li>
              </ul>
              <span className="badge">popular</span>
            </div>
            <div className="price-and-btn">
              <div className="content">
                <span className="price">683</span>
                <span className="save">
                  Save<span> 66%</span>
                </span>
                <Link legacyBehavior href="/pricing">
                  <a className="theme-btn style-three">
                    Choose Package <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/pricing1.png"
            alt="Wave Shape"
          />
          <img
            className="shape two"
            src="/assets/images/shapes/pricing2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Pricing Area end */}
      {/* Feedback Area start */}
      <section className="feedback-area py-130 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-8">
              <div className="section-title text-center mb-40 wow fadeInUp delay-0-2s">
                <span className="sub-title mb-20">Clents Feedback</span>
                <h2>3,000+ Positive reviews by our satisfied clients</h2>
              </div>
            </div>
          </div>
          <Slider {...feedbackActive} className="feedback-active">
            <div className="feedback-item wow fadeInUp delay-0-2s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo1.png" alt="Logo" />
              </div>
              <h4>On the other hand denounes with indignwy</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author1.jpg" alt="Author" />
                <div className="content">
                  <h5>Jonathan B. Bohnert</h5>
                  <span>CEO &amp; Founder</span>
                </div>
              </div>
            </div>
            <div className="feedback-item wow fadeInUp delay-0-4s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo2.png" alt="Logo" />
              </div>
              <h4>Custom programming fores most complex functions</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author2.jpg" alt="Author" />
                <div className="content">
                  <h5>Nicholas R. Gomez</h5>
                  <span>Medical Officers</span>
                </div>
              </div>
            </div>
            <div className="feedback-item wow fadeInUp delay-0-6s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo3.png" alt="Logo" />
              </div>
              <h4>We use strategic marketing tactics be proven work.</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author3.jpg" alt="Author" />
                <div className="content">
                  <h5>James R. Lawrence</h5>
                  <span>Junior Manager</span>
                </div>
              </div>
            </div>
            <div className="feedback-item wow fadeInUp delay-0-2s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo1.png" alt="Logo" />
              </div>
              <h4>On the other hand denounes with indignwy</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author1.jpg" alt="Author" />
                <div className="content">
                  <h5>Jonathan B. Bohnert</h5>
                  <span>CEO &amp; Founder</span>
                </div>
              </div>
            </div>
            <div className="feedback-item wow fadeInUp delay-0-2s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo2.png" alt="Logo" />
              </div>
              <h4>Custom programming fores most complex functions</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author2.jpg" alt="Author" />
                <div className="content">
                  <h5>Nicholas R. Gomez</h5>
                  <span>Medical Officers</span>
                </div>
              </div>
            </div>
            <div className="feedback-item wow fadeInUp delay-0-2s">
              <div className="author-logo">
                <i className="far fa-quote-right" />
                <img src="/assets/images/feedback/logo3.png" alt="Logo" />
              </div>
              <h4>We use strategic marketing tactics be proven work.</h4>
              <p>
                Sed ut perspiciatis unde omnis natus error voluptatem
                accusantium dolore laudantuce totam rem aperiam eaque inventore
              </p>
              <div className="feedback-author">
                <img src="/assets/images/feedback/author3.jpg" alt="Author" />
                <div className="content">
                  <h5>James R. Lawrence</h5>
                  <span>Junior Manager</span>
                </div>
              </div>
            </div>
          </Slider>
        </div>
        <div className="feedback-shape one">
          <img src="/assets/images/feedback/man1.jpg" alt="Man Shape" />
        </div>
        <div className="feedback-shape two">
          <img src="/assets/images/feedback/man2.jpg" alt="Man Shape" />
        </div>
      </section>
      {/* Feedback Area end */}
      {/* Footer Area Start */}
    </Layout>
  );
};
export default Index2;

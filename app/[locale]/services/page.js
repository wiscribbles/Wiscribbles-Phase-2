import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
const Services = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Popular Se<span>rvices</span>`}
        titleText="Popular Services"
      />
      <section className="statistics-area-five py-130">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-lg-6">
              <div className="statistics-five-content mb-30 rmb-65 wow fadeInRight delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    Company Statistics
                  </span>
                  <h2>
                    Discover Extraordinary projects brought to life on Oxence.
                  </h2>
                </div>
                <p>
                  Start building your first prototype in no time. Ogency
                  intuitive, drag &amp; drop interface gives you all the
                  building blocks that you need to get started! No skills
                  required.
                </p>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn mt-15">
                    Learn More <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="statistics-five-image wow fadeInLeft delay-0-2s">
                <img
                  src="/assets/images/about/statistics-five.png"
                  alt="Statistics"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Statistics Five Area end */}
      {/* Working Process Area start */}
      <section className="work-process-area pb-95 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="section-title text-center mb-55 wow fadeInUp delay-0-2s">
                <span className="sub-title style-two mb-15">
                  Working Process
                </span>
                <h2>How does we works</h2>
              </div>
            </div>
          </div>
          <div className="work-process-wrap rel z-1">
            <div className="row justify-content-between">
              <div className="col-xl-3 col-lg-5 col-sm-6">
                <div className="work-process-item mt-30 wow fadeInUp delay-0-2s">
                  <div className="icon">
                    <span className="number">01</span>
                    <i className="flaticon-optimization" />
                  </div>
                  <h4>Info Gathering</h4>
                  <p>Sit amet consectetur adipiscing elit sed eiusmod tempor</p>
                </div>
              </div>
              <div className="col-xl-3 col-lg-5 col-sm-6">
                <div className="work-process-item wow fadeInUp delay-0-4s">
                  <div className="icon">
                    <span className="number">02</span>
                    <i className="flaticon-link" />
                  </div>
                  <h4>Idea Planning</h4>
                  <p>Sit amet consectetur adipiscing elit sed eiusmod tempor</p>
                </div>
              </div>
              <div className="col-xl-3 col-lg-5 col-sm-6">
                <div className="work-process-item mt-55 wow fadeInUp delay-0-6s">
                  <div className="icon">
                    <span className="number">03</span>
                    <i className="flaticon-data" />
                  </div>
                  <h4>Design Analysis</h4>
                  <p>Sit amet consectetur adipiscing elit sed eiusmod tempor</p>
                </div>
              </div>
              <div className="col-xl-3 col-lg-5 col-sm-6">
                <div className="work-process-item mt-45 wow fadeInUp delay-0-8s">
                  <div className="icon">
                    <span className="number">04</span>
                    <i className="flaticon-star" />
                  </div>
                  <h4>Testing &amp; Lunch</h4>
                  <p>Sit amet consectetur adipiscing elit sed eiusmod tempor</p>
                </div>
              </div>
            </div>
            <div className="work-process-shape">
              <img
                src="/assets/images/shapes/worp-process-step.png"
                alt="Shape"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Working Process Area end */}
      {/* Services Area start */}
      <section className="services-area-four bgc-black pt-130 pb-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10">
              <div className="section-title text-center text-white mb-60 wow fadeInUp delay-0-2s">
                <span className="sub-title style-two mb-20">
                  Services We Provide
                </span>
                <h2>Popular Web Services</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-2s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four1.png"
                    alt="Service"
                  />
                </div>
                <h5>Website Creation from Figma, XD or Photoshop</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-4s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four2.png"
                    alt="Service"
                  />
                </div>
                <h5>Mobile App Development and Website Design</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-6s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four3.png"
                    alt="Service"
                  />
                </div>
                <h5>eCommerce and Product Selling Development</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-2s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four4.png"
                    alt="Service"
                  />
                </div>
                <h5>Responsive Websites (UI/UX) Design</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-4s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four5.png"
                    alt="Service"
                  />
                </div>
                <h5>SEO (Search Engine Optimization)</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="service-item-four wow fadeInUp delay-0-6s">
                <div className="image">
                  <img
                    src="/assets/images/services/service-four6.png"
                    alt="Service"
                  />
                </div>
                <h5>Digital Product Design and Development</h5>
                <Link legacyBehavior href="/service-details">
                  <a className="theme-btn style-three">
                    Service Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Services Area end */}
      {/* Pricing Area start */}
      <section className="pricing-area py-130 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10">
              <div className="section-title text-center mb-55 wow fadeInUp delay-0-2s">
                <span className="sub-title style-two mb-20">Pricing Plan</span>
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
            src="/assets/images/shapes/pricing-light1.png"
            alt="Wave Shape"
          />
          <img
            className="shape two"
            src="/assets/images/shapes/pricing-light2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Pricing Area end */}
    </Layout>
  );
};
export default Services;

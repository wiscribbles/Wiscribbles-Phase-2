"use client";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
import { Nav, Tab } from "react-bootstrap";
const Pricing = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Pricing <span>Plan</span>`}
        titleText="Pricing Plan"
      />
      <section className="pricing-area-three pt-130 pb-165 rel z-1">
        <div className="container">
          <Tab.Container defaultActiveKey={"monthly"}>
            <div className="row">
              <div className="col-xl-4 col-lg-10">
                <div className="pricing-plan-content mb-65 wow fadeInUp delay-0-2s">
                  <div className="section-title mb-30">
                    <span className="sub-title style-two mb-20">
                      Pricing Plan
                    </span>
                    <h2>Choose Your Best Pricing Plan</h2>
                  </div>
                  <p>
                    Start building your first prototype in no time. Ogency
                    intuitive drag &amp; drop interface gives you all the
                    building blocks that you need to get started! No skills
                    required.
                  </p>
                  <Nav className="nav pricing-tab mt-15" role="tablist">
                    <li>
                      <Nav.Link
                        eventKey={"monthly"}
                        as="button"
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#monthly"
                      >
                        Monthly
                      </Nav.Link>
                    </li>
                    <li>
                      <Nav.Link
                        eventKey={"yearly"}
                        as="button"
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#yearly"
                      >
                        Yearly
                      </Nav.Link>
                    </li>
                  </Nav>
                </div>
              </div>
              <div className="col-xl-8">
                <Tab.Content className="tab-content wow fadeInUp delay-0-4s">
                  <Tab.Pane className="tab-pane fade" eventKey="monthly">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="pricing-plan-three">
                          <span className="badge">popular</span>
                          <h4>Basic Plan</h4>
                          <ul className="list-style-two">
                            <li>Landing page design (10 pages)</li>
                            <li>HTML+CSS design (12 pages)</li>
                            <li>Social Media Marketing</li>
                            <li>Domin hosting provider</li>
                            <li>Online support (24/7)</li>
                            <li>WordPres development</li>
                          </ul>
                          <div className="price-and-btn">
                            <div className="content">
                              <span className="price">248</span>
                              <span className="save">
                                Save<span> 25%</span>
                              </span>
                              <Link legacyBehavior href="/pricing">
                                <a className="theme-btn style-three">
                                  Choose Package{" "}
                                  <i className="fas fa-angle-double-right" />
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="pricing-plan-three">
                          <span className="badge">popular</span>
                          <h4>Ultra Plan</h4>
                          <ul className="list-style-two">
                            <li>Landing page design (10 pages)</li>
                            <li>HTML+CSS design (12 pages)</li>
                            <li>Social Media Marketing</li>
                            <li>Domin hosting provider</li>
                            <li>Online support (24/7)</li>
                            <li>WordPres development</li>
                          </ul>
                          <div className="price-and-btn">
                            <div className="content">
                              <span className="price">548</span>
                              <span className="save">
                                Save<span> 25%</span>
                              </span>
                              <Link legacyBehavior href="/pricing">
                                <a className="theme-btn style-three">
                                  Choose Package{" "}
                                  <i className="fas fa-angle-double-right" />
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                  <Tab.Pane className="tab-pane fade yearly" eventKey="yearly">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="pricing-plan-three">
                          <span className="badge">popular</span>
                          <h4>Basic Plan</h4>
                          <ul className="list-style-two">
                            <li>Landing page design (10 pages)</li>
                            <li>HTML+CSS design (12 pages)</li>
                            <li>Social Media Marketing</li>
                            <li>Domin hosting provider</li>
                            <li>Online support (24/7)</li>
                            <li>WordPres development</li>
                          </ul>
                          <div className="price-and-btn">
                            <div className="content">
                              <span className="price">480</span>
                              <span className="save">
                                Save<span> 25%</span>
                              </span>
                              <Link legacyBehavior href="/pricing">
                                <a className="theme-btn style-three">
                                  Choose Package{" "}
                                  <i className="fas fa-angle-double-right" />
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="pricing-plan-three">
                          <span className="badge">popular</span>
                          <h4>Ultra Plan</h4>
                          <ul className="list-style-two">
                            <li>Landing page design (10 pages)</li>
                            <li>HTML+CSS design (12 pages)</li>
                            <li>Social Media Marketing</li>
                            <li>Domin hosting provider</li>
                            <li>Online support (24/7)</li>
                            <li>WordPres development</li>
                          </ul>
                          <div className="price-and-btn">
                            <div className="content">
                              <span className="price">848</span>
                              <span className="save">
                                Save<span> 25%</span>
                              </span>
                              <Link legacyBehavior href="/pricing">
                                <a className="theme-btn style-three">
                                  Choose Package{" "}
                                  <i className="fas fa-angle-double-right" />
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </div>
            </div>
          </Tab.Container>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/pricing-bg-wave1.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Pricing Area Three end */}
      {/* Pricing Area Four start */}
      <section className="pricing-area-four pt-65 pb-165 rel z-1">
        <div className="container">
          <Tab.Container defaultActiveKey={"monthlyTwo"}>
            <div className="row justify-content-center">
              <div className="col-xl-5 col-lg-7">
                <div className="pricing-plan-content text-center mb-65 wow fadeInUp delay-0-2s">
                  <div className="section-title text-center mb-30">
                    <span className="sub-title style-two mb-20">
                      Pricing Plan
                    </span>
                    <h2>Choose Your Perfect Pricing Package</h2>
                  </div>
                  <Nav className="nav pricing-tab mt-15" role="tablist">
                    <li>
                      <Nav.Link
                        eventKey={"monthlyTwo"}
                        as="button"
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#monthlyTwo"
                      >
                        Monthly
                      </Nav.Link>
                    </li>
                    <li>
                      <Nav.Link
                        eventKey={"yearlyTwo"}
                        as="button"
                        className="nav-link"
                        data-bs-toggle="tab"
                        data-bs-target="#yearlyTwo"
                      >
                        Yearly
                      </Nav.Link>
                    </li>
                  </Nav>
                </div>
              </div>
            </div>
            <Tab.Content className="tab-content wow fadeInUp delay-0-4s">
              <Tab.Pane className="tab-pane fade" eventKey="monthlyTwo">
                <div className="row justify-content-center">
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Basic Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">248</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Ultra Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">548</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">948</span>
                          <span className="save">
                            Save<span> 43%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Pane>
              <Tab.Pane className="tab-pane fade yearly" eventKey="yearlyTwo">
                <div className="row justify-content-center">
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Basic Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">382</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Ultra Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">805</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design (10 pages)</li>
                        <li>HTML+CSS design (12 pages)</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">1248</span>
                          <span className="save">
                            Save<span> 43%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/pricing-bg-wave2.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Pricing Area Four end */}
      {/* Pricing Area Five start */}
      <section className="pricing-area-five pt-65 pb-100 rel z-1">
        <div className="container">
          <Tab.Container defaultActiveKey={"monthlyThree"}>
            <div className="row align-items-end justify-content-between pb-25">
              <div className="col-xl-5 col-lg-7">
                <div className="section-title mb-35 wow fadeInUp delay-0-2s">
                  <span className="sub-title style-two mb-20">
                    Pricing Plan
                  </span>
                  <h2>Choose Your Perfect Pricing Package</h2>
                </div>
              </div>
              <div className="col-lg-5 text-lg-end">
                <Nav
                  className="nav pricing-tab mb-35 wow fadeInUp delay-0-3s"
                  role="tablist"
                >
                  <li>
                    <Nav.Link
                      eventKey={"monthlyThree"}
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      data-bs-target="#monthlyThree"
                    >
                      Monthly
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link
                      eventKey={"yearlyThree"}
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      data-bs-target="#yearlyThree"
                    >
                      Yearly
                    </Nav.Link>
                  </li>
                </Nav>
              </div>
            </div>
            <Tab.Content className="tab-content wow fadeInUp delay-0-4s">
              <Tab.Pane className="tab-pane fade" eventKey="monthlyThree">
                <div className="row justify-content-center">
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Basic Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">248</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Ultra Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">548</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">648</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">948</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Pane>
              <Tab.Pane className="tab-pane fade yearly" eventKey="yearlyThree">
                <div className="row justify-content-center">
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Basic Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">383</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Ultra Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">682</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">854</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6">
                    <div className="pricing-plan-three style-two">
                      <span className="badge">popular</span>
                      <h4>Gold Plan</h4>
                      <ul className="list-style-two">
                        <li>Landing page design</li>
                        <li>HTML+CSS design</li>
                        <li>Social Media Marketing</li>
                        <li>Domin hosting provider</li>
                        <li>Online support (24/7)</li>
                        <li>WordPres development</li>
                      </ul>
                      <div className="price-and-btn">
                        <div className="content">
                          <span className="price">1235</span>
                          <span className="save">
                            Save<span> 25%</span>
                          </span>
                          <Link legacyBehavior href="/pricing">
                            <a className="theme-btn style-three">
                              Choose Package{" "}
                              <i className="fas fa-angle-double-right" />
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
        <div className="wave-shapes">
          <img
            className="shape one"
            src="/assets/images/shapes/pricing-bg-wave3.png"
            alt="Wave Shape"
          />
        </div>
      </section>
      {/* Pricing Area Five end */}
    </Layout>
  );
};
export default Pricing;

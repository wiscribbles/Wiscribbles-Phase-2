"use client";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import { projectThreeActive } from "@/utility/sliderProps";
import Link from "next/link";
import { Nav, Tab } from "react-bootstrap";
import Slider from "react-slick";
const ProjectsCarousel = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Project Car<span>ousel</span>`}
        titleText="Project Carousel"
      />
      <section className="project-carousel-area py-130 rel z-1">
        <Tab.Container defaultActiveKey="business">
          <div className="container">
            <div className="row align-items-end pb-40">
              <div className="col-xl-6">
                <div className="section-title mb-30 wow fadeInUp delay-0-2s">
                  <span className="sub-title style-two mb-15">
                    Pre-made Template
                  </span>
                  <h2>Let’s See Our Popular Website Template</h2>
                </div>
              </div>
              <div className="col-xl-6 text-xl-end">
                <Nav
                  className="nav project-tab d-inline-flex mb-30 wow fadeInUp delay-0-4s"
                  id="myTab"
                  role="tablist"
                >
                  <li>
                    <Nav.Link
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      eventKey="business"
                    >
                      Business
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      eventKey="saas"
                    >
                      Saas
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      eventKey="medical"
                    >
                      Medical
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      eventKey="nfts"
                    >
                      NFTs
                    </Nav.Link>
                  </li>
                  <li>
                    <Nav.Link
                      as="button"
                      className="nav-link"
                      data-bs-toggle="tab"
                      eventKey="education"
                    >
                      Education
                    </Nav.Link>
                  </li>
                </Nav>
              </div>
            </div>
          </div>
          <Tab.Content className="tab-content" id="myTabContent">
            <Tab.Pane className="tab-pane fade" eventKey="business">
              <Slider {...projectThreeActive} className="project-three-active">
                <div className="project-item style-three wow fadeInUp delay-0-2s">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three wow fadeInUp delay-0-4s">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three wow fadeInUp delay-0-6s">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
              </Slider>
            </Tab.Pane>
            <Tab.Pane className="tab-pane fade" eventKey="saas">
              <Slider {...projectThreeActive} className="project-three-active">
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
              </Slider>
            </Tab.Pane>
            <Tab.Pane className="tab-pane fade" eventKey="medical">
              <Slider {...projectThreeActive} className="project-three-active">
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
              </Slider>
            </Tab.Pane>
            <Tab.Pane className="tab-pane fade" eventKey="nfts">
              <Slider {...projectThreeActive} className="project-three-active">
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
              </Slider>
            </Tab.Pane>
            <Tab.Pane className="tab-pane fade" eventKey="education">
              <Slider {...projectThreeActive} className="project-three-active">
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three1.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Web Design Landing <br />
                          PSD Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three2.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          Saas Landing PSD <br />
                          Template
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
                <div className="project-item style-three">
                  <div className="project-iamge">
                    <img
                      src="/assets/images/projects/project-three3.jpg"
                      alt="Project"
                    />
                    <div className="project-over">
                      <Link legacyBehavior href="/project-details">
                        <a className="details-btn">
                          <i className="far fa-arrow-right" />
                        </a>
                      </Link>
                    </div>
                  </div>
                  <div className="project-content">
                    <h5>
                      <Link legacyBehavior href="/project-details">
                        <a>
                          {" "}
                          Mobile Application <br />
                          Development
                        </a>
                      </Link>
                    </h5>
                  </div>
                </div>
              </Slider>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </section>
      {/* Project Carousel Area end */}
    </Layout>
  );
};
export default ProjectsCarousel;

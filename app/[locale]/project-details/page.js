"use client";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import { projectThreeActive } from "@/utility/sliderProps";
import Link from "next/link";
import Slider from "react-slick";
const ProjectsDetails = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Project D<span>etails</span>`}
        titleText="Project Details"
      />
      <section className="project-details-area pt-130 rel z-1">
        <div className="container">
          <div className="section-title text-center mb-50 wow fadeInUp delay-0-2s">
            <h2>3D Creative Illustration Design</h2>
            <span className="sub-title-two">Design, Branding</span>
          </div>
          <div className="details-image mb-55 wow fadeInUp delay-0-3s">
            <img
              src="/assets/images/projects/project-details.jpg"
              alt="Project Details"
            />
          </div>
          <div className="row pb-25">
            <div className="col-xl-5 col-lg-4">
              <h4 className="title mb-15 rmb-30">Project Information</h4>
            </div>
            <div className="col-xl-7 col-lg-8">
              <div className="row row-cols-lg-4 row-cols-2">
                <div className="col">
                  <h5>Category</h5>
                  <span className="sub-title-two mb-15">
                    3D Illustration <br />
                    Isometric Definition
                  </span>
                </div>
                <div className="col">
                  <h5>Clients</h5>
                  <span className="sub-title-two mb-15">
                    Willo Comapny <br />
                    New York
                  </span>
                </div>
                <div className="col">
                  <h5>Date</h5>
                  <span className="sub-title-two mb-15">25 July 2024</span>
                </div>
                <div className="col">
                  <h5>Duration</h5>
                  <span className="sub-title-two mb-15">160 Hours</span>
                </div>
              </div>
            </div>
          </div>
          <hr />
          <h4 className="title mt-55 mb-15">Project Details</h4>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
            aspernatur aut odit aut fugit, sed quia consequuntur magni dolores
            eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est,
            qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit,
            sed quia non numquam eius modi tempora incidunt ut labore et dolore
            magnam aliquam quaerat voluptatem
          </p>
          <p>
            But I must explain to you how all this mistaken idea of denouncing
            pleasure and praising pain was born and I will give you a complete
            account of the system, and expound the actual teachings of the great
            explorer of the truth, the master-builder of human happiness. No one
            rejects, dislikes, or avoids pleasure itself, because
          </p>
          <hr className="mt-50" />
          <div className="next-prev-project py-65">
            <div className="prev-project wow fadeInLeft delay-0-2s">
              <div className="image">
                <img
                  src="/assets/images/projects/prev-project.jpg"
                  alt="Project"
                />
              </div>
              <div className="content">
                <h5>
                  <Link legacyBehavior href="/project-details">
                    Dashboard Design
                  </Link>
                </h5>
                <span className="category">Creative, Branding</span>
                <Link legacyBehavior href="/project-details">
                  <a className="read-more">
                    View Details <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
            <Link legacyBehavior href="/projects">
              <a className="show-all">
                <i className="far fa-ellipsis-h" />
                <i className="far fa-ellipsis-h" />
                <i className="far fa-ellipsis-h" />
              </a>
            </Link>
            <div className="next-project wow fadeInRight delay-0-2s">
              <div className="image">
                <img
                  src="/assets/images/projects/nex-project.jpg"
                  alt="Project"
                />
              </div>
              <div className="content">
                <h5>
                  <Link legacyBehavior href="/project-details">
                    Creative Pattern
                  </Link>
                </h5>
                <span className="category">Mokeup, Branding</span>
                <Link legacyBehavior href="/project-details">
                  <a className="read-more">
                    View Details <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <hr />
        </div>
      </section>
      {/* Project Details Area end */}
      {/* Related Project Area start */}
      <section className="related-project-area pt-110 pb-130 rel z-1">
        <div className="container">
          <div className="section-title text-center mb-60 wow fadeInUp delay-0-2s">
            <span className="sub-title style-two mb-15">Pre-made Template</span>
            <h2>Related Projects</h2>
          </div>
        </div>
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
                    {" "}
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
                    {" "}
                    Mobile Application <br />
                    Development{" "}
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
                    {" "}
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
                    Development{" "}
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
      </section>
      {/* Related Project Area end */}
    </Layout>
  );
};
export default ProjectsDetails;

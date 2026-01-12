import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
const ProjectsCreative = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Project Cre<span>ative</span>`}
        titleText="Project Creative"
      />
      <section className="project-creative-area py-130 rel z-1">
        <div className="container">
          <div className="project-creative-item">
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative1.jpg"
                alt="Project Creative"
              />
            </div>
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">01</span>
                <h2>Dashboard Design</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
          </div>
          <div className="project-creative-item">
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">02</span>
                <h2>ISO Ilustration</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative2.jpg"
                alt="Project Creative"
              />
            </div>
          </div>
          <div className="project-creative-item">
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative3.jpg"
                alt="Project Creative"
              />
            </div>
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">03</span>
                <h2>Mobile Application</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
          </div>
          <div className="project-creative-item">
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">04</span>
                <h2>Web Template</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative4.jpg"
                alt="Project Creative"
              />
            </div>
          </div>
          <div className="project-creative-item">
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative5.jpg"
                alt="Project Creative"
              />
            </div>
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">05</span>
                <h2>3D Illustrations</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
          </div>
          <div className="project-creative-item">
            <div className="content wow fadeInRight delay-0-2s">
              <div className="section-title">
                <span className="sub-title style-two mb-15">06</span>
                <h2>Saas Landing</h2>
              </div>
              <hr />
              <p>
                Start from scratch or choose over 500 designer made template
                that you can customize usinghe drag and drop website buildersite
              </p>
              <Link legacyBehavior href="/project-details">
                <a className="theme-btn style-three">
                  Project Details <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
            <div className="image wow fadeInLeft delay-0-2s">
              <img
                src="/assets/images/projects/project-creative6.jpg"
                alt="Project Creative"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Project Creative Area end */}
    </Layout>
  );
};
export default ProjectsCreative;

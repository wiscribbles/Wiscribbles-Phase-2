import { projectThreeActive } from "@/utility/sliderProps";
import Link from "next/link";
import Slider from "react-slick";

const RecentProjects = () => {
  return (
    <section className="project-area-three py-130 rel z-1" id="project">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg10">
            <div className="section-title text-center mb-50 wow fadeInUp delay-0-2s">
              <span className="sub-title mb-15">Recent Projects</span>
              <h2>Look at latest works gallery</h2>
            </div>
          </div>
        </div>
      </div>
      <Slider {...projectThreeActive} className="project-three-active">
        <div className="project-item style-two wow fadeInUp delay-0-2s">
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
            <h4>
              <Link legacyBehavior href="/project-details">
                Creative Website design
              </Link>
            </h4>
            <span className="category">Design Responsive</span>
          </div>
        </div>
        <div className="project-item style-two wow fadeInUp delay-0-4s">
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
            <h4>
              <Link legacyBehavior href="/project-details">
                Software Landing Pages
              </Link>
            </h4>
            <span className="category">Design Responsive</span>
          </div>
        </div>
        <div className="project-item style-two wow fadeInUp delay-0-6s">
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
            <h4>
              <Link legacyBehavior href="/project-details">
                Mobile Application Design
              </Link>
            </h4>
            <span className="category">Design Responsive</span>
          </div>
        </div>
        <div className="project-item style-two wow fadeInUp delay-0-8s">
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
            <h4>
              <Link legacyBehavior href="/project-details">
                Software Landing Pages
              </Link>
            </h4>
            <span className="category">Design Responsive</span>
          </div>
        </div>
      </Slider>
    </section>
  );
};
export default RecentProjects;

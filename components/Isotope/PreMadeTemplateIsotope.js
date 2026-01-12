import Isotope from "isotope-layout";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

const PreMadeTemplateIsotope = () => {
  // Isotope
  const isotope = useRef();
  const [filterKey, setFilterKey] = useState("*");
  useEffect(() => {
    setTimeout(() => {
      isotope.current = new Isotope(".project-active", {
        itemSelector: ".item",
        //    layoutMode: "fitRows",
        percentPosition: true,
        masonry: {
          columnWidth: ".item",
        },
        animationOptions: {
          duration: 750,
          easing: "linear",
          queue: false,
        },
      });
    }, 1000);
    //     return () => isotope.current.destroy();
  }, []);
  useEffect(() => {
    if (isotope.current) {
      filterKey === "*"
        ? isotope.current.arrange({ filter: `*` })
        : isotope.current.arrange({ filter: `.${filterKey}` });
    }
  }, [filterKey]);
  const handleFilterKeyChange = (key) => () => {
    setFilterKey(key);
  };
  const activeBtn = (value) => (value === filterKey ? "current" : "");
  return (
    <Fragment>
      <ul className="project-filter filter-btns-one justify-content-center mb-30 wow fadeInUp delay-0-4s">
        <li
          data-filter="*"
          className={`c-pointer ${activeBtn("*")}`}
          onClick={handleFilterKeyChange("*")}
        >
          Show All
        </li>
        <li
          data-filter=".business"
          className={`c-pointer ${activeBtn("business")}`}
          onClick={handleFilterKeyChange("business")}
        >
          Business
        </li>
        <li
          className={`c-pointer ${activeBtn("saas")}`}
          onClick={handleFilterKeyChange("saas")}
          data-filter=".saas"
        >
          Saas
        </li>
        <li
          className={`c-pointer ${activeBtn("medical")}`}
          onClick={handleFilterKeyChange("medical")}
          data-filter=".medical"
        >
          Medical
        </li>
        <li
          className={`c-pointer ${activeBtn("construction")}`}
          onClick={handleFilterKeyChange("construction")}
          data-filter=".construction"
        >
          Construction
        </li>
        <li
          className={`c-pointer ${activeBtn("education")}`}
          onClick={handleFilterKeyChange("education")}
          data-filter=".education"
        >
          Education
        </li>
      </ul>
      <div className="row project-active justify-content-center">
        <div className="col-xl-4 col-md-6 item saas construction">
          <div className="project-item style-two wow fadeInUp delay-0-2s">
            <div className="project-iamge">
              <img src="/assets/images/projects/project-two1.jpg" />
              <div className="project-over">
                <a className="details-btn" href="#">
                  <i className="far fa-arrow-right" />
                </a>
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
        </div>
        <div className="col-xl-4 col-md-6 item business medical education">
          <div className="project-item style-two wow fadeInUp delay-0-4s">
            <div className="project-iamge">
              <img
                src="/assets/images/projects/project-two2.jpg"
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
                <Link legacyBehavior href="project-details">
                  <a>
                    Fintex- eWallet PSD <br />
                    Template
                  </a>
                </Link>
              </h5>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item business construction">
          <div className="project-item style-two wow fadeInUp delay-0-6s">
            <div className="project-iamge">
              <img
                src="/assets/images/projects/project-two3.jpg"
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
                <Link legacyBehavior href="project-details">
                  <a>
                    Job Finding Mobile <br />
                    Applications
                  </a>
                </Link>
              </h5>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item business education">
          <div className="project-item style-two wow fadeInUp delay-0-2s">
            <div className="project-iamge">
              <img
                src="/assets/images/projects/project-two4.jpg"
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
                <Link legacyBehavior href="project-details">
                  <a>
                    Raisehand Charity <br />
                    Foundation Template
                  </a>
                </Link>
              </h5>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas medical">
          <div className="project-item style-two wow fadeInUp delay-0-4s">
            <div className="project-iamge">
              <img
                src="/assets/images/projects/project-two5.jpg"
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
            <div className="project-content business">
              <h5>
                <Link legacyBehavior href="project-details">
                  <a>
                    Web Design Landing <br />
                    PSD Template
                  </a>
                </Link>
              </h5>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas construction education">
          <div className="project-item style-two wow fadeInUp delay-0-6s">
            <div className="project-iamge">
              <img
                src="/assets/images/projects/project-two6.jpg"
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
                <Link legacyBehavior href="project-details">
                  <a>
                    Fintex- eWallet PSD <br />
                    Template
                  </a>
                </Link>
              </h5>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
export default PreMadeTemplateIsotope;

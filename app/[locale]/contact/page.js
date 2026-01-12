"use client";
import { useTranslations } from "next-intl";
import Layout from "../../../layout/Layout";
import PageBanner from "../../../layout/PageBanner";
const Contact = () => {
  const t = useTranslations("contact_page");
  return (
    <Layout footer={1}>
      <PageBanner titleHtml={`${t('titleHalf1')}<span>${t('titleHalf2')}</span>`} titleText="Contact" />
      <section className="contact-us-page-area py-130">
        <div className="container">
          <div className="row align-items-end justify-content-between">
            <div className="col-lg-7">
              <div className="contact-content rmb-65 wow fadeInRight delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">Contact Us</span>
                  <h2>{t("heading")}</h2>
                </div>
                <p>{t("secPara")}</p>
                <form onSubmit={(e) => e.preventDefault()} id="contactForm" className="contactForm z-1 rel">
                  <div className="row pt-15">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-control"
                          defaultValue=""
                          placeholder="Michael C. Coleman"
                          required=""
                          data-error="Please enter your name"
                        />
                        <div className="help-block with-errors" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-control"
                          defaultValue=""
                          placeholder="support@gmail.com"
                          required=""
                          data-error="Please enter your Email"
                        />
                        <div className="help-block with-errors" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="phone_number">Phone Number</label>
                        <input
                          type="text"
                          id="phone_number"
                          name="phone_number"
                          className="form-control"
                          defaultValue=""
                          placeholder="+000 (123) 456 88"
                        />
                      </div>
                    </div>
                    {/* <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="select_subject">
                          Select Requirments
                        </label>
                        <select name="select_subject" id="select_subject">
                          <option value="default" selected="">
                            Website customize
                          </option>
                          <option value="Design">Design</option>
                          <option value="Development">Development</option>
                          <option value="SEO">SEO</option>
                        </select>
                      </div>
                    </div> */}
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="message">Write Message</label>
                        <textarea
                          name="message"
                          id="message"
                          className="form-control"
                          rows={4}
                          placeholder="Write Message"
                          required=""
                          data-error="Please enter your Message"
                          defaultValue={""}
                        />
                        <div className="help-block with-errors" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group pt-5 mb-0">
                        <button type="submit" className="theme-btn w-100">
                          Send Message <i className="fas fa-angle-double-right" />
                        </button>
                        <div id="msgSubmit" className="hidden" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-xl-4 col-lg-5">
              <div className="contact-info wow fadeInLeft delay-0-2s">
                <div className="contact-info-item style-two">
                  <div className="icon">
                    <i className="fal fa-map-marker-alt" />
                  </div>
                  <div className="content">
                    <span className="title">Location</span>
                    <span className="text">Lot 5 Camp & Hadfield Streets, Georgetown, Guyana</span>
                  </div>
                </div>
                <div className="contact-info-item style-two">
                  <div className="icon">
                    <i className="far fa-envelope-open-text" />
                  </div>
                  <div className="content">
                    <span className="title">email address</span>
                    <span className="text">
                      <a href="mailto:support@wiscribbles.com">support@wiscribbles.com</a>
                      {/* <br />
                      <a href="mailto:websitebuilding.net">
                        websitebuilding.net
                      </a> */}
                    </span>
                  </div>
                </div>
                {/* <div className="contact-info-item style-two">
                  <div className="icon">
                    <i className="far fa-phone" />
                  </div>
                  <div className="content">
                    <span className="title">Phone Number</span>
                    <span className="text">
                      Call <a href="calto:+1(813)940-1599">+1 (813) 940-1599</a>
                      <br />
                    </span>
                  </div>
                </div> */}
                <div className="follow-us">
                  <h4>Follow Us</h4>
                  <div className="social-style-two">
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
                      <i className="fab fa-behance" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Contact Us Page Area end */}
      {/* Our Location Address Area start */}
      {/* <section className="our-location-address-area rel z-1">
        <div className="container">
          <div className="row medium-gap justify-content-center">
            <div className="col-lg-4 col-md-6">
              <div className="location-address-item wow fadeInUp delay-0-2s">
                <div className="top-part">
                  <img
                    src="/assets/images/contact/location1.png"
                    alt="Location"
                  />
                  <h5>New York</h5>
                </div>
                <div className="bottom-part">
                  <ul>
                    <li>
                      <i className="fal fa-map-marker-alt" /> 55 Main Street,
                      New York
                    </li>
                    <li>
                      <i className="far fa-envelope-open-text" />{" "}
                      support@gmail.com
                    </li>
                    <li>
                      <i className="far fa-phone" /> +000 (123) 456 88
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="location-address-item wow fadeInUp delay-0-4s">
                <div className="top-part">
                  <img
                    src="/assets/images/contact/location2.png"
                    alt="Location"
                  />
                  <h5>Australia Capital</h5>
                </div>
                <div className="bottom-part">
                  <ul>
                    <li>
                      <i className="fal fa-map-marker-alt" /> 55 Main Street,
                      New York
                    </li>
                    <li>
                      <i className="far fa-envelope-open-text" />{" "}
                      support@gmail.com
                    </li>
                    <li>
                      <i className="far fa-phone" /> +000 (123) 456 88
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="location-address-item wow fadeInUp delay-0-6s">
                <div className="top-part">
                  <img
                    src="/assets/images/contact/location3.png"
                    alt="Location"
                  />
                  <h5>South Africa</h5>
                </div>
                <div className="bottom-part">
                  <ul>
                    <li>
                      <i className="fal fa-map-marker-alt" /> 55 Main Street,
                      New York
                    </li>
                    <li>
                      <i className="far fa-envelope-open-text" />{" "}
                      support@gmail.com
                    </li>
                    <li>
                      <i className="far fa-phone" /> +000 (123) 456 88
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
      {/* Our Location Address Area end */}
      {/* Location Map Area Start */}
      <div className="contact-page-map wow fadeInUp delay-0-2s">
        <div className="our-location">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m12!1m10!1m3!1d142190.2862584524!2d-74.01298319978558!3d40.721725351435126!2m1!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sbd!4v1663473911885!5m2!1sen!2sbd"
            style={{ border: 0, width: "100%" }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      {/* Location Map Area End */}
    </Layout>
  );
};
export default Contact;

"use client";
import OxencyAccordion from "@/components/OxencyAccordion";
import ProgressBar from "@/components/ProgressBar";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
import { useState } from "react";
import { Accordion } from "react-bootstrap";
const faqsData = [
  {
    title: "Will you  provide website layout about design ?",
    dec: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam aperiam eaquey quae abillo inventore",
  },
  {
    title: "How much does cost to design website ?",
    dec: "Fortunately, we aren’t just designers and developers here we are writer strategists, techs and creatives working towards the same end goal our client’s success. As a full-service digital marketing agency",
  },
  {
    title: "How many revisions can i make the  design ?",
    dec: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam aperiam eaquey quae abillo inventore",
  },
  {
    title: "Can i uplode this  design in my personal work?",
    dec: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam aperiam eaquey quae abillo inventore",
  },
];
const ServicesDetails = () => {
  const [active, setActive] = useState(`collapse0`);
  const onClick = (value) => {
    setActive(value === active ? "" : value);
  };
  return (
    <Layout>
      <PageBanner
        titleHtml={`Web Design &amp; Develop<span>ment</span>`}
        titleText="Web Design & Development"
      />
      <section className="what-we-offer my-130 rel z-1">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-5 col-lg-6">
              <div className="what-we-offer-left mb-30 rmb-65 wow fadeInRight delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    What We Offer
                  </span>
                  <h2>
                    We are Affordable Website Design and Development agency
                  </h2>
                </div>
                <p>
                  25 Years Of Experience In Website Design &amp; Development
                </p>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn mt-15">
                    Learn More <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-xl-5 col-lg-6">
              <div className="what-we-offer-right wow fadeInLeft delay-0-2s">
                <p>
                  Web Design with your customer in mind. Modern web design is
                  more involved than creating an attractive website.
                  Consideration of user experience, search engine optimization,
                  ease of use, and technical details are just a few elements
                  that are involve.
                </p>
                <ul className="list-style-four pt-5">
                  <li>Responsive Website Design</li>
                  <li>User Experience Design</li>
                  <li>CMS and e-Commerce Integration</li>
                  <li>Website Content Strategy</li>
                  <li>Cross Browser and Platform Testing</li>
                  <li>Usability and Competition Analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* What We Offer Area end */}
      {/* Features Area start */}
      <section className="features-area-seven pb-100 rel z-1">
        <div className="container">
          <div className="row row-cols-xl-5 row-cols-md-3 row-cols-sm-2 row-cols-1 justify-content-center">
            <div className="col">
              <div className="feature-item-seven mt-30 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-idea" />
                </div>
                <h5>Make Strategy</h5>
                <p>
                  Define objective brand Plans, keyword research &amp;
                  positioning strategy.
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-item-seven color-two wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-graphic-design" />
                </div>
                <h5>Website Design</h5>
                <p>
                  We settle on some initial design drafts for website &amp;
                  choose one concept.
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-item-seven color-three mt-40 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-coding-2" />
                </div>
                <h5>Development</h5>
                <p>
                  To make the content, information architecture, visual design
                  all work
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-item-seven color-four wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-checklist" />
                </div>
                <h5>Project Testing</h5>
                <p>
                  Our team of experts are always available for any updates you
                  may need.
                </p>
              </div>
            </div>
            <div className="col">
              <div className="feature-item-seven color-five mt-40 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-goal" />
                </div>
                <h5>Project Lunch</h5>
                <p>
                  Sit amet conse adipies elitec eiusmod tempors sncidide sesy
                  labore
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Area end */}
      {/* What We Offer Two Area start */}
      <section className="what-we-offer-two mb-130 rel z-1">
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-6">
              <div className="what-we-offer-image rmb-65 wow fadeInRight delay-0-2s">
                <img
                  src="/assets/images/about/what-we-offer.png"
                  alt="What We Offer"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="what-we-offer-content wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    What We Offer
                  </span>
                  <h2>HTML, CSS &amp; WordPress Development</h2>
                </div>
                <p>
                  The easy-to-use, search engine friendly, flexible development
                  platform is currently used on over 35% of all websites.
                  WordPress provides a user friendly content mana gement system
                  (CMS), that allows you to easily make changes on the fly
                </p>
                <ul className="list-style-four pt-5 pb-30">
                  <li>Easy to edit &amp; Search engine friendly</li>
                  <li>Highly customizable</li>
                  <li>Most popular CMS in the world</li>
                </ul>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn mt-15">
                    Learn More <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* What We Offer Two Area end */}
      {/* Responsive Design Area start */}
      <section className="responsive-design-area mb-130 rel z-1">
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-6">
              <div className="responsive-design-content rmb-65 wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    Responsive Design
                  </span>
                  <h2>Design For Any Device Responsive Web Design</h2>
                </div>
                <p>
                  Responsive web design allows your website to adapt to and
                  provide an optimal experience on any device it’s being viewed
                  from. This means that your website will look great and
                  function flawlessly for a user on a desktop computer, laptop,
                  tablet, or smartphone
                </p>
                <ul className="list-style-four pt-5 pb-30">
                  <li>Mobile-friendly</li>
                  <li>Design for every device</li>
                  <li>Positive UX &amp; Helps SEO</li>
                </ul>
                <Link legacyBehavior href="/about">
                  <a className="theme-btn style-two mt-15">
                    Learn More <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="responsive-design-image wow fadeInRight delay-0-2s">
                <img
                  src="/assets/images/about/statistics-five.png"
                  alt="Responsive Design"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Responsive Design Area end */}
      {/* CTA Two Area start */}
      <section
        className="cta-two bgc-primary bgs-cover text-white py-75 rel z-1"
        style={{ backgroundImage: "url(/assets/images/background/cta-two.png)" }}
      >
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-5">
              <div className="cta-two-image rmb-65 wow fadeInRight delay-0-2s">
                <img src="/assets/images/about/cta.png" alt="CTA" />
              </div>
            </div>
            <div className="col-lg-7">
              <div className="cta-two-content-two wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <h2>Very Much 91.50% Increase in Organic Traffic</h2>
                </div>
                <p>
                  This lumber supplier started with wanting a new website. After
                  working with our team, {`they’ve`} now expanded their strategy
                  with us into several facets of digital marketing and have seen
                  optimal growth.
                </p>
                <Link legacyBehavior href="/contact">
                  <a className="theme-btn style-three white-btn mt-15">
                    Create Your Website{" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Two Area end */}
      {/* Support & Marketing Area start */}
      <section className="support-marketing-area py-130 rel z-1">
        <div className="container">
          <div className="row large-gap justify-content-between align-items-center">
            <div className="col-lg-6">
              <div className="support-marketing-progress rmb-65 wow fadeInUp delay-0-4s">
                <div className="section-title mb-35">
                  <span className="sub-title style-two mb-15">
                    Support &amp; Marketing
                  </span>
                  <h2>Marketing to Support Your Web Design</h2>
                </div>
                <p>
                  Fortunately, we aren’t just designers and developers here—we
                  are writers, strategists, techs and creatives, all working
                  towards the same end goal: our client’s success. As a
                  full-service digital marketing agency
                </p>
                <div className="circle-counter">
                  <div className="circle-progress-item">
                    <ProgressBar value={89} color="#3180fc" />
                    <h5>SEO Service</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={76} color="#f1b000" />
                    <h5>Copywriting</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={63} color="#16b4f2" />
                    <h5>PPC</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="support-marketing-list wow fadeInUp delay-0-2s">
                <ul className="list-style-one">
                  <li>
                    <div className="content">
                      <h5>SEO Services</h5>
                      <p>
                        If {`you're`} looking to command market your online you
                        need comprehensive SEO strategy
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>Copywriting</h5>
                      <p>
                        Amplify your brand and control the conversation with a
                        strategic content marketing strategy
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>Pay per click</h5>
                      <p>
                        PPC management is all about delivering the right ad to
                        your future customers at the exact
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Support & Marketing Area start */}
      {/* FAQs Area start */}
      <section className="faqs-area pb-130 rel z-1">
        <div className="container">
          <div className="row large-gap justify-content-between align-items-center">
            <div className="col-lg-6">
              <div className="faq-images rmb-65 rel">
                <div className="row">
                  <div className="col-6 col-small">
                    <img
                      className="image-one wow fadeInUp delay-0-2s"
                      src="/assets/images/faqs/faq1.jpg"
                      alt="FAQs"
                    />
                    <img
                      className="image-two wow fadeInUp delay-0-4s"
                      src="/assets/images/faqs/faq2.jpg"
                      alt="FAQs"
                    />
                  </div>
                  <div className="col-6 col-small">
                    <img
                      className="image-three mt-95 wow fadeInUp delay-0-6s"
                      src="/assets/images/faqs/faq3.jpg"
                      alt="FAQs"
                    />
                    <div className="year-of-experience wow zoomIn delay-0-6s">
                      <span className="number">25</span>
                      Years Of Web Experience
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="faq-content wow fadeInRight delay-0-2s">
                <div className="section-title mb-40">
                  <span className="sub-title style-two mb-15">Faqs</span>
                  <h2>Asked Questions about Website Design</h2>
                </div>
                <Accordion
                  defaultActiveKey="collapse0"
                  className="accordion"
                  id="faq-accordion"
                >
                  {faqsData.map((faq, i) => (
                    <OxencyAccordion
                      dec={faq.dec}
                      event={`collapse${i}`}
                      key={i}
                      title={faq.title}
                      onClick={() => onClick(`collapse${i}`)}
                      active={active}
                    />
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FAQs Area end */}
    </Layout>
  );
};
export default ServicesDetails;

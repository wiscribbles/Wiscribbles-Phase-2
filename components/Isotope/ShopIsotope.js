"use client";
import Isotope from "isotope-layout";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
const ShopIsotope = () => {
  // Isotope
  const isotope = useRef();
  const [filterKey, setFilterKey] = useState("*");
  useEffect(() => {
    setTimeout(() => {
      isotope.current = new Isotope(".shop-active", {
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
      <ul className="shop-filter justify-content-center filter-btns-one mb-30 wow fadeInUp delay-0-4s">
        <li
          data-filter="*"
          className={`c-pointer ${activeBtn("*")}`}
          onClick={handleFilterKeyChange("*")}
        >
          Show All
        </li>
        <li
          className={`c-pointer ${activeBtn("saas")}`}
          onClick={handleFilterKeyChange("saas")}
          data-filter=".saas"
        >
          Saas
        </li>
        <li
          className={`c-pointer ${activeBtn("plugin")}`}
          onClick={handleFilterKeyChange("plugin")}
          data-filter=".plugin"
        >
          Plugin
        </li>
        <li
          className={`c-pointer ${activeBtn("vectors")}`}
          onClick={handleFilterKeyChange("vectors")}
          data-filter=".vectors"
        >
          3D Vectors
        </li>
        <li
          className={`c-pointer ${activeBtn("ilustration")}`}
          onClick={handleFilterKeyChange("ilustration")}
          data-filter=".ilustration"
        >
          Ilustration
        </li>
        <li
          className={`c-pointer ${activeBtn("ui-kits")}`}
          onClick={handleFilterKeyChange("ui-kits")}
          data-filter=".ui-kits"
        >
          UI Kits
        </li>
        <li
          className={`c-pointer ${activeBtn("dashboard")}`}
          onClick={handleFilterKeyChange("dashboard")}
          data-filter=".dashboard"
        >
          Dashboard
        </li>
      </ul>
      <div className="row shop-active">
        <div className="col-xl-4 col-md-6 item plugin ilustration">
          <div className="product-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/shop/product1.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>CMS - Plugin for WordPress</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">29.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas ui-kits">
          <div className="product-item wow fadeInUp delay-0-4s">
            <div className="image">
              <img src="/assets/images/shop/product2.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>ISOMetric Illustration</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">58.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item vectors dashboard">
          <div className="product-item wow fadeInUp delay-0-6s">
            <div className="image">
              <img src="/assets/images/shop/product3.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>3D- Illustration For Crypto</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">37.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas ilustration">
          <div className="product-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/shop/product4.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>Online Shopping Plugin</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">29.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas vectors">
          <div className="product-item wow fadeInUp delay-0-4s">
            <div className="image">
              <img src="/assets/images/shop/product5.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>Fitness UI Kits</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">58.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item plugin ilustration ui-kits">
          <div className="product-item wow fadeInUp delay-0-6s">
            <div className="image">
              <img src="/assets/images/shop/product6.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>Dashboard UI Templates</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">37.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas dashboard">
          <div className="product-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/shop/product7.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>Travel Service Templates</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">29.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item plugin vectors">
          <div className="product-item wow fadeInUp delay-0-4s">
            <div className="image">
              <img src="/assets/images/shop/product8.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>Mountain Retro Illustration</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">58.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 item saas ui-kits dashboard">
          <div className="product-item wow fadeInUp delay-0-6s">
            <div className="image">
              <img src="/assets/images/shop/product9.jpg" alt="Product" />
            </div>
            <div className="content">
              <h5>African Animal Forest Design</h5>
              <div className="admin-ratting">
                <span className="admin">
                  By <a href="#">Webtend</a> in CMS
                </span>
                <div className="ratting">
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star" />
                  <i className="fas fa-star-half-alt" />
                  <span>(8.5k )</span>
                </div>
              </div>
              <div className="price-details-btn">
                <span className="price">37.55</span>
                <Link legacyBehavior href="/product-details">
                  <a className="theme-btn">
                    Details <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
export default ShopIsotope;

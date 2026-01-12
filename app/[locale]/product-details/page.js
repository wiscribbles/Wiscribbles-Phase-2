"use client";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
import { Nav, Tab } from "react-bootstrap";
const ProductDetails = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Product De<span>tails</span>`}
        titleText="Product Details"
      />
      <section className="product-details pt-130 rpt-100">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-6">
              <div className="product-details-images rmb-55 wow fadeInLeft delay-0-2s">
                <Tab.Container defaultActiveKey={"preview1"}>
                  <Tab.Content className="tab-content preview-images">
                    <Tab.Pane
                      className="tab-pane fade preview-item"
                      eventKey="preview1"
                    >
                      <img
                        src="/assets/images/shop/preview1.jpg"
                        alt="Perview"
                      />
                    </Tab.Pane>
                    <Tab.Pane
                      className="tab-pane fade preview-item"
                      eventKey="preview2"
                    >
                      <img
                        src="/assets/images/shop/preview1.jpg"
                        alt="Perview"
                      />
                    </Tab.Pane>
                    <Tab.Pane
                      className="tab-pane fade preview-item"
                      eventKey="preview3"
                    >
                      <img
                        src="/assets/images/shop/preview1.jpg"
                        alt="Perview"
                      />
                    </Tab.Pane>
                  </Tab.Content>
                  <Nav className="nav thumb-images rmb-20">
                    <Nav.Link
                      as="a"
                      eventKey={"preview1"}
                      href="#preview1"
                      data-bs-toggle="tab"
                      className="thumb-item"
                    >
                      <img src="/assets/images/shop/thumb1.jpg" alt="Thumb" />
                    </Nav.Link>
                    <Nav.Link
                      as="a"
                      eventKey={"preview2"}
                      href="#preview2"
                      data-bs-toggle="tab"
                      className="thumb-item"
                    >
                      <img src="/assets/images/shop/thumb2.jpg" alt="Thumb" />
                    </Nav.Link>
                    <Nav.Link
                      as="a"
                      eventKey={"preview3"}
                      href="#preview3"
                      data-bs-toggle="tab"
                      className="thumb-item"
                    >
                      <img src="/assets/images/shop/thumb3.jpg" alt="Thumb" />
                    </Nav.Link>
                  </Nav>
                </Tab.Container>
              </div>
            </div>
            <div className="col-xl-5 col-lg-6">
              <div className="product-details-content wow fadeInRight delay-0-2s">
                <div className="section-title">
                  <h2>3D Illustration Arts</h2>
                </div>
                <div className="ratting-price mb-30">
                  <div className="ratting">
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                  </div>
                  <span className="price">59.58</span>
                </div>
                <hr className="mb-25" />
                <p>
                  Doloremque laudantium, totam rem aperiam, eaque ipsa quae
                  abillo inventore veritatis quasi architecto beatae vitae dicta
                  sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
                  aspernatur aut odit aut fugit, sed quia consequuntur magni
                  dolores eos qui ratiluptatem sequi nesciunt porro quisquam
                  est, qui dolorem
                </p>
                <hr className="mt-65" />
                <ul className="category-tags pt-10 pb-15">
                  <li>
                    <b>Category</b>
                    <span>:</span>
                    <a href="#">Software</a>
                    <a href="#">Website</a>
                    <a href="#">Development</a>
                  </li>
                  <li>
                    <b>Tags</b>
                    <span>:</span>
                    <a href="#">3D</a>
                    <a href="#">Ilustration</a>
                    <a href="#">Arts</a>
                  </li>
                </ul>
                <hr />
                <form
                  onSubmit={(e) => e.preventDefault()}
                  action="#"
                  className="add-to-cart pt-15"
                >
                  <input
                    type="number"
                    defaultValue={1}
                    min={1}
                    max={20}
                    onchange="if(parseInt(this.value,10)<10)this.value='0'+this.value;"
                    required=""
                  />
                  <button type="submit" className="theme-btn">
                    Add to Cart
                  </button>
                  <button className="wishlist">
                    <i className="far fa-heart" />
                  </button>
                </form>
              </div>
            </div>
          </div>
          <Tab.Container defaultActiveKey={"details"}>
            <Nav className="nav product-information-tab mt-90 mb-40 wow fadeInUp delay-0-2s">
              <li>
                <Nav.Link as={"a"} eventKey={"details"} href="#details">
                  Descrptions
                </Nav.Link>
              </li>
              <li>
                <Nav.Link as={"a"} eventKey={"information"} href="#information">
                  Information
                </Nav.Link>
              </li>
            </Nav>
            <Tab.Content className="tab-content pb-30 wow fadeInUp delay-0-2s">
              <Tab.Pane className="tab-pane fade" eventKey="details">
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore verit atis et quasi architecto
                  beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem
                  quia voluptas sit aspernatur aut odit aut fugit, sed quia
                  consequuntur magni dolores eos qui ratione voluptatem sequi
                  nesciunt. Neque porro quisquam est, qui dolorem ipsum quia
                  dolor sit amet, consectetur, adipisci velit sed quia non
                  numquam eius modi tempora incidunt ut labore et dolore magnam
                  aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
                  nostrum exercitationem ullam corporis suscipit laboriosam,
                  nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum
                  iure reprehenderit qui in ea voluptate velit esse quam nihil
                  molestiae consequatur, vel illum qui dolorem eum
                </p>
              </Tab.Pane>
              <Tab.Pane className="tab-pane fade" eventKey="information">
                <p>
                  Now wherever you are, wherever you are, you can easily monitor
                  your CCTV videos through your mobile, tab, laptop or PC. With
                  the wireless camera, you can view the camera from your mobile
                  or computer to the right-left 0 to 360-degree video. Cover the
                  flower room with a camera.
                </p>
                <ul className="list-style-two my-15">
                  <li>Wide Angle and Long Length</li>
                  <li>Smart zooming point</li>
                  <li>HD quality video output.</li>
                  <li>Smart Alarming System</li>
                </ul>
                <p>
                  Neque porro quisquam est, qui dolorem ipsum quia dolor sit
                  amet, consectetur, adipisci velit, sed quia non numquam
                </p>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
      </section>
      {/* Product Details End */}
      {/* Review Form Start */}
      <section className="review-form-area mb-130 wow fadeInUp delay-0-2s">
        <div className="container">
          <form
            onSubmit={(e) => e.preventDefault()}
            id="review-form"
            className="review-form z-1 rel"
            name="review-form"
            action="#"
            method="post"
          >
            <h3>Leave Your Reviews</h3>
            <div className="ratting py-15">
              <b>Your Rating</b>
              <i className="fas fa-star" />
              <i className="fas fa-star" />
              <i className="fas fa-star" />
              <i className="fas fa-star" />
              <i className="fas fa-star" />
            </div>
            <div className="row mt-25">
              <div className="col-lg-4">
                <div className="form-group">
                  <input
                    type="text"
                    id="full-name"
                    name="full-name"
                    className="form-control"
                    defaultValue=""
                    placeholder="Full Name"
                    required=""
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <div className="form-group">
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="form-control"
                    defaultValue=""
                    placeholder="Phone Number"
                    required=""
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <div className="form-group">
                  <input
                    type="email"
                    id="email-address"
                    name="email"
                    className="form-control"
                    defaultValue=""
                    placeholder="Email Address"
                    required=""
                  />
                </div>
              </div>
              <div className="col-md-12 mb-30">
                <div className="form-group">
                  <select>
                    <option value="default" selected="">
                      Subject :
                    </option>
                    <option value="product">Product</option>
                    <option value="printing">Printing</option>
                    <option value="design">Design</option>
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <textarea
                    name="message"
                    id="message"
                    className="form-control"
                    rows={4}
                    placeholder="Write Message"
                    required=""
                    defaultValue={""}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group mb-0">
                  <button type="submit" className="theme-btn">
                    Send Reviews <i className="fas fa-angle-double-right" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
      {/* Review Form End */}
      {/* Related Products Area start */}
      <section className="related-products-area pb-80 rel z-1">
        <div className="container">
          <hr />
          <div className="section-title pt-110 text-center mb-50 wow fadeInUp delay-0-2s">
            <span className="sub-title style-two mb-15">Pre-made Template</span>
            <h2>Related Products</h2>
          </div>
          <div className="row">
            <div className="col-xl-4 col-md-6">
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
            <div className="col-xl-4 col-md-6">
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
            <div className="col-xl-4 col-md-6">
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
          </div>
        </div>
      </section>
      {/* Related Products Area end */}
    </Layout>
  );
};
export default ProductDetails;

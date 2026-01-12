"use client";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
import { useState } from "react";

const QuantityBtn = ({ defaultValue }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="quantity-input">
      <button
        className="quantity-down"
        onClick={() => setValue(value === 1 ? 1 : value - 1)}
      >
        -
      </button>
      <input className="quantity" type="text" value={value} name="quantity" />
      <button className="quantity-up" onClick={() => setValue(value + 1)}>
        +
      </button>
    </div>
  );
};

const Cart = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Shopping <span>Cart</span>`}
        titleText="Shopping Cart"
      />
      <section className="shopping-cart-area py-130 rel z-1">
        <div className="container">
          <div className="shoping-table mb-50 wow fadeInUp delay-0-2s">
            <table>
              <thead>
                <tr>
                  <th>Images</th>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>remove</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <img src="/assets/images/widget/news1.jpg" alt="Product" />
                  </td>
                  <td>
                    <span className="title">Fitness UI Kits</span>
                  </td>
                  <td>
                    <span className="price">70</span>
                  </td>
                  <td>
                    <QuantityBtn defaultValue={5} />
                  </td>
                  <td>
                    <b className="price">70</b>
                  </td>
                  <td>
                    <button type="button" className="close">
                      ×
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img src="/assets/images/widget/news2.jpg" alt="Product" />
                  </td>
                  <td>
                    <span className="title">Dashboard UI</span>
                  </td>
                  <td>
                    <span className="price">65</span>
                  </td>
                  <td>
                    <QuantityBtn defaultValue={2} />
                  </td>
                  <td>
                    <b className="price">130</b>
                  </td>
                  <td>
                    <button type="button" className="close">
                      ×
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img src="/assets/images/widget/news3.jpg" alt="Product" />
                  </td>
                  <td>
                    <span className="title">Plugin for WordPress</span>
                  </td>
                  <td>
                    <span className="price">80</span>
                  </td>
                  <td>
                    <QuantityBtn defaultValue={1} />
                  </td>
                  <td>
                    <b className="price">80</b>
                  </td>
                  <td>
                    <button type="button" className="close">
                      ×
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row text-center text-lg-left align-items-center">
            <div className="col-lg-6">
              <div className="discount-wrapper mb-30 wow fadeInLeft delay-0-2s">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  action="#"
                  className="d-sm-flex justify-content-center justify-content-lg-start"
                >
                  <input type="text" placeholder="Coupon Code" required="" />
                  <button className="theme-btn flex-none" type="submit">
                    apply Coupon <i className="fas fa-angle-double-right" />
                  </button>
                </form>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="update-shopping mb-30 text-lg-end wow fadeInRight delay-0-2s">
                <Link legacyBehavior href="/shop">
                  <a className="theme-btn style-two my-5 me-2">
                    shopping <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
                <Link legacyBehavior href="/shop">
                  <a className="theme-btn my-5">
                    update cart <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="shoping-cart-total pt-20 wow fadeInUp delay-0-2s">
                <h4 className="form-title mb-25 text-center">Cart Totals</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Cart Subtotal</td>
                      <td>
                        <span className="price">280</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Shipping Fee</td>
                      <td>
                        <span className="price">10.00</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Vat</td>
                      <td>$0.00</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Order Total</strong>
                      </td>
                      <td>
                        <b className="price">290</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <Link legacyBehavior href="/checkout">
                  <a className="theme-btn style-two mt-25 w-100">
                    Proceed to checkout
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Shopping Cart Area start */}
    </Layout>
  );
};
export default Cart;

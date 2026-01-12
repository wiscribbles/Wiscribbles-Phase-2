import Link from "next/link";
import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import useForm1store from "@/store/form1store";

const StepOne = ({ totalSteps }) => {
  const t = useTranslations();

  const { methods, getValidateStep } = useForm1store();

  const nextBtnRef = useRef(null);
  if (!methods) return;

  const {
    register,
    formState: { errors },
  } = methods;

  const nextHandler = async () => {
    // Validate only step 1 fields
    const validateStep = await getValidateStep(1); // Use the custom validateStep
    const { isValid, data } = await validateStep();

    if (!isValid) return;

    // Process the validated data
    const { referenceNumber, day, month, year } = data;

    const structuredData = {
      referenceNumber,
      date_signed: new Date(year, month - 1, day), // month is 0-indexed
    };

    console.log("structured data →", structuredData);

    // Proceed to next step
    nextBtnRef.current?.click();
  };

  return (
    <>
      <div
        className="multisteps-form__panel js-active" //// first step must always have this js-active class else stuff breaks
        style={{ minHeight: "100vh" }}
        data-animation="slideHorz"
      >
        <Link legacyBehavior href="/">
          <a>
            <img
              src="/assets/images/logos/logo.png"
              style={{ marginLeft: "20px", marginTop: "20px" }}
              alt={t("step1_logo_alt")}
              title={t("step1_logo_title")}
            />
          </a>
        </Link>
        <div className="wizard-forms" style={{ marginTop: "-100px" }}>
          <div className="inner pb-100 clearfix">
            <div className="wizard-title text-center">
              <h3>{t("step1_authenticate_title")}</h3>
              <p>{t("step1_authenticate_subtitle")}</p>
            </div>

            {/* Reference Number */}
            <div className="wizard-form-input">
              <label className="wizard-sub-text">
                {t("step1_reference_number_label")}
              </label>
              <input
                {...register("referenceNumber")}
                style={{ border: "2px solid #ddeef9", color: "#a4b8d4" }}
                type="text"
                name="referenceNumber"
                placeholder={t("step1_reference_number_placeholder")}
              />
              {errors.referenceNumber && (
                <p className="text-danger">{errors.referenceNumber.message}</p>
              )}
            </div>

            {/* Date Signed */}
            <div style={{ marginTop: "20px" }} className="wizard-form-input">
              <label className="wizard-sub-text">
                {t("step1_date_signed_label")}
              </label>
              <div className="d-flex gap-4">
                <div className="d-flex flex-column">
                  <input
                    {...register("day")}
                    style={{
                      width: "70px",
                      border: "2px solid #ddeef9",
                      color: "#a4b8d4",
                      padding: "10px",
                    }}
                    type="number"
                    min={1}
                    max={31}
                  />
                  {errors.day && (
                    <p className="text-danger">{errors.day.message}</p>
                  )}
                </div>
                <h1>/</h1>
                <div className="d-flex flex-column">
                  <input
                    {...register("month")}
                    style={{
                      width: "70px",
                      border: "2px solid #ddeef9",
                      color: "#a4b8d4",
                      padding: "10px",
                    }}
                    type="number"
                    min={1}
                    max={12}
                  />
                  {errors.month && (
                    <p className="text-danger">{errors.month.message}</p>
                  )}
                </div>
                <h1>/</h1>
                <div className="d-flex flex-column">
                  <input
                    {...register("year")}
                    style={{
                      width: "90px",
                      border: "2px solid #ddeef9",
                      color: "#a4b8d4",
                      padding: "10px",
                    }}
                    type="number"
                    min={1900}
                  />
                  {errors.year && (
                    <p className="text-danger">{errors.year.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Found Documents */}
            <div className="wizard-form-input my-4">
              <h6
                className="wizard-sub-text"
                style={{ marginTop: "30px", marginBottom: "-5px" }}
              >
                {t("step1_found_documents_title")}
              </h6>

              <span className="w-service-box text-center d-flex flex-column justify-content-center align-items-center position-relative">
                <span
                  className="tooltip-info"
                  data-toggle="tooltip"
                  data-placement="top"
                  title={t("step1_service_officer_tooltip")}
                ></span>

                <span className="service-icon">
                  <img
                    src={"/assets/images /scale.png"}
                    alt={t("step1_scale_image_alt")}
                  />
                </span>
                <h4>{t("step1_power_of_attorney_text")}</h4>
              </span>
            </div>

            {/* Wizard Progress */}
            <div className="wizard-v3-progress">
              <span>
                1 {t("progress_step_text1")} {totalSteps}{" "}
                {t("progress_step_text2")}
              </span>
              <h3>
                {totalSteps == 3 ? "33%" : "20%"} {t("progress_step_text3")}
              </h3>
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: totalSteps == 3 ? "33%" : "20%" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="actions">
            <ul>
              <li>
                <span
                  style={{ backgroundColor: "#09123A" }}
                  title={t("step1_next_button_title")}
                  onClick={nextHandler}
                >
                  {t("step1_download_button_text")}{" "}
                  <i className="fa fa-arrow-right"></i>
                </span>
              </li>
              <button
                ref={nextBtnRef}
                className="js-btn-next"
                style={{ display: "none" }}
                type="button"
              />
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepOne;

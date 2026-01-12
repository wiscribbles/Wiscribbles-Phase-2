import { useState, useEffect, useRef } from "react";

const LangSwitcher = ({ locale, type }) => {
  const [padding, setPadding] = useState("0rem 30px 0 30px");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Adjust padding responsively
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth > 1250) {
        setPadding("0 30px 0 30px");
      } else if (windowWidth > 500) {
        setPadding("0 20px 0 20px");
      } else {
        setPadding("0 15px 0 0");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const icon =
    type === "dark"
      ? "/assets/images/lang-dark.png"
      : "/assets/images/lang-light.png";

  const handleLanguageChange = (newLocale) => {
    // Here you can add any additional logic before switching the language
    window.location.pathname = `/${newLocale}${window.location.pathname.substring(3)}`;
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", margin: padding }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={icon}
          alt="Language Icon"
          style={{ width: "40px", height: "auto" }}
        />
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "45px",
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => handleLanguageChange("en")}
            style={{
              display: "block",
              width: "100%",
              border: "none",
              background: "transparent",
              padding: "10px 20px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange("es")}
            style={{
              display: "block",
              width: "100%",
              border: "none",
              background: "transparent",
              padding: "10px 20px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Español
          </button>
        </div>
      )}
    </div>
  );
};

export default LangSwitcher;

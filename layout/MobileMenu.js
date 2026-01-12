import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Accordion, ListGroup, ListGroupItem, Nav } from "react-bootstrap";
import LangSwitcher from "@/components/LangSwitch";
import { usePathname } from "next/navigation";
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Box, 
  Typography,
  IconButton,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
const MobileMenu = ({ logo }) => {
  const [activeMenu, setActiveMenu] = useState("");
  const [multiMenu, setMultiMenu] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const accordionRef = useRef(null);
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const sidebarLinks = [
    { href: "/en/how-it-works", labelKey: "how_it_works" },
    { href: "/en/about", labelKey: "about" },
    { href: "/en/signUp", labelKey: "sign-up" },
    { href: "/en/signIn", labelKey: "login" },
    { href: "/en/contact", labelKey: "bottom" },
  ];

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && accordionRef.current && !accordionRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Original Header */}
    <nav className="main-menu navbar-expand-lg d-block d-lg-none mobile-header">
        <div className="navbar-header d-flex justify-content-between align-items-center">
          <div className="mobile-logo my-15">
            <Link legacyBehavior href="/en">
              <a>
                <img
                  src={logo ? logo : "/assets/images/logos/logo.png"}
                  alt="Logo"
                  title="Logo"
                />
              </a>
            </Link>
          </div>
          
          
          <div className="mobile-header-controls d-flex align-items-center">
  {/* Language Selector */}
  

          {/* Toggle Button */}
  <button
            className="navbar-toggle"
    onClick={handleToggleClick}

    style={{
      background: 'none',
      border: 'none',
      padding: '10px',
      cursor: 'pointer',
      marginRight: '15px'
    }}
          >
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
  </button>
</div>

        </div>
      </nav>

      {/* MUI Drawer */}
      <Drawer
        anchor="right"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            background: 'linear-gradient(135deg, #416976 0%, #2c4a5a 100%)',
            color: '#FFFFFF',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header with close button and logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative'
          }}>
            <IconButton 
              onClick={() => setIsMenuOpen(false)}
              sx={{ 
                position: 'absolute',
                left: 0,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={logo ? logo : "/assets/images/logos/logo.png"}
                alt="Logo"
                style={{
                  height: 40,
                  width: 'auto',
                  maxWidth: 120,
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </Box>
          </Box>

          {/* Main Navigation */}
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/en" 
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }
                }}
              >
                <ListItemText primary={t("navbar.home")} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/en/solutions" 
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }
                }}
              >
                <ListItemText primary={t("navbar.solutions")} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/en/form-step1" 
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }
                }}
              >
                <ListItemText primary={t("navbar.standard")} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/en/form-step1" 
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }
                }}
              >
                <ListItemText primary={t("navbar.authenticate")} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                href="/en/help-desk" 
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  }
                }}
              >
                <ListItemText primary={t("navbar.help")} />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Additional sidebar links */}
          <List>
            {sidebarLinks.map((link, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton 
                  component={Link} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  sx={{
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                    }
                  }}
                >
                  <ListItemText primary={t("sidebar." + link.labelKey)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <style jsx>{`
        .mobile-header {
          position: relative;
          z-index: 1000;
        }
        
        .navbar-header {
          display: flex !important;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          min-height: 50px;
          padding: 10px 0;
        }
        
        .mobile-header-controls {
          display: flex !important;
          align-items: center;
          gap: 15px;
        }
        
        .mobile-header-lang-switcher {
          display: flex;
          align-items: center;
        }
        
        .mobile-header-lang-switcher :global(button) {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
        }
        
        .mobile-header-lang-switcher :global(button:hover) {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: scale(1.05) !important;
        }
        
        .mobile-header-lang-switcher :global(img) {
          width: 24px !important;
          height: 24px !important;
          filter: brightness(0) invert(1) !important;
        }
        
        .navbar-toggle {
          display: flex !important;
          flex-direction: column;
          justify-content: space-around;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          padding: 8px;
          position: relative;
          z-index: 1001;
          transition: all 0.3s ease;
        }
        
        .navbar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.05);
        }
        
        .navbar-toggle .icon-bar {
          width: 25px;
          height: 3px;
          background-color: #fff !important;
          margin: 2px 0;
          transition: 0.3s;
          border-radius: 2px;
          display: block !important;
          opacity: 1 !important;
          box-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(1),
        .navbar-toggle.open .icon-bar:nth-child(1) {
          transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(2),
        .navbar-toggle.open .icon-bar:nth-child(2) {
          opacity: 0;
        }
        
        .navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(3),
        .navbar-toggle.open .icon-bar:nth-child(3) {
          transform: rotate(45deg) translate(-5px, -6px);
        }
        
      `}</style>
    </>
  );
};
export default MobileMenu;

'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Logo = ({ 
  variant = 'dark',  // 'dark', 'light', 'sm'
  size = 'default',  // 'small', 'default', 'large'
  linkTo = '/',
  className = '',
  style = {}
}) => {
  // Define logo paths based on variant
  const logoSources = {
    dark: '/assets/images/logos/logo.png',
    light: '/assets/images/logos/logo-white.png',
    'dark-2': '/assets/images/logos/logo.png',
    'light-2': '/assets/images/logos/logo-white.png',
    'sm': '/assets/images/logos/logo-white.png',
    'sm-light': '/assets/images/logos/logo-white.png'
  };

  // Define sizes for different screen sizes
  const sizes = {
    small: {
      height: 50,
      width: 'auto',
      mobileHeight: 40
    },
    default: {
      height: 70,
      width: 'auto', 
      mobileHeight: 55
    },
    large: {
      height: 90,
      width: 'auto',
      mobileHeight: 70
    }
  };

  const logoSrc = logoSources[variant] || logoSources.dark;
  const sizeConfig = sizes[size] || sizes.default;

  const logoStyle = {
    height: sizeConfig.height + 'px',
    width: 'auto',
    objectFit: 'contain',
    maxWidth: '100%',
    ...style
  };

  // Responsive styles for mobile
  const responsiveStyle = {
    '@media (max-width: 768px)': {
      height: sizeConfig.mobileHeight + 'px'
    }
  };

  const LogoImage = () => (
    <img
      src={logoSrc}
      alt="WiScribble Logo"
      title="WiScribble - Document Management System"
      style={logoStyle}
      className={`logo-image ${className}`}
      loading="eager"
    />
  );

  // Add CSS for responsive behavior
  React.useEffect(() => {
    // Add responsive styles
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .logo-image {
          height: ${sizeConfig.mobileHeight}px !important;
        }
      }
      
      @media (max-width: 480px) {
        .logo-image {
          height: ${Math.max(sizeConfig.mobileHeight - 10, 30)}px !important;
        }
      }

      /* Optimize image rendering */
      .logo-image {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [sizeConfig]);

  if (linkTo) {
    return (
      <Link legacyBehavior href={linkTo}>
        <a className="logo-link d-inline-block">
          <LogoImage />
        </a>
      </Link>
    );
  }

  return <LogoImage />;
};

export default Logo;

"use client";

import { useEffect } from 'react';

export default function ResponsiveLayout() {
  const adjustLayout = () => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const content = document.querySelector('.page-content');
    
    if (header && footer && content) {
      const headerHeight = header.getBoundingClientRect().height;
      const footerHeight = footer.getBoundingClientRect().height;
      
      (content as HTMLElement).style.paddingTop = `${headerHeight}px`;
      (content as HTMLElement).style.paddingBottom = `${footerHeight}px`;
    }
  };

  useEffect(() => {
    adjustLayout();
    window.addEventListener('resize', adjustLayout);
    
    const observer = new MutationObserver(() => {
      setTimeout(adjustLayout, 100);
    });
    
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    if (header && footer) {
      observer.observe(header, { subtree: true, childList: true, attributes: true });
      observer.observe(footer, { subtree: true, childList: true, attributes: true });
    }
    
    return () => {
      window.removeEventListener('resize', adjustLayout);
      observer.disconnect();
    };
  }, []);
  
  return null;
}
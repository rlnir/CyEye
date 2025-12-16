// Content script to inject floating button on Cymulate pages
(function() {
  'use strict';

  let floatingButton = null;
  let floatingWindow = null;
  let isButtonVisible = false;
  let isWindowVisible = false;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // Create floating button
  function createFloatingButton() {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.id = 'cyviewer-floating-btn';
    
    // Create white circle background
    const whiteCircle = document.createElement('div');
    whiteCircle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      z-index: 1;
    `;
    
    // Create info "i" text
    const infoText = document.createElement('span');
    infoText.textContent = 'i';
    infoText.style.cssText = `
      color: #6366f1;
      font-size: 20px;
      font-weight: 700;
      font-style: normal;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 2;
      position: relative;
    `;
    
    floatingButton.appendChild(whiteCircle);
    floatingButton.appendChild(infoText);
    floatingButton.title = 'Open CyViewer';
    
    // Apply all styles inline to ensure visibility
    Object.assign(floatingButton.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 25%, #3b82f6 50%, #ec4899 75%, #8b5cf6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '999999',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease',
      userSelect: 'none',
      border: '3px solid white',
      outline: 'none',
      overflow: 'visible',
      visibility: 'visible',
      opacity: '1',
      pointerEvents: 'auto'
    });
    
    // Try to apply conic-gradient if supported (will override linear-gradient)
    try {
      floatingButton.style.background = 'conic-gradient(from 135deg, #8b5cf6 0deg, #6366f1 90deg, #3b82f6 180deg, #ec4899 270deg, #8b5cf6 360deg)';
    } catch (e) {
      // Fallback to linear-gradient already set
    }

    // Hover effects
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.transform = 'scale(1.1)';
      floatingButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    });

    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.transform = 'scale(1)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    // Click handler
    floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('CyViewer: Floating button clicked');
      toggleFloatingWindow();
    });

    document.body.appendChild(floatingButton);
    isButtonVisible = true;
    console.log('CyViewer: Floating button created and appended to body', floatingButton);
  }
  
  // Create draggable floating window
  function createFloatingWindow() {
    if (floatingWindow) return;
    
    const currentUrl = window.location.href;
    
    floatingWindow = document.createElement('div');
    floatingWindow.id = 'cyviewer-floating-window';
    
    // Create header for dragging
    const header = document.createElement('div');
    header.id = 'cyviewer-window-header';
    header.innerHTML = `
      <span class="cyviewer-window-title">Cy Eye</span>
      <button class="cyviewer-close-btn" title="Close">×</button>
    `;
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.id = 'cyviewer-window-content';
    
    floatingWindow.appendChild(header);
    floatingWindow.appendChild(contentContainer);
    
    // Style the window
    Object.assign(floatingWindow.style, {
      position: 'fixed',
      width: '650px',
      height: '600px',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: '9999999',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid #ddd',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    
    // Style the header
    Object.assign(header.style, {
      backgroundColor: '#4a90e2',
      color: 'white',
      padding: '10px 15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'move',
      userSelect: 'none',
      borderRadius: '8px 8px 0 0'
    });
    
    // Style the title
    const title = header.querySelector('.cyviewer-window-title');
    Object.assign(title.style, {
      fontWeight: '600',
      fontSize: '14px'
    });
    
    // Style the close button
    const closeBtn = header.querySelector('.cyviewer-close-btn');
    Object.assign(closeBtn.style, {
      background: 'transparent',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: '1',
      borderRadius: '4px',
      transition: 'background 0.2s'
    });
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFloatingWindow();
    });
    
    // Style the content container
    Object.assign(contentContainer.style, {
      flex: '1',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#f5f5f5',
      position: 'relative'
    });
    
    // Load popup content
    loadPopupContent(contentContainer, currentUrl);
    
    // Drag functionality
    header.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn) return;
      
      isDragging = true;
      const rect = floatingWindow.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
      
      e.preventDefault();
    });
    
    function handleDrag(e) {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // Keep window within viewport
      const maxX = window.innerWidth - floatingWindow.offsetWidth;
      const maxY = window.innerHeight - floatingWindow.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(x, maxX));
      const constrainedY = Math.max(0, Math.min(y, maxY));
      
      floatingWindow.style.left = constrainedX + 'px';
      floatingWindow.style.top = constrainedY + 'px';
      floatingWindow.style.transform = 'none';
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    }
    
    document.body.appendChild(floatingWindow);
    isWindowVisible = true;
  }
  
  // Load popup content into container
  function loadPopupContent(container, currentUrl) {
    const popupUrl = chrome.runtime.getURL(`popup.html?tabUrl=${encodeURIComponent(currentUrl)}`);
    
    // Use iframe - it should work with web_accessible_resources
    const iframe = document.createElement('iframe');
    iframe.id = 'cyviewer-window-iframe';
    iframe.src = popupUrl;
    // Make iframe flush to the container (avoid baseline/inline gaps)
    iframe.style.cssText = 'width: 100%; height: 100%; border: none; background: #f5f5f5; display: block; margin: 0; padding: 0;';
    
    // Set iframe attributes for better compatibility
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
    iframe.setAttribute('loading', 'eager');
    
    // Handle load events
    iframe.onload = () => {
      console.log('CyViewer: Iframe loaded successfully');
    };
    
    iframe.onerror = (err) => {
      console.error('CyViewer: Iframe load error:', err);
      showIframeError(container);
    };
    
    // Timeout fallback in case iframe doesn't load
    setTimeout(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc || !iframeDoc.body || iframeDoc.body.children.length === 0) {
          console.warn('CyViewer: Iframe appears empty, may be blocked by CSP');
          // Don't show error immediately, give it more time
        }
      } catch (e) {
        // Cross-origin or CSP blocking - this is expected and OK
        console.log('CyViewer: Cannot access iframe content (expected with extension origin)');
      }
    }, 2000);
    
    container.appendChild(iframe);
  }
  
  // Show error message if iframe fails to load
  function showIframeError(container) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #333;">
        <p style="color: #dc3545; font-size: 16px; margin-bottom: 10px;">Unable to load content</p>
        <p style="color: #666; font-size: 13px; margin-bottom: 20px;">The page may be blocking iframe content.</p>
        <p style="color: #666; font-size: 12px;">Please use the extension icon in the toolbar to open CyViewer.</p>
      </div>
    `;
  }
  
  // Remove floating window
  function removeFloatingWindow() {
    if (floatingWindow && floatingWindow.parentNode) {
      floatingWindow.parentNode.removeChild(floatingWindow);
      floatingWindow = null;
      isWindowVisible = false;
    }
  }
  
  // Toggle floating window
  function toggleFloatingWindow() {
    if (isWindowVisible) {
      removeFloatingWindow();
    } else {
      createFloatingWindow();
    }
  }

  // Remove floating button
  function removeFloatingButton() {
    if (floatingButton && floatingButton.parentNode) {
      floatingButton.parentNode.removeChild(floatingButton);
      floatingButton = null;
      isButtonVisible = false;
    }
  }

  // Check if floating button should be visible
  function updateFloatingButton() {
    chrome.storage.sync.get(['showFloatingButton'], (result) => {
      const shouldShow = result.showFloatingButton !== false; // Default to true
      
      if (shouldShow && !isButtonVisible) {
        createFloatingButton();
      } else if (!shouldShow && isButtonVisible) {
        removeFloatingButton();
      }
    });
  }

  // Wait for body to exist
  function waitForBody(callback) {
    if (document.body) {
      callback();
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
          obs.disconnect();
          callback();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  // Initialize
  waitForBody(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateFloatingButton);
    } else {
      updateFloatingButton();
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.showFloatingButton) {
      updateFloatingButton();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateFloatingButton') {
      if (request.show) {
        createFloatingButton();
      } else {
        removeFloatingButton();
        removeFloatingWindow(); // Also close window if button is hidden
      }
      sendResponse({ success: true });
    } else if (request.action === 'toggleFloatingWindow') {
      toggleFloatingWindow();
      sendResponse({ success: true });
    }
  });
})();


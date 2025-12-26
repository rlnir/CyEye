// Get DOM elements
const envUrl = document.getElementById('env-url');
const refreshBtn = document.getElementById('refresh-btn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const dataContainer = document.getElementById('data-container');
const clientInfo = document.getElementById('client-info');
const usersInfo = document.getElementById('users-info');
const agentsInfo = document.getElementById('agents-info');
const tokenInfo = document.getElementById('token-info');
const settingsInfo = document.getElementById('settings-info');
const environmentsInfo = document.getElementById('environments-info');
const integrationsInfo = document.getElementById('integrations-info');

// Format value for display
function formatValue(value) {
  if (value === null || value === undefined) {
    return '<span class="info-value null-value">N/A</span>';
  }
  if (typeof value === 'boolean') {
    return `<span class="info-value boolean-${value}">${value}</span>`;
  }
  if (typeof value === 'object') {
    return `<span class="info-value">${JSON.stringify(value, null, 2)}</span>`;
  }
  if (Array.isArray(value)) {
    return `<span class="info-value">${value.length} items</span>`;
  }
  return `<span class="info-value">${String(value)}</span>`;
}

// Copy to clipboard function
async function copyToClipboard(text, buttonElement) {
  try {
    await navigator.clipboard.writeText(text);
    
    // Visual feedback
    const originalText = buttonElement.textContent;
    buttonElement.textContent = '✓';
    buttonElement.classList.add('copied');
    
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      buttonElement.textContent = '✓';
      buttonElement.classList.add('copied');
      setTimeout(() => {
        buttonElement.textContent = '📋';
        buttonElement.classList.remove('copied');
      }, 2000);
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
    }
    document.body.removeChild(textArea);
  }
}

// Create info item with copy button
function createInfoItem(label, value, options = {}) {
  const { copyable = true } = options;
  const item = document.createElement('div');
  item.className = 'info-item';
  
  const valueContainer = document.createElement('div');
  valueContainer.className = 'info-value-container';
  
  const valueElement = document.createElement('div');
  valueElement.innerHTML = formatValue(value);
  
  valueContainer.appendChild(valueElement);
  if (copyable) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-btn';
    copyButton.textContent = '📋';
    copyButton.title = 'Copy to clipboard';
    copyButton.setAttribute('aria-label', `Copy ${label} to clipboard`);
    
    const valueText = value !== null && value !== undefined ? String(value) : '';
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (valueText) {
        copyToClipboard(valueText, copyButton);
      }
    });
    
    valueContainer.appendChild(copyButton);
  }
  
  item.innerHTML = `<div class="info-label">${label}:</div>`;
  item.appendChild(valueContainer);
  
  return item;
}

// Get admin URL for current environment
function getAdminUrl(baseUrl, clientID) {
  const adminConfig = {
    'https://eksstgapp.cymulatedev.com': {
      adminUrl: 'https://eksstgadmin.cymulatedev.com',
      tenantId: 'default'
    },
    'https://eksstgapptenant.cymulatedev.com': {
      adminUrl: 'https://eksstgadmin.cymulatedev.com',
      tenantId: '77e60fba-7ba4-4a1c-b3b8-d498bda90b14'
    },
    'https://rfqa-app.cymulatedev.com': {
      adminUrl: 'https://rfqa-admin.cymulatedev.com',
      tenantId: 'default'
    },
    'https://rfqa-tenant-app.cymulatedev.com': {
      adminUrl: 'https://rfqa-admin.cymulatedev.com',
      tenantId: 'c09cd855-db16-4cf8-8f43-41d4b84d773b'
    },
    'https://app.cymulate.com': {
      adminUrl: 'https://admin.cymulate.com',
      tenantId: 'default'
    },
    'https://us.cymulate.com': {
      adminUrl: 'https://us-admin.cymulate.com',
      tenantId: 'default'
    }
  };
  
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const config = adminConfig[normalizedUrl];
  
  if (!config || !clientID) {
    return null;
  }
  
  return `${config.adminUrl}/client/${clientID}?tid=${config.tenantId}`;
}

// Display client information
function displayClientInfo(data, baseUrl) {
  clientInfo.innerHTML = '';
  
  const clientData = data.clientID || {};
  const clientID = clientData._id || clientData.id;
  
  const clientFields = [
    { label: 'Client ID', value: clientID },
    { label: 'Client Name', value: clientData.name },
  ];

  clientFields.forEach(field => {
    if (field.value !== undefined && field.value !== null) {
      clientInfo.appendChild(createInfoItem(field.label, field.value));
    }
  });
  
  // Add admin link if available
  if (baseUrl && clientID) {
    const adminUrl = getAdminUrl(baseUrl, clientID);
    if (adminUrl) {
      const adminLinkItem = document.createElement('div');
      adminLinkItem.className = 'info-item';
      
      const adminLink = document.createElement('a');
      adminLink.href = adminUrl;
      adminLink.target = '_blank';
      adminLink.rel = 'noopener noreferrer';
      adminLink.className = 'admin-link';
      adminLink.textContent = 'Open in Admin';
      adminLink.title = adminUrl;
      
      const label = document.createElement('div');
      label.className = 'info-label';
      label.textContent = 'Admin Link:';
      
      const valueContainer = document.createElement('div');
      valueContainer.className = 'info-value-container';
      valueContainer.appendChild(adminLink);
      
      adminLinkItem.appendChild(label);
      adminLinkItem.appendChild(valueContainer);
      clientInfo.appendChild(adminLinkItem);
    }
  }
}

// Display user permissions
function displayUserPermissions(permissionsData, currentClientID, loggedInUserEmail, loggedInUserName) {
  usersInfo.innerHTML = '';

  if (!permissionsData || Object.keys(permissionsData).length === 0) {
    usersInfo.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">No user permissions found</p>';
    return;
  }

  // Find users for the current client
  let currentClientUsers = [];
  
  for (const clientKey in permissionsData) {
    if (permissionsData.hasOwnProperty(clientKey)) {
      const clientData = permissionsData[clientKey];
      const clientID = clientData.clientID?._id || clientData.clientID;
      
      // Match by clientID
      if (clientID === currentClientID) {
        currentClientUsers = clientData.users || [];
        break;
      }
    }
  }

  if (currentClientUsers.length === 0 && !loggedInUserEmail) {
    usersInfo.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">No users found for current client</p>';
    return;
  }

  // Create table
  const table = document.createElement('table');
  table.className = 'users-table';
  
  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Name / Email</th>
    <th>Status</th>
    <th>Role</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Add logged-in user first if they exist and aren't already in the list
  if (loggedInUserEmail) {
    const loggedInUserInList = currentClientUsers.find(user => 
      (user.email || '').toLowerCase() === loggedInUserEmail.toLowerCase()
    );
    
    if (!loggedInUserInList) {
      // Add logged-in user as first row
      const row = document.createElement('tr');
      row.className = 'logged-in-user';
      const userName = loggedInUserName || 'N/A';
      const userStatus = 'N/A';
      const userRole = 'N/A';
      
      row.innerHTML = `
        <td>
          <div class="name-email-cell">
            <div class="name-email-content">
              <div class="user-name">
                ${userName}
                <span class="logged-in-badge">Logged In</span>
              </div>
              <div class="email-cell">
                <span class="email-text">${loggedInUserEmail}</span>
                <button class="copy-btn table-copy-btn" title="Copy email" data-email="${loggedInUserEmail}">📋</button>
              </div>
            </div>
          </div>
        </td>
        <td><span class="status-badge status-n-a">${userStatus}</span></td>
        <td><span class="role-badge">${userRole}</span></td>
      `;
      
      // Add event listener for copy button
      const copyButton = row.querySelector('.table-copy-btn');
      if (copyButton) {
        copyButton.addEventListener('click', (e) => {
          e.stopPropagation();
          copyToClipboard(loggedInUserEmail, copyButton);
        });
      }
      
      tbody.appendChild(row);
    }
  }
  
  // Add all other users
  currentClientUsers.forEach(user => {
    const row = document.createElement('tr');
    const userName = user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'N/A';
    const userEmail = user.email || 'N/A';
    const userStatus = user.liscenceStatus || user.status || 'N/A';
    const userRole = user.role || 'N/A';
    
    // Highlight logged-in user if they're in the list
    if (loggedInUserEmail && (userEmail || '').toLowerCase() === loggedInUserEmail.toLowerCase()) {
      row.className = 'logged-in-user';
    }
    
    // Format status for CSS class
    const statusClass = userStatus.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const isLoggedIn = loggedInUserEmail && (userEmail || '').toLowerCase() === loggedInUserEmail.toLowerCase();
    
    row.innerHTML = `
      <td>
        <div class="name-email-cell">
          <div class="name-email-content">
            <div class="user-name">
              ${userName}
              ${isLoggedIn ? '<span class="logged-in-badge">Logged In</span>' : ''}
            </div>
            <div class="email-cell">
              <span class="email-text">${userEmail}</span>
              <button class="copy-btn table-copy-btn" title="Copy email" data-email="${userEmail}">📋</button>
            </div>
          </div>
        </div>
      </td>
      <td><span class="status-badge status-${statusClass}">${userStatus}</span></td>
      <td><span class="role-badge">${userRole}</span></td>
    `;
    
    // Add event listener for copy button
    const copyButton = row.querySelector('.table-copy-btn');
    if (copyButton) {
      copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(userEmail, copyButton);
      });
    }
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  usersInfo.appendChild(table);
}

// Display token information
function displayToken(tokenData) {
  tokenInfo.innerHTML = '';
  
  if (!tokenData || !tokenData.data || !tokenData.data.token) {
    tokenInfo.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">No token found</p>';
    return;
  }

  const token = tokenData.data.token;
  const expirationTime = tokenData.data.expirationTimeDisplay || tokenData.data.expirationTime || 'N/A';

  if (token !== undefined && token !== null) {
    tokenInfo.appendChild(createInfoItem('Token', token));
  }

  if (expirationTime !== undefined && expirationTime !== null) {
    // Intentionally non-copyable (per request)
    tokenInfo.appendChild(createInfoItem('Expiration Time', expirationTime, { copyable: false }));
  }
}

// Display agents
function displayAgents(agentsData) {
  agentsInfo.innerHTML = '';
  
  if (!agentsData || !agentsData.data || !agentsData.data.agents || agentsData.data.agents.length === 0) {
    agentsInfo.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">No agents found</p>';
    return;
  }

  const agents = agentsData.data.agents;
  
  // Helper function to compare version strings (e.g., "7.304.650.307" or "6.62.603.0")
  // Returns: -1 if version1 < version2 (needs update), 0 if equal, 1 if version1 > version2, null if invalid
  function compareVersions(version1, version2) {
    if (!version1 || !version2) {
      console.warn('Missing version for comparison:', { version1, version2 });
      return null;
    }
    
    // Convert to strings to ensure we're working with strings
    const v1Str = String(version1).trim();
    const v2Str = String(version2).trim();
    
    if (!v1Str || !v2Str) return null;
    
    try {
      const v1Parts = v1Str.split('.').map(part => {
        const num = Number(part);
        return isNaN(num) ? null : num;
      });
      const v2Parts = v2Str.split('.').map(part => {
        const num = Number(part);
        return isNaN(num) ? null : num;
      });
      
      // Validate that all parts are valid numbers
      if (v1Parts.some(part => part === null) || v2Parts.some(part => part === null)) {
        console.warn('Invalid version format:', v1Str, v2Str);
        return null;
      }
      
      const maxLength = Math.max(v1Parts.length, v2Parts.length);
      
      for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i] ?? 0;
        const v2Part = v2Parts[i] ?? 0;
        
        if (v1Part > v2Part) return 1;  // version1 is newer
        if (v1Part < v2Part) return -1; // version1 is older (needs update)
      }
      
      return 0; // Versions are equal
    } catch (error) {
      console.error('Error comparing versions:', error, { version1: v1Str, version2: v2Str });
      return null;
    }
  }
  
  agents.forEach(agent => {
    const agentItem = document.createElement('div');
    agentItem.className = 'agent-item';
    
    // Agent connection status
    const agentStatusClass = agent.connected ? 'connected' : 'disconnected';
    const agentStatusText = agent.connected ? 'Connected' : 'Disconnected';
    
    // Version comparison and warning
    // Warning should appear when agent.version < agent.lastVersion (agent needs update)
    // Note: lastVersion is a property of each agent, not a global value
    const agentVersion = agent.version || null;
    const agentLastVersion = agent.lastVersion || null;
    let versionWarning = '';
    
    if (agentLastVersion && agentVersion) {
      // compareVersions returns: -1 if agentVersion < agentLastVersion (outdated), 0 if equal, 1 if agentVersion > agentLastVersion
      const comparison = compareVersions(agentVersion, agentLastVersion);
      
      if (comparison !== null && comparison < 0) {
        // Agent version is less than lastVersion, so it needs updating
        versionWarning = '<span class="agent-version-warning" title="Agent version is outdated. Latest version: ' + agentLastVersion + '">⚠️ Outdated</span>';
      }
    }
    
    // Mailbox information
    const mailbox = agent.agentMails && agent.agentMails.length > 0 
      ? agent.agentMails[0].mail 
      : (agent.addresses && agent.addresses.length > 0 ? agent.addresses[0] : 'N/A');
    
    // Mailbox connection status
    const mailboxConnected = agent.agentMails && agent.agentMails.length > 0 
      ? agent.agentMails[0].connected 
      : agent.connected;
    const mailboxStatusClass = mailboxConnected ? 'connected' : 'disconnected';
    const mailboxStatusText = mailboxConnected ? 'Connected' : 'Disconnected';
    
    const privateIps = agent.privateIps && agent.privateIps.length > 0 
      ? agent.privateIps.join(', ') 
      : 'N/A';
    const privateIpLabel = agent.privateIps && agent.privateIps.length > 1 ? 'Private IPs:' : 'Private IP:';
    
    // Get agent users/profiles
    const agentUsers = agent.users || agent.profiles || agent.agentUsers || [];
    
    agentItem.innerHTML = `
      <div class="agent-header">
        <div class="agent-name">${agent.name || 'N/A'}</div>
        <div class="agent-status ${agentStatusClass}">${agentStatusText}</div>
      </div>
      <div class="agent-details">
        <div class="agent-detail-item">
          <span class="agent-detail-label">Environment:</span>
          <span class="agent-detail-value">${agent.environment || 'N/A'}</span>
        </div>
        <div class="agent-detail-item">
          <span class="agent-detail-label">OS:</span>
          <span class="agent-detail-value">${agent.os_full_name || agent.os || 'N/A'}</span>
        </div>
        ${agentVersion ? `
        <div class="agent-detail-item">
          <span class="agent-detail-label">Version:</span>
          <span class="agent-detail-value">
            <span class="agent-version">v${agentVersion}</span>
            ${versionWarning}
          </span>
        </div>
        ` : ''}
        <div class="agent-detail-item">
          <span class="agent-detail-label">${privateIpLabel}</span>
          <span class="agent-detail-value">${privateIps}</span>
        </div>
        <div class="agent-detail-item">
          <span class="agent-detail-label">Mailbox:</span>
          <span class="agent-detail-value">${mailbox}</span>
        </div>
        <div class="agent-detail-item">
          <span class="agent-detail-label">Mailbox Status:</span>
          <span class="agent-detail-value">
            <span class="agent-status-badge ${mailboxStatusClass}">${mailboxStatusText}</span>
          </span>
        </div>
        ${agentUsers.length > 0 ? `
        <div class="agent-users-section">
          <div class="agent-users-header">
            <span class="agent-users-label">Users (${agentUsers.length})</span>
          </div>
          <div class="agent-users-list">
            ${agentUsers.map(user => {
              // Extract domain and username from email or construct from available fields
              let domain = '';
              let username = '';
              
              if (user.email) {
                const emailParts = user.email.split('@');
                username = emailParts[0] || '';
                domain = emailParts[1] || '';
              } else if (user.domain && user.username) {
                domain = user.domain;
                username = user.username;
              } else if (user.domain && user.name) {
                domain = user.domain;
                username = user.name;
              } else if (user.username) {
                username = user.username;
                domain = user.domain || '';
              } else if (user.name) {
                username = user.name;
                domain = user.domain || '';
              } else {
                username = 'N/A';
                domain = '';
              }
              
              const displayText = domain ? `${domain}/${username}` : username;
              
              return `
                <div class="agent-user-badge">
                  <span class="agent-user-text">${displayText}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
    
    agentsInfo.appendChild(agentItem);
  });
}

// Tab switching functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}

// Display modules information
// Show error message
function showError(message) {
  error.textContent = message;
  error.classList.remove('hidden');
  loading.classList.add('hidden');
  dataContainer.classList.add('hidden');
}

// Hide error message
function hideError() {
  error.classList.add('hidden');
}

// Get friendly environment name from base URL
function getEnvironmentName(baseUrl) {
  const envMap = {
    'https://eksstgapp.cymulatedev.com': 'Stage',
    'https://eksstgapptenant.cymulatedev.com': 'Stage Tenant',
    'https://rfqa-app.cymulatedev.com': 'RFQA',
    'https://rfqa-tenant-app.cymulatedev.com': 'RFQA Tenant',
    'https://app.cymulate.com': 'Prod EU',
    'https://us.cymulate.com': 'Prod US'
  };
  
  // Remove trailing slash if present
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return envMap[normalizedUrl] || baseUrl;
}

// Get base URL from current tab or URL parameter
async function getCurrentEnvironment() {
  try {
    let tabUrl = null;
    
    // Check if we're in a floating window with a URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('tabUrl');
    
    if (paramUrl) {
      tabUrl = paramUrl;
    } else {
      // Try to get from current tab (works in popup)
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url) {
        tabUrl = tabs[0].url;
      }
    }
    
    if (!tabUrl) {
      throw new Error('No active tab found');
    }

    const url = new URL(tabUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Validate that it's a Cymulate domain
    const cymulateDomains = [
      'eksstgapp.cymulatedev.com',
      'eksstgapptenant.cymulatedev.com',
      'rfqa-app.cymulatedev.com',
      'rfqa-tenant-app.cymulatedev.com',
      'app.cymulate.com',
      'us.cymulate.com'
    ];

    const isValidDomain = cymulateDomains.some(domain => url.host.includes(domain));
    if (!isValidDomain) {
      throw new Error('Current page is not a Cymulate environment');
    }

    return baseUrl;
  } catch (err) {
    console.error('Error getting current environment:', err);
    throw err;
  }
}

// Fetch token data from API
async function fetchTokenData(baseUrl, clientID) {
  if (!clientID) {
    tokenInfo.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">Client ID not available</p>';
    return;
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/client/token?env=default`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientID: clientID })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    displayToken(data);
  } catch (err) {
    console.error('Error fetching token data:', err);
    tokenInfo.innerHTML = `<p style="color: #dc3545; padding: 20px; text-align: center;">Failed to fetch token: ${err.message}</p>`;
  }
}

// Fetch agents data from API
async function fetchAgentsData(baseUrl) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/agents?env=default`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    displayAgents(data);
  } catch (err) {
    console.error('Error fetching agents data:', err);
    agentsInfo.innerHTML = `<p style="color: #dc3545; padding: 20px; text-align: center;">Failed to fetch agents: ${err.message}</p>`;
  }
}

// Fetch user permissions data from API
async function fetchUserPermissions(baseUrl, clientID, loggedInUserEmail, loggedInUserName) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/user/permissions?env=default`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    displayUserPermissions(data, clientID, loggedInUserEmail, loggedInUserName);
  } catch (err) {
    console.error('Error fetching user permissions:', err);
    usersInfo.innerHTML = `<p style="color: #dc3545; padding: 20px; text-align: center;">Failed to fetch user permissions: ${err.message}</p>`;
  }
}

// Fetch environments data from API
async function fetchEnvironmentsData(baseUrl) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/environments/data?env=default`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      displayEnvironments(data.data);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching environments:', err);
    environmentsInfo.innerHTML = `<p style="color: #dc3545; padding: 20px; text-align: center;">Failed to fetch environments: ${err.message}</p>`;
  }
}

// Display environments data
function displayEnvironments(environmentsData) {
  environmentsInfo.innerHTML = '';

  if (!environmentsData || !environmentsData.environments || environmentsData.environments.length === 0) {
    environmentsInfo.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No environments found</p>';
    return;
  }

  // Create lookup maps for agents and URLs
  const agentsMap = {};
  if (environmentsData.agents) {
    environmentsData.agents.forEach(agent => {
      const agentId = agent._id || agent.address;
      if (agentId) {
        agentsMap[agentId] = agent;
      }
    });
  }

  const urlsMap = {};
  if (environmentsData.urls) {
    environmentsData.urls.forEach(urlObj => {
      urlsMap[urlObj._id] = urlObj.url;
    });
  }

  // Create table layout
  const table = document.createElement('table');
  table.className = 'users-table';

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th style="width: 30px;"></th>
    <th>Name</th>
    <th>Agents</th>
    <th>URLs</th>
    <th>Visibility</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  // Helper: format env timestamp-ish fields for display
  function formatEnvDateTime(value) {
    if (value === null || value === undefined || value === '') return 'N/A';
    try {
      let d;
      if (typeof value === 'number') {
        // Heuristic: seconds vs milliseconds
        const ms = value < 1e12 ? value * 1000 : value;
        d = new Date(ms);
      } else {
        d = new Date(value);
      }
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString();
    } catch (e) {
      return String(value);
    }
  }

  environmentsData.environments.forEach((env, index) => {
    const envName = env.name || 'N/A';
    const envId = env._id !== undefined ? String(env._id) : 'N/A';
    const isDefault = envId === '0' || env.name === 'Default Environment';
    const envLastUpdatedRaw =
      env.lastUpdated ??
      env.updatedAt ??
      env.last_update ??
      env.modifiedAt ??
      env.lastModified ??
      env.updated ??
      null;
    const envLastUpdatedDisplay = formatEnvDateTime(envLastUpdatedRaw);
    const envLastUpdatedCopy = envLastUpdatedRaw !== null && envLastUpdatedRaw !== undefined ? String(envLastUpdatedRaw) : 'N/A';

    // Format visibility
    const isVisible = env.visible !== undefined ? env.visible : (env.public !== undefined ? env.public : null);
    const visibilityBadge = isVisible === true 
      ? '<span class="status-badge status-active">Visible</span>'
      : isVisible === false
      ? '<span class="status-badge status-inactive">Hidden</span>'
      : '<span class="status-badge status-n-a">N/A</span>';

    // Get agents list
    const agentsList = [];
    if (env.agents && env.agents.length > 0) {
      env.agents.forEach(agentId => {
        const agent = agentsMap[agentId];
        if (agent) {
          agentsList.push({
            id: agentId,
            name: agent.name || agent.address || agentId,
            address: agent.address,
            os: agent.os || agent.os_full_name,
            version: agent.version,
            isService: agent.isService
          });
        } else {
          agentsList.push({
            id: agentId,
            name: agentId,
            address: null,
            os: null,
            version: null,
            isService: null
          });
        }
      });
    }

    // Get URLs list
    const urlsList = [];
    if (env.urls && env.urls.length > 0) {
      env.urls.forEach(urlId => {
        const url = urlsMap[urlId];
        if (url) {
          urlsList.push({ id: urlId, url: url });
        } else {
          urlsList.push({ id: urlId, url: null });
        }
      });
    }

    // Create main row
    const row = document.createElement('tr');
    row.className = 'environment-row';
    row.style.cursor = 'pointer';
    
    // Expand/collapse icon cell
    const expandCell = document.createElement('td');
    expandCell.className = 'environment-expand-cell';
    const expandIcon = document.createElement('span');
    expandIcon.className = 'environment-expand-icon';
    expandIcon.textContent = '▶';
    expandCell.appendChild(expandIcon);

    // Name cell
    const nameCell = document.createElement('td');
    nameCell.innerHTML = `
      <div class="name-email-cell">
        <div class="name-email-content">
          <div class="user-name">
            ${envName}
            ${isDefault ? '<span class="default-badge" style="margin-left: 8px;">Default</span>' : ''}
          </div>
        </div>
      </div>
    `;

    // Agents count cell
    const agentsCell = document.createElement('td');
    agentsCell.innerHTML = `<span class="environment-count">${agentsList.length}</span>`;

    // URLs count cell
    const urlsCell = document.createElement('td');
    urlsCell.innerHTML = `<span class="environment-count">${urlsList.length}</span>`;

    // Visibility cell
    const visibilityCell = document.createElement('td');
    visibilityCell.innerHTML = visibilityBadge;

    // Assemble main row
    row.appendChild(expandCell);
    row.appendChild(nameCell);
    row.appendChild(agentsCell);
    row.appendChild(urlsCell);
    row.appendChild(visibilityCell);
    tbody.appendChild(row);

    // Create detail row (hidden by default)
    const detailRow = document.createElement('tr');
    detailRow.className = 'environment-detail-row';
    detailRow.style.display = 'none';
    
    const detailCell = document.createElement('td');
    detailCell.colSpan = 5;
    detailCell.className = 'environment-detail-cell';
    
    const detailContent = document.createElement('div');
    detailContent.className = 'environment-detail-content';

    // Environment ID section (always show)
    const envMetaSection = document.createElement('div');
    envMetaSection.className = 'environment-detail-section';
    envMetaSection.innerHTML = `
      <h4 class="environment-detail-title">Environment Data</h4>
      <div class="environment-detail-list">
        <div class="environment-detail-item">
          <strong>ID:</strong>
          <span class="detail-meta">${envId}</span>
          <button class="copy-btn table-copy-btn" title="Copy env id" aria-label="Copy env id" data-copy="${envId}">📋</button>
        </div>
        <div class="environment-detail-item">
          <strong>Last Updated:</strong>
          <span class="detail-meta">${envLastUpdatedDisplay}</span>
          <button class="copy-btn table-copy-btn" title="Copy last updated" aria-label="Copy last updated" data-copy="${envLastUpdatedCopy}">📋</button>
        </div>
      </div>
    `;
    detailContent.appendChild(envMetaSection);

    // Copy handlers (ID + lastUpdated)
    envMetaSection.querySelectorAll('button[data-copy]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // don't toggle expand/collapse
        const text = btn.dataset.copy || '';
        if (text && text !== 'N/A') {
          copyToClipboard(text, btn);
        }
      });
    });
    
    // Agents section
    if (agentsList.length > 0) {
      const agentsSection = document.createElement('div');
      agentsSection.className = 'environment-detail-section';
      agentsSection.innerHTML = `<h4 class="environment-detail-title">Agents (${agentsList.length})</h4>`;
      
      const agentsListContainer = document.createElement('div');
      agentsListContainer.className = 'environment-detail-list';
      
      agentsList.forEach(agent => {
        const agentItem = document.createElement('div');
        agentItem.className = 'environment-detail-item';
        
        const agentParts = [];
        if (agent.name) agentParts.push(`<strong>${agent.name}</strong>`);
        if (agent.address && agent.address !== agent.name) agentParts.push(`<span class="detail-meta">${agent.address}</span>`);
        if (agent.os) agentParts.push(`<span class="detail-badge">${agent.os}</span>`);
        if (agent.version) agentParts.push(`<span class="detail-badge">v${agent.version}</span>`);
        if (agent.isService) agentParts.push(`<span class="detail-badge">Service</span>`);
        
        agentItem.innerHTML = agentParts.join(' ');
        agentsListContainer.appendChild(agentItem);
      });
      
      agentsSection.appendChild(agentsListContainer);
      detailContent.appendChild(agentsSection);
    }

    // URLs section
    if (urlsList.length > 0) {
      const urlsSection = document.createElement('div');
      urlsSection.className = 'environment-detail-section';
      urlsSection.innerHTML = `<h4 class="environment-detail-title">URLs (${urlsList.length})</h4>`;
      
      const urlsListContainer = document.createElement('div');
      urlsListContainer.className = 'environment-detail-list';
      
      urlsList.forEach(urlItem => {
        const urlElement = document.createElement('div');
        urlElement.className = 'environment-detail-item';
        
        if (urlItem.url) {
          const urlLink = document.createElement('a');
          urlLink.href = urlItem.url;
          urlLink.target = '_blank';
          urlLink.rel = 'noopener noreferrer';
          urlLink.textContent = urlItem.url;
          urlLink.className = 'environment-url-link';
          urlElement.appendChild(urlLink);
        } else {
          urlElement.textContent = urlItem.id;
        }
        
        urlsListContainer.appendChild(urlElement);
      });
      
      urlsSection.appendChild(urlsListContainer);
      detailContent.appendChild(urlsSection);
    }

    detailCell.appendChild(detailContent);
    detailRow.appendChild(detailCell);
    tbody.appendChild(detailRow);

    // Add click handler to toggle detail row
    row.addEventListener('click', () => {
      const isExpanded = detailRow.style.display !== 'none';
      detailRow.style.display = isExpanded ? 'none' : 'table-row';
      expandIcon.textContent = isExpanded ? '▶' : '▼';
      row.style.backgroundColor = isExpanded ? '' : 'var(--bg-tertiary)';
    });
  });

  table.appendChild(tbody);
  environmentsInfo.appendChild(table);
}

// Fetch integrations data from API
async function fetchIntegrationsData(baseUrl) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/integration?env=default`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data && data.data.integrations) {
      // Filter for active integrations (configured: true)
      const activeIntegrations = data.data.integrations.filter(integration => integration.configured === true);
      displayIntegrations(activeIntegrations);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching integrations:', err);
    integrationsInfo.innerHTML = `<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Failed to fetch integrations: ${err.message}</p>`;
  }
}

// Display integrations data
function displayIntegrations(integrations) {
  integrationsInfo.innerHTML = '';

  if (!integrations || integrations.length === 0) {
    integrationsInfo.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No active integrations found</p>';
    return;
  }

  // Create table
  const table = document.createElement('table');
  table.className = 'users-table'; // Reuse users table styles

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Name</th>
    <th>Category</th>
    <th>Configured</th>
    <th>Status</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  integrations.forEach(integration => {
    const row = document.createElement('tr');
    
    const name = integration.name || 'N/A';
    const category = integration.category || 'N/A';
    const configured = integration.configured === true ? 'Yes' : 'No';
    const status = integration.status || 'N/A';

    // Format configured badge
    const configuredBadge = integration.configured === true
      ? '<span class="status-badge status-active">Yes</span>'
      : '<span class="status-badge status-inactive">No</span>';

    // Format status badge
    let statusBadge = '';
    if (status && status !== 'N/A') {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('not validated')) {
        statusBadge = `<span class="status-badge status-warning">${status}</span>`;
      } else if (statusLower.includes('valid') && !statusLower.includes('not')) {
        statusBadge = `<span class="status-badge status-active">${status}</span>`;
      } else if (statusLower.includes('invalid') || statusLower === 'inactive') {
        statusBadge = `<span class="status-badge status-inactive">${status}</span>`;
      } else {
        statusBadge = `<span class="status-badge status-n-a">${status}</span>`;
      }
    } else {
      statusBadge = '<span class="status-badge status-n-a">N/A</span>';
    }

    // Format category badge
    const categoryBadge = category && category !== 'N/A'
      ? `<span class="category-badge">${category}</span>`
      : '<span class="info-value">N/A</span>';

    row.innerHTML = `
      <td>
        <div class="name-email-cell">
          <div class="name-email-content">
            <div class="user-name">${name}</div>
          </div>
        </div>
      </td>
      <td>${categoryBadge}</td>
      <td>${configuredBadge}</td>
      <td>${statusBadge}</td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  integrationsInfo.appendChild(table);
}

// Fetch data from API
async function fetchClientData() {
  let baseUrl;
  
  try {
    baseUrl = await getCurrentEnvironment();
    const envName = getEnvironmentName(baseUrl);
    envUrl.textContent = envName;
    envUrl.title = baseUrl; // Show full URL in tooltip
  } catch (err) {
    showError(`Could not detect environment: ${err.message}. Please navigate to a Cymulate page.`);
    envUrl.textContent = 'Not detected';
    return;
  }

  // Ensure baseUrl ends with /
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const apiUrl = `${normalizedBaseUrl}api/me`;

  // Show loading state
  loading.classList.remove('hidden');
  dataContainer.classList.add('hidden');
  hideError();

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Display the data
    displayClientInfo(data, baseUrl);

    // Get clientID and logged-in user info from the response
    const clientID = data.clientID?._id || data.clientID?.id;
    const loggedInUserEmail = data.email || null;
    const loggedInUserName = data.name || `${data.firstname || ''} ${data.lastname || ''}`.trim() || null;

    // Fetch agents, token, user permissions, environments, and integrations data in parallel
    fetchAgentsData(baseUrl);
    fetchTokenData(baseUrl, clientID);
    fetchUserPermissions(baseUrl, clientID, loggedInUserEmail, loggedInUserName);
    fetchEnvironmentsData(baseUrl);
    fetchIntegrationsData(baseUrl);

    // Show data container
    loading.classList.add('hidden');
    dataContainer.classList.remove('hidden');
  } catch (err) {
    console.error('Error fetching data:', err);
    showError(`Failed to fetch data: ${err.message}. Make sure you are logged in to the current environment.`);
  }
}

// Theme management
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.querySelector('.theme-toggle-label');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply saved theme
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
    themeLabel.textContent = 'Dark';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.checked = false;
    themeLabel.textContent = 'Light';
  }
  
  // Handle theme toggle
  themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeLabel.textContent = 'Dark';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeLabel.textContent = 'Light';
    }
  });
}

// Settings management
function initSettings() {
  settingsInfo.innerHTML = '';
  
  // Floating button setting
  chrome.storage.sync.get(['showFloatingButton'], (result) => {
    const buttonEnabled = result.showFloatingButton !== false; // Default to true
    
    const floatingItem = document.createElement('div');
    floatingItem.className = 'info-item';
    
    const label = document.createElement('div');
    label.className = 'info-label';
    label.textContent = 'Show Floating Button:';
    
    const valueContainer = document.createElement('div');
    valueContainer.className = 'info-value-container';
    
    const toggleContainer = document.createElement('label');
    toggleContainer.className = 'settings-toggle';
    toggleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer;';
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'floating-button-toggle';
    toggle.checked = buttonEnabled;
    
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'settings-toggle-slider';
    
    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = buttonEnabled ? 'Enabled' : 'Disabled';
    toggleLabel.style.cssText = 'font-size: 13px; color: var(--text-primary);';
    
    toggleContainer.appendChild(toggle);
    toggleContainer.appendChild(toggleSlider);
    toggleContainer.appendChild(toggleLabel);
    
    valueContainer.appendChild(toggleContainer);
    floatingItem.appendChild(label);
    floatingItem.appendChild(valueContainer);
    
    settingsInfo.appendChild(floatingItem);
    
    // Handle toggle change
    toggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      toggleLabel.textContent = enabled ? 'Enabled' : 'Disabled';
      
      chrome.storage.sync.set({ showFloatingButton: enabled }, () => {
        // Notify content script to update button visibility
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'updateFloatingButton', show: enabled });
          }
        });
      });
    });
  });
}

// Event listeners
refreshBtn.addEventListener('click', fetchClientData);

// Auto-fetch on popup open
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initSettings();
  fetchClientData();
});


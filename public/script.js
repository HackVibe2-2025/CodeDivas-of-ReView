// =========================
// Modal handling
// =========================
const modal = document.getElementById("journalModal");
const makeEntryBtn = document.getElementById("makeEntryBtn");
const nextBtns = document.querySelectorAll(".nextBtn");
const closeBtns = document.querySelectorAll(".closeBtn");
const steps = document.querySelectorAll(".step");
let currentStep = 0;

// Entry data
let entryData = {
  apps: [],
  screenTime: 0,
  reflection: "",
  tags: []
};

// Open modal
if (makeEntryBtn) {
  makeEntryBtn.addEventListener("click", () => {
    modal.classList.add("show");
    modal.style.display = "flex";
    currentStep = 0;
    showStep();
    resetEntryData();
  });
}

// Next button functionality
nextBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (currentStep === 0) {
      const selectedApps = document.querySelectorAll(".app.selected");
      if (selectedApps.length === 0) {
        alert("Please select at least one app");
        return;
      }
      entryData.apps = Array.from(selectedApps).map(app => app.querySelector("img").alt);
    }

    if (currentStep === 1) {
      entryData.screenTime = parseInt(timeRange.value);
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep();
    }
  });
});

// Close button functionality
closeBtns.forEach(btn => {
  btn.addEventListener("click", async () => {
    if (currentStep === 2) {
      const reflection = document.querySelector(".reflection-box textarea").value;
      if (!reflection.trim()) {
        alert("Please write a reflection");
        return;
      }
      entryData.reflection = reflection;

      const selectedTags = document.querySelectorAll(".tag.selected");
      if (selectedTags.length === 0) {
        alert("Please select at least one tag");
        return;
      }
      entryData.tags = Array.from(selectedTags).map(tag => tag.textContent);

      // Check if this is the AI Analysis button
      if (btn.textContent.includes("AI Analysis")) {
        await performAIAnalysis(entryData);
      } else {
      await saveEntry(entryData);
    }
    }
    modal.classList.remove("show");
    modal.style.display = "none";
  });
});

// Show current step
function showStep() {
  steps.forEach((step, index) => {
    step.classList.remove("active");
    if (index === currentStep) step.classList.add("active");
  });
  
  // Update step indicator
  const stepDots = document.querySelectorAll(".step-dot");
  stepDots.forEach((dot, index) => {
    dot.classList.remove("active", "completed");
    if (index === currentStep) {
      dot.classList.add("active");
    } else if (index < currentStep) {
      dot.classList.add("completed");
    }
  });
}

// Reset modal and data
function resetEntryData() {
  entryData = { apps: [], screenTime: 0, reflection: "", tags: [] };
  document.querySelectorAll(".app").forEach(app => app.classList.remove("selected"));
  document.querySelectorAll(".tag").forEach(tag => tag.classList.remove("selected"));
  document.querySelector(".reflection-box textarea").value = "";
  timeRange.value = 60;
  timeValue.textContent = "1.0";
}

// Screen time range update - Convert minutes to hours
const timeRange = document.getElementById("timeRange");
const timeValue = document.getElementById("timeValue");
if (timeRange) {
  timeRange.addEventListener("input", () => {
    const minutes = parseInt(timeRange.value);
    const hours = (minutes / 60).toFixed(1);
    timeValue.textContent = hours;
  });
}

// App selection toggle
const apps = document.querySelectorAll(".app");
apps.forEach(app => {
  app.addEventListener("click", () => {
    app.classList.toggle("selected");
  });
});

// Tag selection toggle
const tags = document.querySelectorAll(".tag");
tags.forEach(tag => {
  tag.addEventListener("click", () => {
    tag.classList.toggle("selected");
  });
});

// Save entry to backend
async function saveEntry(data) {
  try {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const userId = userData ? JSON.parse(userData).id : null;
    
    console.log('Saving entry - User data:', userData);
    console.log('Saving entry - User ID:', userId);
    
    // Add userId to data
    data.userId = userId;
    
    const response = await fetch("/api/entries", {
      method: "POST",
      credentials: 'include', // Include cookies for session
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    console.log('Save entry response status:', response.status);
    const responseData = await response.json();
    console.log('Save entry response data:', responseData);

    if (response.ok) {
      alert("Entry saved successfully!");
      loadDashboard(); // update dashboard immediately
    } else {
      alert("Error saving entry: " + (responseData.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Server error: " + err.message);
  }
}

// Perform AI Analysis
async function performAIAnalysis(data) {
  try {
    console.log('Starting AI analysis with data:', data);
    
    // Show loading state
    showAILoadingState();
    
    const response = await fetch("/api/ai-analysis", {
      method: "POST",
      credentials: 'include', // Include cookies for session
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    console.log('AI analysis response status:', response.status);
    
    if (response.ok) {
      const analysisResult = await response.json();
      console.log('AI analysis result:', analysisResult);
      displayAIAnalysis(analysisResult);
    } else {
      const errorData = await response.json();
      console.log('AI analysis error:', errorData);
      displayAIAnalysis(errorData.fallback || {
        analysis: "Unable to generate AI analysis at this time.",
        suggestions: ["Try again later", "Continue tracking your usage"],
        microHabits: ["Stay mindful of your screen time"],
        motivationalTip: "You're doing great by being aware of your digital habits!"
      });
    }
  } catch (err) {
    console.error("AI Analysis Error:", err);
    displayAIAnalysis({
      analysis: "Unable to connect to AI service. Here are some general tips:",
      suggestions: [
        "Set specific time limits for your most used apps",
        "Practice mindful scrolling by asking 'Why am I opening this app?'",
        "Create device-free zones in your home"
      ],
      microHabits: [
        "Take a deep breath before unlocking your phone",
        "Set your phone to grayscale mode to reduce visual appeal"
      ],
      motivationalTip: "Every moment of awareness is progress. You're building healthier digital habits!"
    });
  }
}

function showAILoadingState() {
  // Create or update AI analysis modal
  let aiModal = document.getElementById("aiModal");
  if (!aiModal) {
    aiModal = document.createElement("div");
    aiModal.id = "aiModal";
    aiModal.className = "modal";
    aiModal.style.display = "flex";
    document.body.appendChild(aiModal);
  } else {
    aiModal.style.display = "flex";
  }

  aiModal.innerHTML = `
    <div class="modal-content">
      <h3>🤖 AI Analysis in Progress</h3>
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Analyzing your digital consumption patterns...</p>
      </div>
    </div>
  `;
}

function displayAIAnalysis(analysisResult) {
  const aiModal = document.getElementById("aiModal");
  if (!aiModal) return;

  aiModal.innerHTML = `
    <div class="modal-content ai-analysis-modal">
      <h3>🤖 Your AI Digital Wellness Analysis</h3>
      
      <div class="analysis-section">
        <h4>📊 Analysis</h4>
        <p class="analysis-text">${analysisResult.analysis}</p>
      </div>

      <div class="analysis-section">
        <h4>💡 Suggestions</h4>
        <ul class="suggestions-list">
          ${analysisResult.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      </div>

      <div class="analysis-section">
        <h4>🎯 Micro Habits</h4>
        <ul class="micro-habits-list">
          ${analysisResult.microHabits.map(habit => `<li>${habit}</li>`).join('')}
        </ul>
      </div>

      <div class="analysis-section motivational">
        <h4>🌟 Motivational Tip</h4>
        <p class="motivational-text">${analysisResult.motivationalTip}</p>
      </div>

      <div class="analysis-actions">
        <button class="btn" onclick="saveEntryAndClose()">Save Entry & Apply Tips</button>
        <button class="btn" onclick="closeAIModal()" style="background: #666;">Close</button>
      </div>
    </div>
  `;
}

// Global functions for AI modal actions
window.saveEntryAndClose = async function() {
  try {
    await saveEntry(entryData);
    closeAIModal();
    
    // Refresh dashboard if we're on the dashboard page
    if (document.getElementById("dashboardContainer")) {
      console.log('🔄 Refreshing dashboard after AI entry save...');
      await loadDashboard();
    }
    
    alert("Entry saved! Start applying the AI suggestions to improve your digital wellness.");
  } catch (err) {
    console.error(err);
    alert("Error saving entry. Please try again.");
  }
};

window.closeAIModal = function() {
  const aiModal = document.getElementById("aiModal");
  if (aiModal) {
    aiModal.style.display = "none";
  }
};

// =========================
// Dashboard Logic with Real-time Database Integration
// =========================

// Global variables for charts to prevent recreation
let screenTimeChart = null;
let tagChart = null;
let appChart = null;

// Format time for IST timezone with DD/MM/YY format
function formatISTTime(date) {
  // Convert to IST (UTC+5:30)
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format as DD/MM/YY, HH:MM:SS AM/PM
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = String(istTime.getUTCFullYear()).slice(-2);
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

// Format date for IST timezone with DD/MM/YY format
function formatISTDate(date) {
  // Convert to IST (UTC+5:30)
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format as DD/MM/YY
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = String(istTime.getUTCFullYear()).slice(-2);
  
  return `${day}/${month}/${year}`;
}

// Format time from minutes to hours with 12-hour cap
function formatTimeToHours(minutes) {
  // Convert minutes to hours
  let hours = minutes / 60;
  
  // Cap the hours at 12
  if (hours > 12) {
    hours = 12;
  }
  
  // Return formatted time
  if (hours === 1) {
    return "1.0 hour";
  } else {
    return `${hours.toFixed(1)} hours`;
  }
}

// Refresh session
async function refreshSession() {
  try {
    const response = await fetch('/api/session/refresh', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const sessionData = await response.json();
    console.log('Session refresh result:', sessionData);
    
    if (sessionData.success) {
      // Update localStorage with fresh session data
      const userData = {
        id: sessionData.userId,
        email: sessionData.userEmail,
        name: sessionData.userName
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      return true;
    } else {
      // Session expired, clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
}

// Check session status
async function checkSessionStatus() {
  try {
    const response = await fetch('/debug/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const sessionData = await response.json();
    console.log('Session status:', sessionData);
    
    return sessionData;
  } catch (error) {
    console.error('Error checking session:', error);
    return null;
  }
}

// Get current user ID from multiple sources
function getCurrentUserId() {
  // Try to get from localStorage first
  const userData = localStorage.getItem('user');
  console.log('getCurrentUserId - userData from localStorage:', userData);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('getCurrentUserId - parsed user:', user);
      console.log('getCurrentUserId - user ID:', user.id, 'type:', typeof user.id);
      return user.id;
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }
  }
  
  // Try to get from session
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  console.log('getCurrentUserId - isLoggedIn:', isLoggedIn);
  
  if (isLoggedIn === 'true' && userData) {
    try {
      const user = JSON.parse(userData);
      console.log('getCurrentUserId - fallback user ID:', user.id);
      return user.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  console.log('getCurrentUserId - No user ID found');
  return null;
}

// Debug function to check dashboard state
function debugDashboard() {
  console.log('=== DASHBOARD DEBUG INFO ===');
  console.log('Current URL:', window.location.href);
  console.log('Is dashboard page:', window.location.pathname.includes('dashboard'));
  
  const userData = localStorage.getItem('user');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  console.log('User data in localStorage:', userData);
  console.log('Is logged in:', isLoggedIn);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('Parsed user:', user);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  const currentUserId = getCurrentUserId();
  console.log('Current user ID:', currentUserId);
  
  const dashboardContainer = document.getElementById('dashboardContainer');
  const insightsContainer = document.getElementById('insightsContainer');
  console.log('Dashboard container exists:', !!dashboardContainer);
  console.log('Insights container exists:', !!insightsContainer);
  
  console.log('=== END DEBUG INFO ===');
}

// Make debug function available globally
window.debugDashboard = debugDashboard;

// Refresh dashboard data
async function refreshDashboard() {
  console.log('🔄 Refreshing dashboard data...');
  await loadDashboard();
}

// Make refresh function available globally
window.refreshDashboard = refreshDashboard;

// Debug function to force show all data
window.debugShowAllData = async function() {
  console.log('🔧 DEBUG: Forcing show all data without filtering');
  try {
    const res = await fetch("/api/entries", {
      method: "GET",
      credentials: 'include',
      headers: { "Content-Type": "application/json" }
    });
    
    if (res.ok) {
      const data = await res.json();
      const entries = data.entries || [];
      console.log('🔧 DEBUG: All entries from API:', entries);
      
      if (entries.length > 0) {
        updateTodayEntry(entries);
        updateDashboardContainer(entries);
        updateCharts(entries);
        updateInsights(entries);
        console.log('🔧 DEBUG: Dashboard updated with all entries');
      }
    }
  } catch (error) {
    console.error('🔧 DEBUG: Error fetching data:', error);
  }
};

// Force dashboard to show data immediately
window.forceDashboardUpdate = async function() {
  console.log('🔧 FORCE: Updating dashboard immediately');
  
  // Clear loading state
  const loadingElements = document.querySelectorAll('[id*="loading"], .loading');
  loadingElements.forEach(el => el.style.display = 'none');
  
  // Force load dashboard
  await loadDashboard();
  
  // Also try the debug function
  await debugShowAllData();
};

// Simple debug function to check what's happening
window.debugDashboard = function() {
  console.log('🔧 DASHBOARD DEBUG:');
  console.log('Current URL:', window.location.href);
  console.log('User data in localStorage:', localStorage.getItem('user'));
  console.log('Is logged in:', localStorage.getItem('isLoggedIn'));
  console.log('Dashboard container exists:', !!document.getElementById('dashboardContainer'));
  console.log('Today entry exists:', !!document.getElementById('todayEntry'));
  console.log('Insights container exists:', !!document.getElementById('insightsContainer'));
  
  // Check if we're on dashboard page
  if (window.location.pathname.includes('dashboard')) {
    console.log('🔧 On dashboard page, forcing data load...');
    forceDashboardUpdate();
  }
};

// Auto-refresh dashboard every 30 seconds
let autoRefreshInterval;

function startAutoRefresh() {
  // Clear existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // Set new interval
  autoRefreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing dashboard...');
    loadDashboard();
  }, 30000); // 30 seconds
  
  console.log('✅ Auto-refresh started (every 30 seconds)');
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('⏹️ Auto-refresh stopped');
  }
}

// Enhanced loadDashboard that fetches user-specific data from database
async function loadDashboard() {
  console.log('=== DASHBOARD LOADING STARTED ===');
  
  // Get current user ID
  const currentUserId = getCurrentUserId();
  console.log('Current user ID:', currentUserId);
  
  // Get user data from localStorage
  const userData = localStorage.getItem('user');
  console.log('User data from localStorage:', userData);
  
  // Show loading state
  showLoadingState();
  
  let entries = [];
  let apiSuccess = false;
  
  try {
    console.log('🔄 Fetching entries from API...');
    const res = await fetch("/api/entries", {
      method: "GET",
      credentials: 'include',
      headers: { "Content-Type": "application/json" }
    });
    
    if (res.ok) {
      const data = await res.json();
      entries = data.entries || [];
      apiSuccess = true;
      console.log('✅ Successfully fetched entries:', entries.length);
    } else {
      console.log('❌ API request failed with status:', res.status);
    }
  } catch (error) {
    console.log('❌ API request error:', error.message);
  }
  
  // If API failed, try to refresh session and retry
  if (!apiSuccess) {
    console.log('🔄 Attempting to refresh session...');
    try {
      await refreshSession();
      
      const retryRes = await fetch("/api/entries", {
        method: "GET",
        credentials: 'include',
        headers: { "Content-Type": "application/json" }
      });
      
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        entries = retryData.entries || [];
        apiSuccess = true;
        console.log('✅ Successfully fetched entries after session refresh:', entries.length);
      }
    } catch (retryError) {
      console.log('❌ Retry failed:', retryError.message);
    }
  }
  
  // Filter entries for current user if we have a user ID
  if (currentUserId && entries.length > 0) {
    const userEntries = entries.filter(entry => entry.user_id == currentUserId); // Use == for type coercion
    console.log(`🔍 Filtered ${userEntries.length} entries for user ${currentUserId} out of ${entries.length} total entries`);
    console.log(`🔍 User ID type: ${typeof currentUserId}, Entry user_id types: ${entries.map(e => typeof e.user_id)}`);
    entries = userEntries;
  } else if (currentUserId && entries.length === 0) {
    console.log('📝 No entries found for user, but user is logged in');
  } else if (!currentUserId) {
    console.log('👤 No user ID found, showing all entries or welcome message');
  }
  
  console.log('📊 Final entries to display:', entries.length);
  console.log('📊 Current user ID:', currentUserId);
  console.log('📊 Entries data:', entries);
  
  // Get user name for personalized messages
  let userName = 'User';
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userName = user.name;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Update dashboard with entries
  if (entries.length > 0) {
    console.log('📊 Updating dashboard with', entries.length, 'entries');
    updateTodayEntry(entries);
    updateDashboardContainer(entries);
    updateCharts(entries);
    updateInsights(entries);
  } else {
    console.log('👋 No entries found, showing welcome message');
    // If we have a user ID but no entries, show a different message
    if (currentUserId) {
      const dashboardContainer = document.getElementById('dashboardContainer');
      const insightsContainer = document.getElementById('insightsContainer');
      
      if (dashboardContainer) {
        dashboardContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 15px; margin: 1rem 0;">
            <h3 style="color: #00f260; margin-bottom: 1rem;">👋 Welcome, ${userName}!</h3>
            <p style="color: #ccc; margin-bottom: 1.5rem;">You haven't made any entries yet. Start your digital wellness journey!</p>
            <a href="/" style="display: inline-block; padding: 0.8rem 2rem; background: linear-gradient(135deg, #00f260, #0575e6); color: white; text-decoration: none; border-radius: 25px; font-weight: 500;">Make Your First Entry</a>
          </div>
        `;
      }
      
      if (insightsContainer) {
        insightsContainer.innerHTML = `
          <h4>📊 ${userName}'s Digital Wellness Journey</h4>
          <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #00f260;">
            <strong>🎯 Ready to Start:</strong> Track your apps, screen time, and emotions to unlock personalized insights!
          </div>
          <div style="margin: 1rem 0; padding: 1rem; background: linear-gradient(135deg, #00f260, #0575e6); border-radius: 10px; text-align: center;">
            <strong>💡 Your Goal:</strong> Build awareness of your digital habits and create a healthier relationship with technology.
          </div>
        `;
      }
    } else {
      showWelcomeMessage();
    }
  }
  
  hideLoadingState();
  console.log('=== DASHBOARD LOADING COMPLETED ===');
}


// Show welcome message when no data is available
function showWelcomeMessage() {
  const userData = localStorage.getItem('user');
  let userName = 'User';
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userName = user.name;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  const dashboardContainer = document.getElementById('dashboardContainer');
  const insightsContainer = document.getElementById('insightsContainer');
  
  if (dashboardContainer) {
    dashboardContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 15px; margin: 1rem 0;">
        <h3 style="color: #00f260; margin-bottom: 1rem;">👋 Welcome, ${userName}!</h3>
        <p style="color: #ccc; margin-bottom: 1.5rem;">Start your digital wellness journey by making your first entry.</p>
        <a href="/" style="display: inline-block; padding: 0.8rem 2rem; background: linear-gradient(135deg, #00f260, #0575e6); color: white; text-decoration: none; border-radius: 25px; font-weight: 500;">Make Your First Entry</a>
      </div>
    `;
  }
  
  if (insightsContainer) {
    insightsContainer.innerHTML = `
      <h4>📊 ${userName}'s Digital Wellness Journey</h4>
      <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #00f260;">
        <strong>🎯 Ready to Start:</strong> Track your apps, screen time, and emotions to unlock personalized insights!
      </div>
      <div style="margin: 1rem 0; padding: 1rem; background: linear-gradient(135deg, #00f260, #0575e6); border-radius: 10px; text-align: center;">
        <strong>💡 Your Goal:</strong> Build awareness of your digital habits and create a healthier relationship with technology.
      </div>
    `;
  }
}

function showLoadingState() {
  const containers = ['dashboardContainer', 'todayEntry', 'insightsContainer'];
  containers.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<p style="text-align: center; color: #ccc;">Loading...</p>';
    }
  });
  
  // Also show loading in the main consumption area
  const consumptionArea = document.querySelector('.dashboard-section');
  if (consumptionArea) {
    const loadingDiv = consumptionArea.querySelector('.loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.display = 'block';
    }
  }
}

function hideLoadingState() {
  // Clear any remaining loading indicators
  const loadingElements = document.querySelectorAll('[id*="loading"], .loading, p[style*="Loading"]');
  loadingElements.forEach(el => {
    if (el.textContent.includes('Loading')) {
      el.style.display = 'none';
    }
  });
  
  // Clear loading from main consumption area
  const consumptionArea = document.querySelector('.dashboard-section');
  if (consumptionArea) {
    const loadingDiv = consumptionArea.querySelector('.loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }
}

function showErrorState() {
  const containers = ['dashboardContainer', 'todayEntry', 'insightsContainer'];
  containers.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Error loading data. Please refresh the page.</p>';
    }
  });
}

function updateTodayEntry(entries) {
  const todayEntry = document.getElementById('todayEntry');
  if (!todayEntry) return;
  
  // Get today's date in IST
  const now = new Date();
  const istToday = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const todayIST = istToday.toDateString();
  
  const todayEntries = entries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    const entryIST = new Date(entryDate.getTime() + (5.5 * 60 * 60 * 1000));
    return entryIST.toDateString() === todayIST;
  });
  
  if (todayEntries.length === 0) {
    todayEntry.innerHTML = `
      <h4>No entry for today</h4>
      <p>Make your first entry to start tracking your digital consumption!</p>
      <a href="index.html" class="btn">Make Entry</a>
    `;
  } else {
    const latestEntry = todayEntries[0];
    const apps = JSON.parse(latestEntry.apps || "[]");
    const tags = JSON.parse(latestEntry.tags || "[]");
    
    todayEntry.innerHTML = `
      <h4>📱 Today's Entry</h4>
      <p><strong>Apps:</strong> ${apps.join(", ")}</p>
      <p><strong>Screen Time:</strong> ${formatTimeToHours(latestEntry.screen_time)}</p>
      <p><strong>Reflection:</strong> ${latestEntry.reflection}</p>
      <p><strong>Tags:</strong> ${tags.join(", ")}</p>
      <small>Added at ${formatISTTime(new Date(latestEntry.created_at))}</small>
    `;
  }
}

function updateDashboardContainer(entries) {
    const dashboardContainer = document.getElementById("dashboardContainer");
  if (!dashboardContainer) return;

    dashboardContainer.innerHTML = "";

    if (entries.length === 0) {
    dashboardContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: #111; border-radius: 15px; border: 2px dashed #333;">
        <h4 style="color: #00f260; margin-bottom: 1rem;">No entries yet</h4>
        <p style="color: #ccc; margin-bottom: 1.5rem;">Start your journey to conscious consumption by making your first entry!</p>
        <a href="index.html" class="btn">Make First Entry</a>
      </div>
    `;
      return;
    }

  // Sort entries by date (newest first)
  const sortedEntries = entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  sortedEntries.forEach(entry => {
      const apps = JSON.parse(entry.apps || "[]");
      const tags = JSON.parse(entry.tags || "[]");

      const card = document.createElement("div");
      card.classList.add("card");
      card.style.background = "#1a1a1a";
    card.style.padding = "1.5rem";
      card.style.borderRadius = "10px";
      card.style.margin = "0.5rem";
    card.style.transition = "transform 0.3s, box-shadow 0.3s";
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = "translateY(-5px)";
      card.style.boxShadow = "0 10px 20px rgba(0, 242, 96, 0.4)";
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 6px 15px rgba(0, 0, 0, 0.5)";
    });
    
    const date = new Date(entry.created_at);
    // Check if entry is from today in IST
    const now = new Date();
    const istToday = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const entryIST = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    const isToday = entryIST.toDateString() === istToday.toDateString();

      card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h4 style="color: #00f260; margin: 0;">📱 ${apps.join(", ")}</h4>
        <span style="font-size: 0.8rem; color: #aaa; padding: 0.3rem 0.8rem; background: ${isToday ? '#00f260' : '#222'}; color: ${isToday ? '#000' : '#aaa'}; border-radius: 15px; font-weight: ${isToday ? 'bold' : 'normal'};">${isToday ? 'Today' : formatISTDate(entryIST)}</span>
      </div>
      <div>
        <p style="margin: 0.5rem 0;"><strong>⏱️ Screen Time:</strong> ${formatTimeToHours(entry.screen_time)}</p>
        <p style="margin: 0.5rem 0;"><strong>💭 Reflection:</strong> ${entry.reflection}</p>
        <div style="margin: 1rem 0;">
          <strong>🏷️ Tags:</strong>
          ${tags.map(tag => `<span style="display: inline-block; background: #0575e6; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem; margin: 0.2rem 0.3rem 0.2rem 0;">${tag}</span>`).join("")}
        </div>
        <small style="display: block; margin-top: 1rem; font-size: 0.8rem; color: #888; font-style: italic;">${formatISTTime(date)}</small>
      </div>
    `;
    
      dashboardContainer.appendChild(card);
  });
}

function updateCharts(entries) {
  console.log('📊 Updating charts with', entries.length, 'entries');
  
  if (entries.length === 0) {
    console.log('📊 No entries, showing empty charts');
    updateEmptyCharts();
    return;
  }
  
  const screenTimeData = {};
  const tagCounts = {};
  const appCounts = {};
  
  // Process data for charts
  entries.forEach(entry => {
    const apps = JSON.parse(entry.apps || "[]");
    const tags = JSON.parse(entry.tags || "[]");
    
    console.log('Processing entry:', {
      id: entry.id,
      user_id: entry.user_id,
      apps: apps,
      screen_time: entry.screen_time,
      tags: tags
    });
    
    // Screen time by app
      apps.forEach(app => {
        screenTimeData[app] = (screenTimeData[app] || 0) + (entry.screen_time || 0);
      appCounts[app] = (appCounts[app] || 0) + 1;
      });
    
    // Tag counts
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

  console.log('📊 Chart data processed:');
  console.log('Screen time data:', screenTimeData);
  console.log('App counts:', appCounts);
  console.log('Tag counts:', tagCounts);

  // Update Screen Time Chart
  updateScreenTimeChart(screenTimeData);
  
  // Update Tag Chart
  updateTagChart(tagCounts);
  
  // Update App Usage Chart
  updateAppChart(appCounts);
}

function updateScreenTimeChart(data) {
  console.log('📊 Updating screen time chart with data:', data);
  const ctx = document.getElementById("screenTimeChart");
  if (!ctx) {
    console.log('❌ Screen time chart canvas not found');
    return;
  }
  
  // Destroy existing chart if it exists
  if (screenTimeChart) {
    screenTimeChart.destroy();
  }
  
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  console.log('📊 Screen time chart - Labels:', labels, 'Values:', values);
  
  if (labels.length === 0) {
    console.log('📊 No screen time data, showing empty message');
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #ccc;">No screen time data available</p>';
    return;
  }
  
  screenTimeChart = new Chart(ctx, {
        type: "bar",
        data: {
      labels: labels,
          datasets: [{
        label: "Total Screen Time (hours)",
        data: values.map(val => parseFloat((val / 60).toFixed(1))),
        backgroundColor: "#4cafef",
        borderColor: "#00f260",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        },
        x: {
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        }
      }
    }
  });
}

function updateTagChart(data) {
  console.log('📊 Updating tag chart with data:', data);
  const ctx = document.getElementById("tagChart");
  if (!ctx) {
    console.log('❌ Tag chart canvas not found');
    return;
  }
  
  if (tagChart) {
    tagChart.destroy();
  }
  
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  console.log('📊 Tag chart - Labels:', labels, 'Values:', values);
  
  if (labels.length === 0) {
    console.log('📊 No tag data, showing empty message');
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #ccc;">No tag data available</p>';
    return;
  }
  
  tagChart = new Chart(ctx, {
        type: "pie",
        data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4caf50", "#9966ff", "#ee0979"],
        borderColor: "#1a1a1a",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { 
          position: "bottom",
          labels: { color: '#fff' }
        }
      }
    }
  });
}

function updateAppChart(data) {
  console.log('📊 Updating app chart with data:', data);
  const ctx = document.getElementById("appChart");
  if (!ctx) {
    console.log('❌ App chart canvas not found');
    return;
  }
  
  if (appChart) {
    appChart.destroy();
  }
  
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  console.log('📊 App chart - Labels:', labels, 'Values:', values);
  
  if (labels.length === 0) {
    console.log('📊 No app data, showing empty message');
    ctx.parentElement.innerHTML = '<p style="text-align: center; color: #ccc;">No app data available</p>';
    return;
  }
  
  appChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
          datasets: [{
        data: values,
        backgroundColor: ["#ff9a9e", "#fecfef", "#a8edea", "#d299c2"],
        borderColor: "#1a1a1a",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { 
          position: "bottom",
          labels: { color: '#fff' }
        }
      }
    }
  });
}

function updateEmptyCharts() {
  const chartIds = ['screenTimeChart', 'tagChart', 'appChart'];
  chartIds.forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = '<p style="text-align: center; color: #ccc;">No data available yet. Make some entries to see your analytics!</p>';
    }
  });
}

function updateInsights(entries) {
  const insightsContainer = document.getElementById("insightsContainer");
  if (!insightsContainer) return;
  
  if (entries.length === 0) {
    // Get current user info
    const userData = localStorage.getItem('user');
    let userName = 'User';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userName = user.name;
      } catch (e) {
        console.error('Error parsing user data for insights:', e);
      }
    }
    
    insightsContainer.innerHTML = `
      <h4>👋 Welcome, ${userName}!</h4>
      <p>Start your digital wellness journey by making your first entry. Track your apps, screen time, and emotions to unlock personalized insights!</p>
      <div style="margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, #00f260, #0575e6); border-radius: 10px; text-align: center;">
        <strong>🎯 Your Goal:</strong> Build awareness of your digital habits and create a healthier relationship with technology.
      </div>
    `;
    return;
  }
  
  // Generate insights based on data
  const totalEntries = entries.length;
  const totalScreenTime = entries.reduce((sum, entry) => sum + (entry.screen_time || 0), 0);
  const avgScreenTime = Math.round(totalScreenTime / totalEntries);
  
  // Get current user info
  const userData = localStorage.getItem('user');
  let userName = 'User';
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userName = user.name;
    } catch (e) {
      console.error('Error parsing user data for insights:', e);
    }
  }
  
  // Count tags
  const tagCounts = {};
  entries.forEach(entry => {
    const tags = JSON.parse(entry.tags || "[]");
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const mostUsedTag = Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b, '');
  
  // Calculate productivity vs distraction ratio
  const productiveTags = ['✅ Productive', '🧘 Mindful Use'];
  const distractingTags = ['😵 Overwhelmed', '⏳ Wasted Time', '🔥 Deep Dive'];
  
  const productiveCount = Object.keys(tagCounts).filter(tag => productiveTags.includes(tag))
    .reduce((sum, tag) => sum + tagCounts[tag], 0);
  const distractingCount = Object.keys(tagCounts).filter(tag => distractingTags.includes(tag))
    .reduce((sum, tag) => sum + tagCounts[tag], 0);
  
  const productivityRatio = totalEntries > 0 ? Math.round((productiveCount / totalEntries) * 100) : 0;
  
  let insights = `
    <h4>📊 ${userName}'s Digital Wellness Report</h4>
    <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #00f260;">
      <strong>📈 Progress:</strong> You've made ${totalEntries} entries and tracked ${formatTimeToHours(totalScreenTime)} of screen time.
    </div>
    <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #0575e6;">
      <strong>⏰ Average:</strong> You spend an average of ${formatTimeToHours(avgScreenTime)} per session.
    </div>
    <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #ff6b6b;">
      <strong>🎯 Productivity:</strong> ${productivityRatio}% of your sessions are productive or mindful.
    </div>
  `;
  
  if (mostUsedTag) {
    insights += `
      <div style="margin: 1rem 0; padding: 1rem; background: #1a1a1a; border-radius: 10px; border-left: 4px solid #0575e6;">
        <strong>🏷️ Most Common Feeling:</strong> "${mostUsedTag}" - This is your most frequent emotional response to digital consumption.
      </div>
    `;
  }
  
  // Add motivational message based on productivity
  let motivationalMessage = '';
  if (productivityRatio >= 70) {
    motivationalMessage = '🌟 Excellent! You\'re maintaining a healthy balance with technology.';
  } else if (productivityRatio >= 50) {
    motivationalMessage = '👍 Good progress! You\'re becoming more mindful of your digital habits.';
  } else if (productivityRatio >= 30) {
    motivationalMessage = '💪 Keep going! Every step towards mindful technology use counts.';
  } else {
    motivationalMessage = '🎯 Focus on small changes. Try setting specific time limits for your most-used apps.';
  }
  
  insights += `
    <div style="margin: 1rem 0; padding: 1rem; background: linear-gradient(135deg, #00f260, #0575e6); border-radius: 10px; text-align: center;">
      <strong>💡 ${motivationalMessage}</strong>
    </div>
  `;
  
  insightsContainer.innerHTML = insights;
}

// Auto-refresh dashboard every 30 seconds when on dashboard page
function startAutoRefresh() {
  if (window.location.pathname.includes('dashboard')) {
    setInterval(() => {
      loadDashboard();
    }, 30000); // 30 seconds
  }
}

// Check authentication for protected actions
function checkAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn || isLoggedIn !== 'true') {
    return false;
  }
  return true;
}

// Show authentication modal
function showAuthModal() {
  // Redirect to auth page
  window.location.href = '/auth';
}

// Logout function
async function logout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      
      // Redirect to login page
      window.location.href = '/auth';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local storage anyway
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/auth';
  }
}

// Update header with user info
function updateUserHeader() {
  const userData = localStorage.getItem('user');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  const userWelcome = document.getElementById('userWelcome');
  const authBtn = document.getElementById('authBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (isLoggedIn === 'true' && userData) {
    try {
      const user = JSON.parse(userData);
      if (userWelcome) {
        userWelcome.textContent = `Welcome, ${user.name}`;
        userWelcome.style.color = '#00f260';
        userWelcome.style.fontWeight = '500';
      }
      if (authBtn) authBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      
      console.log('User header updated for:', user.name, 'ID:', user.id);
    } catch (e) {
      console.error('Error parsing user data for header:', e);
      if (userWelcome) userWelcome.textContent = '';
      if (authBtn) authBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  } else {
    if (userWelcome) userWelcome.textContent = '';
    if (authBtn) authBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// Run only on dashboard.html
document.addEventListener("DOMContentLoaded", () => {
  // Update user header on all pages
  updateUserHeader();
  
  // Add event listener for Make an Entry button
  const makeEntryBtn = document.getElementById("makeEntryBtn");
  if (makeEntryBtn) {
    makeEntryBtn.addEventListener("click", () => {
      // Check if user is authenticated
      if (!checkAuth()) {
        showAuthModal();
        return;
      }
      
      document.getElementById("journalModal").style.display = "block";
    });
  }
  
  if (document.getElementById("dashboardContainer")) {
    console.log('Dashboard container found, loading data immediately...');
    
    // Load dashboard immediately
    loadDashboard();
    
    // Force update after a short delay to ensure data is loaded
    setTimeout(async () => {
      console.log('Force updating dashboard after delay...');
      await forceDashboardUpdate();
      startAutoRefresh();
    }, 1000);
    
    // Also try session refresh in background
    setTimeout(async () => {
      console.log('Attempting to refresh session and reload dashboard...');
      try {
        await refreshSession();
        // Reload dashboard after session refresh
    loadDashboard();
      } catch (error) {
        console.error('Error in session refresh:', error);
      }
    }, 500);
  }
  
  // Check auth for index.html (journal entry page) - but don't redirect, just show auth modal when needed
  if (document.getElementById("journalModal")) {
    // No automatic redirect, just check auth when making entries
  }
});

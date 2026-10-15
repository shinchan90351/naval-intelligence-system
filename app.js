// ==============================================================================
// NAVAL INTELLIGENCE SYSTEM — COMPLETE INTERACTIVE APPLICATION ENGINE
// Handles: Vessel Mode Switching, Cutaway Zoom/Pan/Rotate, Interactive Pins,
// 4-Step Fault Reporting, AI Diagnostics, Explainable Evidence, Officer Approval,
// Work Orders, Spares, Telemetry Charts, and 2-Minute Evaluator Tour.
// ==============================================================================

// Application State
const state = {
  vesselMode: "NAVAL", // 'NAVAL' | 'CARGO'
  theme: "white",      // 'white' | 'red'
  activeTab: "tab-dashboard",
  activeCategory: "ALL",
  viewMode: "cutaway", // 'cutaway' | 'deck'
  zoom: 1.0,
  rotationDeg: 0,
  selectedMachineryId: "N-SYS-07",
  trendMetric: "temperature",
  trendTimeWindow: "6H",
  workOrders: [...INITIAL_WORK_ORDERS],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  inventory: [...INVENTORY_PARTS]
};

// Global chart references
let telemetryChartInstance = null;
let categoryChartInstance = null;
let departmentChartInstance = null;

// ==============================================================================
// INITIALIZATION
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Check stored theme
  const savedTheme = localStorage.getItem("naval_intel_theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  }

  // Pre-fill initial UI components
  initCharts();
});

// ==============================================================================
// 1. VESSEL SELECTION & SWITCHING
// ==============================================================================
function selectVesselMode(mode) {
  state.vesselMode = mode;
  state.activeCategory = "ALL";
  state.zoom = 1.0;
  state.rotationDeg = 0;

  // Toggle screens
  const selScreen = document.getElementById("vessel-selection-screen");
  const appEnv = document.getElementById("vessel-app-environment");
  
  selScreen.classList.add("hidden");
  appEnv.classList.remove("hidden");

  // Update Body styling mode classes
  if (mode === "NAVAL") {
    document.body.classList.remove("mode-cargo");
    document.body.classList.add("mode-naval");
    state.selectedMachineryId = "N-SYS-07";
  } else {
    document.body.classList.remove("mode-naval");
    document.body.classList.add("mode-cargo");
    state.selectedMachineryId = "C-SYS-07";
  }

  // Update Header details
  updateHeaderAndBranding();

  // Load Cutaway Image
  const cutawayImg = document.getElementById("ship-cutaway-image");
  if (mode === "NAVAL") {
    cutawayImg.src = "assets/ins_visakhapatnam_p15b_cutaway.png";
    cutawayImg.alt = "INS VISAKHAPATNAM (P15B) Warship Cutaway";
  } else {
    cutawayImg.src = "assets/cargo_vessel_cutaway.png";
    cutawayImg.alt = "Commercial Cargo Vessel Cutaway";
  }

  // Render Vessel Specific Components
  renderCategoryFilterChips();
  renderMachineryMarkers();
  updateDashboardStats();
  renderDepartmentHealthBars();
  populateFaultMachineryDropdown();
  renderInventoryTable();
  renderAuditLogTable();
  renderWorkOrderChecklist();

  // Reset viewport stage transform
  applyCutawayTransform();

  // Switch to Dashboard by default
  switchTab("tab-dashboard");
}

function returnToVesselSelection() {
  document.getElementById("vessel-app-environment").classList.add("hidden");
  document.getElementById("vessel-selection-screen").classList.remove("hidden");
}

function updateHeaderAndBranding() {
  const isNaval = state.vesselMode === "NAVAL";
  
  document.getElementById("header-vessel-title").textContent = isNaval ? "INS VISAKHAPATNAM (P15B)" : "COMMERCIAL CARGO VESSEL";
  document.getElementById("header-vessel-subtitle").textContent = isNaval ? "Naval Warship • 50 Machinery Systems Registered" : "Commercial Vessel • 65 Machinery Systems Registered";
  document.getElementById("header-role-tag").textContent = isNaval ? "WARSHIP" : "CARGO";
  document.getElementById("header-vessel-icon").className = isNaval ? "fa-solid fa-anchor" : "fa-solid fa-ship";
  document.getElementById("header-systems-count").textContent = isNaval ? "50 SYSTEMS REGISTERED" : "65 SYSTEMS REGISTERED";

  // Dashboard vessel header
  document.getElementById("dash-vessel-name").textContent = isNaval ? "INS VISAKHAPATNAM (P15B)" : "COMMERCIAL CARGO VESSEL";
  document.getElementById("hud-vessel-title").textContent = isNaval ? "INS VISAKHAPATNAM (P15B)" : "CARGO VESSEL";
}

// ==============================================================================
// 2. THEME SWITCH (WHITE MODE / RED MODE)
// ==============================================================================
function toggleTheme() {
  const nextTheme = state.theme === "white" ? "red" : "white";
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem("naval_intel_theme", theme);

  const btnIcon = document.getElementById("theme-btn-icon");
  const btnText = document.getElementById("theme-btn-text");

  if (theme === "red") {
    document.body.classList.remove("theme-white");
    document.body.classList.add("theme-red");
    btnIcon.textContent = "🔴";
    btnText.textContent = "RED MODE";
  } else {
    document.body.classList.remove("theme-red");
    document.body.classList.add("theme-white");
    btnIcon.textContent = "☀";
    btnText.textContent = "WHITE MODE";
  }

  // Update chart colors if initialized
  if (telemetryChartInstance) updateTelemetryChart();
}

// ==============================================================================
// 3. NAVIGATION TABS
// ==============================================================================
function switchTab(tabId) {
  state.activeTab = tabId;

  // Toggle tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Toggle sections
  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("hidden", content.id !== tabId);
  });

  // If switching to chart tabs, trigger re-render
  if (tabId === "tab-sensor-trends" && telemetryChartInstance) {
    setTimeout(() => {
      telemetryChartInstance.resize();
      updateTelemetryChart();
    }, 50);
  } else if (tabId === "tab-analytics") {
    setTimeout(renderAnalyticsCharts, 50);
  }
}

// ==============================================================================
// 4. SHIP CUTAWAY VIEWPORT & MARKERS
// ==============================================================================
function getCurrentSystems() {
  return state.vesselMode === "NAVAL" ? NAVAL_SYSTEMS : CARGO_SYSTEMS;
}

function renderCategoryFilterChips() {
  const container = document.getElementById("category-filter-chips");
  container.innerHTML = "";

  const systems = getCurrentSystems();
  const categories = ["ALL", ...new Set(systems.map(s => s.category))];

  categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = `filter-chip ${cat === state.activeCategory ? "active" : ""}`;
    chip.textContent = cat === "ALL" ? `All Systems (${systems.length})` : cat;
    chip.onclick = () => {
      state.activeCategory = cat;
      renderCategoryFilterChips();
      renderMachineryMarkers();
    };
    container.appendChild(chip);
  });
}

function renderMachineryMarkers() {
  const overlay = document.getElementById("markers-overlay");
  overlay.innerHTML = "";

  const systems = getCurrentSystems();
  const searchTerm = (document.getElementById("ship-machinery-search")?.value || "").toLowerCase().trim();

  let visibleCount = 0;

  systems.forEach(sys => {
    // Filter by category
    if (state.activeCategory !== "ALL" && sys.category !== state.activeCategory) return;

    // Filter by deck view
    if (state.viewMode === "deck" && sys.deck !== "deck") {
      // In deck view, show only top-deck systems or fade others
    }

    // Filter by search
    if (searchTerm) {
      const match = sys.name.toLowerCase().includes(searchTerm) ||
                    sys.sysNo.toLowerCase().includes(searchTerm) ||
                    sys.location.toLowerCase().includes(searchTerm) ||
                    sys.category.toLowerCase().includes(searchTerm);
      if (!match) return;
    }

    visibleCount++;

    // Create Marker DOM element
    const marker = document.createElement("div");
    marker.className = `machinery-marker ${getMarkerStatusClass(sys.status)} ${sys.id === state.selectedMachineryId ? "selected" : ""}`;
    marker.style.left = `${sys.x}%`;
    marker.style.top = `${sys.y}%`;
    marker.dataset.sysId = sys.id;
    marker.textContent = sys.sysNo;

    // Hover tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "marker-tooltip font-mono";
    tooltip.innerHTML = `<strong>#${sys.sysNo} ${sys.name}</strong><br><span class="text-slate-300">${sys.location}</span><br><span class="text-cyan-400">${sys.temp} ${sys.tempUnit} | ${sys.pressure} ${sys.pressureUnit}</span>`;
    marker.appendChild(tooltip);

    // Click handler
    marker.onclick = (e) => {
      e.stopPropagation();
      openMachinerySlideover(sys.id);
    };

    overlay.appendChild(marker);
  });

  // Update HUD system count
  document.getElementById("hud-visible-systems").textContent = `${visibleCount} / ${systems.length} SYSTEMS SHOWN`;
}

function getMarkerStatusClass(status) {
  switch (status) {
    case "NORMAL": return "marker-normal";
    case "WARNING": return "marker-warning";
    case "FAULT": return "marker-fault";
    case "UNDER_MAINTENANCE": return "marker-maintenance";
    default: return "marker-normal";
  }
}

function filterMachineryMarkers() {
  renderMachineryMarkers();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.getElementById("view-mode-cutaway-btn").className = mode === "cutaway" ? "px-3 py-1.5 rounded bg-white text-slate-900 shadow-sm font-bold" : "px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 font-bold";
  document.getElementById("view-mode-deck-btn").className = mode === "deck" ? "px-3 py-1.5 rounded bg-white text-slate-900 shadow-sm font-bold" : "px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 font-bold";
  renderMachineryMarkers();
}

// Viewport Zoom & Rotate Controls
function zoomCutaway(factor) {
  state.zoom = Math.min(Math.max(state.zoom * factor, 0.6), 3.0);
  applyCutawayTransform();
}

function fitCutawayToScreen() {
  state.zoom = 1.0;
  state.rotationDeg = 0;
  applyCutawayTransform();
}

function resetCutawayView() {
  state.zoom = 1.0;
  state.rotationDeg = 0;
  applyCutawayTransform();
}

function rotateCutawayView() {
  state.rotationDeg = (state.rotationDeg + 180) % 360;
  applyCutawayTransform();
}

function applyCutawayTransform() {
  const stage = document.getElementById("ship-stage-element");
  if (!stage) return;
  
  const rotTransform = state.rotationDeg === 180 ? "scaleX(-1)" : "";
  stage.style.transform = `scale(${state.zoom}) ${rotTransform}`;

  document.getElementById("zoom-level-text").textContent = `${Math.round(state.zoom * 100)}% ZOOM`;
}

// ==============================================================================
// 5. MACHINERY SLIDEOVER & TELEMETRY PANEL
// ==============================================================================
function openMachinerySlideover(machineryId) {
  state.selectedMachineryId = machineryId;
  const sys = getCurrentSystems().find(s => s.id === machineryId);
  if (!sys) return;

  // Highlight marker
  document.querySelectorAll(".machinery-marker").forEach(m => {
    m.classList.toggle("selected", m.dataset.sysId === machineryId);
  });

  // Populate Slideover fields
  document.getElementById("drawer-sys-no").textContent = `SYS ${sys.sysNo}`;
  document.getElementById("drawer-name").textContent = sys.name;
  document.getElementById("drawer-model").textContent = sys.model;
  document.getElementById("drawer-dept").textContent = sys.category;
  document.getElementById("drawer-location").textContent = sys.location;
  document.getElementById("drawer-hours").textContent = `${sys.runningHours.toLocaleString()} hrs`;
  document.getElementById("drawer-last-maint").textContent = sys.lastMaintenance;
  document.getElementById("drawer-function").textContent = sys.function;
  document.getElementById("drawer-common-faults").textContent = sys.commonFaults;
  document.getElementById("drawer-spare-part").textContent = sys.recommendedPart;

  // Status badge
  const statusBadge = document.getElementById("drawer-status-badge");
  statusBadge.className = `badge-status badge-${sys.status.toLowerCase()}`;
  statusBadge.textContent = sys.status.replace("_", " ");

  // Live Telemetry
  document.getElementById("drawer-telemetry-temp").textContent = `${sys.temp} ${sys.tempUnit}`;
  document.getElementById("drawer-telemetry-rpm").textContent = sys.rpm.toLocaleString();
  document.getElementById("drawer-telemetry-press").textContent = `${sys.pressure} ${sys.pressureUnit}`;
  document.getElementById("drawer-telemetry-vib").textContent = `${sys.vibration} ${sys.vibrationUnit}`;

  // Open panel
  document.getElementById("machinery-slideover").classList.add("open");
}

function closeMachinerySlideover() {
  document.getElementById("machinery-slideover").classList.remove("open");
}

function triggerDrawerDiagnostic() {
  closeMachinerySlideover();
  startSpecificDiagnostic(state.selectedMachineryId);
}

// ==============================================================================
// 6. FAULT REPORTING & AI DIAGNOSTIC ENGINE
// ==============================================================================
function populateFaultMachineryDropdown() {
  const select = document.getElementById("fault-machinery-select");
  if (!select) return;
  select.innerHTML = "";

  const systems = getCurrentSystems();
  systems.forEach(sys => {
    const opt = document.createElement("option");
    opt.value = sys.id;
    opt.textContent = `[SYS ${sys.sysNo}] ${sys.name} (${sys.category} - ${sys.location})`;
    if (sys.id === state.selectedMachineryId) opt.selected = true;
    select.appendChild(opt);
  });

  onMachinerySelectChange();
}

function onMachinerySelectChange() {
  const select = document.getElementById("fault-machinery-select");
  const sys = getCurrentSystems().find(s => s.id === select.value);
  if (!sys) return;

  state.selectedMachineryId = sys.id;

  // Metadata display
  document.getElementById("selected-machinery-meta").innerHTML = `
    <span><strong>Location:</strong> ${sys.location}</span>
    <span>•</span>
    <span><strong>Baseline Temp:</strong> ${sys.temp} ${sys.tempUnit}</span>
    <span>•</span>
    <span><strong>Running Hours:</strong> ${sys.runningHours} hrs</span>
  `;

  // Auto-fill sensor telemetry fields with realistic values
  document.getElementById("sensor-input-temp").value = sys.temp;
  document.getElementById("sensor-input-rpm").value = sys.rpm;
  document.getElementById("sensor-input-pressure").value = sys.pressure;
  document.getElementById("sensor-input-vibration").value = sys.vibration;
}

function insertObservationPreset() {
  const sys = getCurrentSystems().find(s => s.id === state.selectedMachineryId);
  const obsArea = document.getElementById("fault-crew-observation");
  if (state.vesselMode === "NAVAL") {
    obsArea.value = `Observed sudden temperature surge to 485°C on ${sys.name} return line. Flow whistling audible near secondary heat exchanger. Lube oil sample confirms absence of water contamination.`;
  } else {
    obsArea.value = `Differential pressure transducer on ${sys.name} dropped below 1.2 bar alarm limit during laden passage. Visual check shows minimal oil weeping in drain inspection glass.`;
  }
}

function startSpecificDiagnostic(machineryId) {
  state.selectedMachineryId = machineryId;
  populateFaultMachineryDropdown();
  switchTab("tab-fault-reporting");
}

function handleRunAiDiagnosis(e) {
  e.preventDefault();

  const btn = document.getElementById("btn-run-diagnosis");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> RUNNING LOCAL AI INFERENCE...`;

  // Simulate ultra-fast local neural engine computation (1.2 seconds)
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-microchip"></i> RUN AI DIAGNOSIS`;

    // Populate AI Diagnosis screen
    const sys = getCurrentSystems().find(s => s.id === state.selectedMachineryId);
    document.getElementById("diag-res-machinery").textContent = `${sys.name} (System ${sys.sysNo})`;

    if (state.vesselMode === "NAVAL") {
      document.getElementById("diag-res-condition").textContent = "Cooling System Abnormality (Plate Heat Exchanger Flow Restriction)";
      document.getElementById("diag-res-confidence").textContent = "87%";
    } else {
      document.getElementById("diag-res-condition").textContent = "Pneumatic Air Seal Regulator Diaphragm Fatigue (Pressure Degradation)";
      document.getElementById("diag-res-confidence").textContent = "89%";
    }

    // Switch to AI Diagnosis tab
    switchTab("tab-ai-diagnosis");
  }, 1200);
}

function toggleEvidenceSection() {
  const section = document.getElementById("ai-evidence-section");
  section.scrollIntoView({ behavior: "smooth" });
}

function viewEvidenceModal(machineryId) {
  state.selectedMachineryId = machineryId;
  switchTab("tab-ai-diagnosis");
  toggleEvidenceSection();
}

// ==============================================================================
// 7. ENGINEER OFFICER REVIEW & WORK ORDER LIFECYCLE
// ==============================================================================
function forwardToOfficerReview() {
  const sys = getCurrentSystems().find(s => s.id === state.selectedMachineryId);
  document.getElementById("officer-review-machinery").textContent = `${sys.name} (System ${sys.sysNo})`;

  if (state.vesselMode === "NAVAL") {
    document.getElementById("officer-name-input").value = "Lt Cdr R. Sharma, Senior Engineer Officer";
  } else {
    document.getElementById("officer-name-input").value = "Chief Engineer M. Varma";
  }

  switchTab("tab-maintenance");
}

function officerAction(action) {
  const sys = getCurrentSystems().find(s => s.id === state.selectedMachineryId);
  const officerName = document.getElementById("officer-name-input").value;
  const remarks = document.getElementById("officer-remarks-input").value;

  if (action === "APPROVE") {
    alert(`ACTION APPROVED by ${officerName}.\nWork Order generated and dispatched to duty crew terminal.`);

    // Create Work Order
    const newWo = {
      woNumber: state.vesselMode === "NAVAL" ? `WO-P15B-2026-${Math.floor(1000 + Math.random() * 9000)}` : `WO-CARGO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vessel: state.vesselMode,
      systemId: sys.id,
      machinery: sys.name,
      faultCategory: "Cooling Problem / Pressure Anomaly",
      priority: "CRITICAL",
      status: "APPROVED",
      approvedAction: remarks,
      assignedCrew: state.vesselMode === "NAVAL" ? "PO(Mech) S. Kumar & Leading Eng A. Joshi" : "2nd Eng Zhang Wei",
      requiredParts: sys.recommendedPart,
      timestamp: new Date().toLocaleString(),
      approver: officerName,
      checklist: [
        { text: `Isolate ${sys.name} auxiliary loop and lock out safety trips`, done: true },
        { text: "Depressurize hydraulic/pneumatic accumulators and tag out valves", done: true },
        { text: "Inspect heat exchanger / component matrix for silt or physical wear", done: false },
        { text: `Renew seal kit (${sys.recommendedPart}) and torque fasteners to spec`, done: false },
        { text: "Restore circulation, bleed trapped micro-air, verify telemetry parameters", done: false },
        { text: "Conduct 30-minute operational test and return machinery to service", done: false }
      ]
    };

    state.workOrders.unshift(newWo);
    renderWorkOrderChecklist();
    
    // Auto-reserve spare part
    reservePartForSystem(sys.recommendedPart);

  } else if (action === "MODIFY") {
    alert(`DECISION MODIFIED: Officer added specific directives to work order scope.`);
  } else if (action === "REJECT") {
    alert(`DECISION REJECTED: False anomaly identified. Telemetry flagged for sensor recalibration.`);
  } else if (action === "ESCALATE") {
    alert(`ESCALATED: Forwarded to Naval Fleet Technical Command / Technical Superintendent.`);
  }
}

function renderWorkOrderChecklist() {
  const activeWo = state.workOrders[0];
  if (!activeWo) return;

  document.getElementById("wo-number-display").textContent = activeWo.woNumber;
  document.getElementById("wo-crew-display").textContent = activeWo.assignedCrew;
  document.getElementById("wo-parts-display").textContent = activeWo.requiredParts;
  document.getElementById("wo-priority-display").textContent = activeWo.priority;

  const container = document.getElementById("wo-checklist-container");
  container.innerHTML = "";

  activeWo.checklist.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200 text-xs";
    div.innerHTML = `
      <input type="checkbox" id="chk-${idx}" ${item.done ? "checked" : ""} onchange="toggleChecklistItem(${idx})" class="w-4 h-4 text-cyan-600 rounded">
      <label for="chk-${idx}" class="${item.done ? "line-through text-slate-400 font-medium" : "text-slate-800 font-bold"} cursor-pointer">
        ${item.text}
      </label>
    `;
    container.appendChild(div);
  });
}

function toggleChecklistItem(idx) {
  const activeWo = state.workOrders[0];
  if (!activeWo) return;
  activeWo.checklist[idx].done = !activeWo.checklist[idx].done;
  renderWorkOrderChecklist();
}

function markWorkComplete() {
  const activeWo = state.workOrders[0];
  if (!activeWo) return;

  // Check if all checklist items done
  activeWo.checklist.forEach(i => i.done = true);
  activeWo.status = "COMPLETED";

  // Restore machinery status to NORMAL
  const sys = getCurrentSystems().find(s => s.id === activeWo.systemId);
  if (sys) {
    sys.status = "NORMAL";
    sys.temp = state.vesselMode === "NAVAL" ? 52 : 45; // Restored normal temperature
    sys.vibration = 1.2;
  }

  // Deduct reserved stock
  const part = state.inventory.find(p => p.name.includes(sys.recommendedPart.split(" ")[0]));
  if (part && part.reserved > 0) {
    part.reserved -= 1;
    if (part.stock > 0) part.stock -= 1;
  }

  // Record into Cryptographic Audit Trail
  const newLog = {
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    vessel: state.vesselMode,
    timestamp: new Date().toLocaleString(),
    machinery: `${sys.name} (System ${sys.sysNo})`,
    fault: `${activeWo.faultCategory} Cleared`,
    aiDiagnosis: "Overhaul Verified Successful",
    engineerDecision: "COMPLETED & CERTIFIED",
    actionTaken: `Executed Work Order ${activeWo.woNumber}. Replaced seals. Telemetry nominal.`,
    crew: activeWo.assignedCrew,
    completionTime: "2.4 Hours",
    status: "COMPLETED",
    hash: "7f90c128" + Math.random().toString(16).substring(2, 10)
  };

  state.auditLogs.unshift(newLog);

  // Update UI
  renderMachineryMarkers();
  updateDashboardStats();
  renderAuditLogTable();
  renderInventoryTable();
  renderWorkOrderChecklist();

  alert(`✔ MAINTENANCE COMPLETE!\nWork Order ${activeWo.woNumber} verified and closed.\nMachinery status restored to NORMAL.\nCryptographic logbook signed.`);
  switchTab("tab-logbook");
}

// ==============================================================================
// 8. DASHBOARD STATS & DEPARTMENT HEALTH
// ==============================================================================
function updateDashboardStats() {
  const systems = getCurrentSystems();
  const normal = systems.filter(s => s.status === "NORMAL").length;
  const warning = systems.filter(s => s.status === "WARNING").length;
  const faults = systems.filter(s => s.status === "FAULT").length;
  const maint = systems.filter(s => s.status === "UNDER_MAINTENANCE").length;

  document.getElementById("dash-kpi-total").textContent = systems.length;
  document.getElementById("dash-kpi-normal").textContent = normal;
  document.getElementById("dash-kpi-warning").textContent = warning;
  document.getElementById("dash-kpi-faults").textContent = faults;
  document.getElementById("dash-kpi-maint").textContent = maint;
}

function renderDepartmentHealthBars() {
  const container = document.getElementById("department-health-bars");
  container.innerHTML = "";

  const isNaval = state.vesselMode === "NAVAL";
  const depts = isNaval ? [
    { name: "Propulsion", health: 88, systems: 14 },
    { name: "Electrical Power", health: 94, systems: 10 },
    { name: "Auxiliary & Damage Control", health: 96, systems: 12 },
    { name: "HVAC & Climate", health: 86, systems: 6 },
    { name: "Weapons", health: 90, systems: 6 },
    { name: "Sensors, Radar & Aviation", health: 98, systems: 2 }
  ] : [
    { name: "Main Engine & Propulsion", health: 86, systems: 12 },
    { name: "Generators & Electrical", health: 92, systems: 10 },
    { name: "Cargo Handling Systems", health: 89, systems: 10 },
    { name: "Pumps & Piping", health: 91, systems: 15 },
    { name: "HVAC & Refrigeration", health: 94, systems: 7 },
    { name: "Safety & Fire Fighting", health: 98, systems: 6 },
    { name: "Deck Machinery", health: 90, systems: 5 }
  ];

  depts.forEach(d => {
    const bar = document.createElement("div");
    bar.className = "space-y-1";
    bar.innerHTML = `
      <div class="flex items-center justify-between text-xs font-bold">
        <span class="text-slate-700">${d.name} (${d.systems} Systems)</span>
        <span class="${d.health < 90 ? "text-amber-600" : "text-emerald-700"} font-mono">${d.health}% Operational Health</span>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div class="h-full ${d.health < 90 ? "bg-amber-500" : "bg-emerald-500"} rounded-full transition-all duration-500" style="width: ${d.health}%"></div>
      </div>
    `;
    container.appendChild(bar);
  });
}

// ==============================================================================
// 9. INVENTORY & SPARES
// ==============================================================================
function renderInventoryTable() {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const query = (document.getElementById("inventory-search")?.value || "").toLowerCase().trim();

  state.inventory.forEach(item => {
    if (query && !item.partNo.toLowerCase().includes(query) && !item.name.toLowerCase().includes(query)) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-mono font-bold text-slate-800">${item.partNo}</td>
      <td class="font-bold text-slate-900">${item.name}</td>
      <td class="text-slate-600">${item.machinery}</td>
      <td class="font-mono font-bold text-slate-900">${item.stock}</td>
      <td class="font-mono text-amber-600">${item.reserved}</td>
      <td class="font-mono text-slate-500">${item.min}</td>
      <td class="font-mono text-slate-600">${item.location}</td>
      <td>
        <span class="badge-status ${item.status === "NORMAL" ? "badge-normal" : item.status === "LOW_STOCK" ? "badge-warning" : "badge-fault"}">
          ${item.status.replace("_", " ")}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function reservePartForSystem(partStr) {
  const part = state.inventory.find(p => partStr.includes(p.partNo));
  if (part) {
    part.reserved += 1;
    renderInventoryTable();
  }
}

function reserveSelectedPart() {
  alert("Auto-Reservation executed for active critical maintenance orders.");
}

// ==============================================================================
// 10. IETM VIEWER
// ==============================================================================
function openIetmSnippet(docId) {
  const doc = IETM_MANUALS.find(d => d.id === docId);
  if (!doc) return;

  document.getElementById("ietm-doc-volume").textContent = doc.volume;
  document.getElementById("ietm-doc-title").textContent = doc.title;
  document.getElementById("ietm-html-content").innerHTML = doc.contentHtml;
  switchTab("tab-ietm");
}

// ==============================================================================
// 11. SENSOR TREND CHART.JS IMPLEMENTATION
// ==============================================================================
function initCharts() {
  const ctx = document.getElementById("telemetryChartCanvas");
  if (!ctx) return;

  // Generate 24 time labels for 6-hour window
  const labels = ["10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30"];
  const values = [410, 412, 415, 414, 418, 422, 430, 438, 445, 452, 460, 468, 474, 479, 482, 485, 485, 484, 485];
  const warningThreshold = Array(labels.length).fill(460);
  const criticalThreshold = Array(labels.length).fill(490);

  telemetryChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Measured Sensor Value (°C)",
          data: values,
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.08)",
          fill: true,
          tension: 0.3,
          borderWidth: 2.5
        },
        {
          label: "Warning Threshold (460 °C)",
          data: warningThreshold,
          borderColor: "#f59e0b",
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false
        },
        {
          label: "Critical Trip (490 °C)",
          data: criticalThreshold,
          borderColor: "#ef4444",
          borderDash: [3, 3],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11, family: "JetBrains Mono" } } }
      },
      scales: {
        y: { grid: { color: "#f1f5f9" }, title: { display: true, text: "Temperature (°C)" } },
        x: { grid: { color: "#f1f5f9" } }
      }
    }
  });
}

function setTrendMetric(metric) {
  state.trendMetric = metric;
  document.querySelectorAll(".trend-metric-btn").forEach(b => b.classList.remove("active", "bg-slate-900", "text-white"));
  
  const map = { temperature: "metric-btn-temp", rpm: "metric-btn-rpm", pressure: "metric-btn-press", vibration: "metric-btn-vib", flow: "metric-btn-flow" };
  const target = document.getElementById(map[metric]);
  if (target) target.classList.add("active", "bg-slate-900", "text-white");

  updateTelemetryChart();
}

function setTrendTimeWindow(win) {
  state.trendTimeWindow = win;
  document.querySelectorAll(".time-win-btn").forEach(b => {
    b.classList.remove("active", "bg-cyan-700", "text-white");
    b.classList.add("bg-white", "text-slate-700");
  });
  event.target.classList.add("active", "bg-cyan-700", "text-white");
  updateTelemetryChart();
}

function updateTelemetryChart() {
  if (!telemetryChartInstance) return;

  const metric = state.trendMetric;
  let labels = ["10:00", "11:00", "12:00", "13:00", "14:00", "14:30"];
  let dataVals = [410, 425, 445, 470, 485, 485];
  let unit = "°C";

  if (metric === "rpm") {
    dataVals = [8200, 8310, 8390, 8420, 8420, 8420];
    unit = "RPM";
  } else if (metric === "pressure") {
    dataVals = [24.1, 24.3, 24.6, 24.8, 24.5, 24.5];
    unit = "bar";
  } else if (metric === "vibration") {
    dataVals = [2.1, 2.5, 3.2, 4.1, 4.8, 4.8];
    unit = "mm/s";
  }

  telemetryChartInstance.data.datasets[0].label = `Measured Sensor Telemetry (${unit})`;
  telemetryChartInstance.data.datasets[0].data = dataVals;
  telemetryChartInstance.options.scales.y.title.text = unit;
  telemetryChartInstance.update();
}

// ==============================================================================
// 12. ANALYTICS CHARTS & TACTICAL ASSISTANT
// ==============================================================================
function renderAnalyticsCharts() {
  const catCanvas = document.getElementById("analyticsCategoryChart");
  const deptCanvas = document.getElementById("analyticsDepartmentChart");

  if (catCanvas && !categoryChartInstance) {
    categoryChartInstance = new Chart(catCanvas, {
      type: "bar",
      data: {
        labels: ["High Temp", "Vibration", "Low Pressure", "Leakage", "Electrical", "Cooling"],
        datasets: [{
          label: "Reported Anomalies",
          data: [6, 4, 3, 2, 2, 5],
          backgroundColor: ["#0284c7", "#38bdf8", "#06b6d4", "#f59e0b", "#64748b", "#ef4444"],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  if (deptCanvas && !departmentChartInstance) {
    departmentChartInstance = new Chart(deptCanvas, {
      type: "radar",
      data: {
        labels: ["Propulsion", "Electrical", "Auxiliary", "HVAC", "Weapons", "Sensors"],
        datasets: [{
          label: "Reliability Index",
          data: [88, 94, 96, 86, 90, 98],
          borderColor: "#0284c7",
          backgroundColor: "rgba(2, 132, 199, 0.2)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

function askAssistantPrompt(promptText) {
  const container = document.getElementById("assistant-response-content");
  const sys = getCurrentSystems().find(s => s.id === state.selectedMachineryId);

  let responseHtml = "";

  if (promptText.includes("check first")) {
    responseHtml = `
      <div><strong>MACHINERY:</strong> ${sys.name} (Sys ${sys.sysNo})</div>
      <div><strong>OBSERVED CONDITION:</strong> Secondary cooler thermal gradient drift (${sys.temp} ${sys.tempUnit})</div>
      <div><strong>INITIAL CHECKS (STEP-BY-STEP):</strong></div>
      <ol class="list-decimal list-inside pl-2 space-y-1 text-slate-200">
        <li>Measure seawater strainer differential pressure across inlet and outlet.</li>
        <li>Check RTD probe electrical resistance with calibrated multimeter.</li>
        <li>Verify 3-way thermostatic valve mechanical position spindle travel.</li>
      </ol>
      <div><strong>EVIDENCE BASE:</strong> IETM Vol IV Sec 3.8.2 Protocol NAV-P15B-382</div>
      <div><strong>ACTION DIRECTIVE:</strong> Isolate cooler if skin temp exceeds 490°C.</div>
      <div><strong>APPROVAL REQUIREMENT:</strong> Senior Engineer Officer sign-off mandated prior to breaking flanges.</div>
    `;
  } else if (promptText.includes("previous similar")) {
    responseHtml = `
      <div><strong>MACHINERY:</strong> ${sys.name}</div>
      <div><strong>MATCHED HISTORICAL RECORD:</strong> FLT-HIST-2025-1104 (Nov 2025, SAT-II Trials)</div>
      <div><strong>PREVIOUS ROOT CAUSE:</strong> Titanium channel silt accumulation + hardened Viton gasket.</div>
      <div><strong>RESOLUTION TIMEFRAME:</strong> 4.2 Operating hours</div>
      <div><strong>AUTHORISED OFFICER:</strong> Cdr V. Nair</div>
      <div><strong>RECOMMENDED ACTION:</strong> Execute flush with fresh demineralized water and renew O-ring set.</div>
    `;
  } else if (promptText.includes("evidence")) {
    responseHtml = `
      <div><strong>AI INFERENCE CONFIDENCE:</strong> 87% Deterministic Matching</div>
      <div><strong>GROUNDING SOURCES:</strong></div>
      <ul class="list-disc list-inside pl-2 text-slate-200">
        <li>IETM Vol IV Sec 3.8.2 (Exact symptom match)</li>
        <li>10 Hz sensor gradient (+18.4% drift over 4.5h)</li>
        <li>Historical SAT-II database correlation</li>
      </ul>
      <div><strong>VERDICT:</strong> Physical fouling highly probable over sensor transducer failure.</div>
    `;
  } else {
    responseHtml = `
      <div><strong>MACHINERY:</strong> ${sys.name}</div>
      <div><strong>REQUIRED SPARE PART:</strong> ${sys.recommendedPart}</div>
      <div><strong>ONBOARD STOCK STATUS:</strong> AVAILABLE IN LOCKER (1 Kit Reserved)</div>
      <div><strong>REQUISITION CODE:</strong> NAV-STORES-PRT-HYD-708</div>
      <div><strong>ACTION:</strong> Auto-reserved for issued work order.</div>
    `;
  }

  container.innerHTML = responseHtml;
}

// ==============================================================================
// 13. AUDIT LOG & EXPORT
// ==============================================================================
function renderAuditLogTable() {
  const tbody = document.getElementById("audit-log-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  state.auditLogs.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-mono text-xs">${log.timestamp}</td>
      <td class="font-bold text-slate-900">${log.machinery}</td>
      <td class="text-rose-700 font-semibold">${log.fault}</td>
      <td class="text-slate-700">${log.aiDiagnosis}</td>
      <td class="font-bold text-emerald-700">${log.engineerDecision}</td>
      <td class="text-slate-600 text-xs">${log.actionTaken}</td>
      <td class="font-mono text-xs">${log.crew}</td>
      <td class="font-mono text-xs">${log.completionTime}</td>
      <td class="font-mono text-[10px] text-slate-400 font-bold">${log.hash}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportAuditLogCsv() {
  let csv = "ID,Timestamp,Machinery,Fault,AI Diagnosis,Engineer Decision,Action Taken,Crew,Duration,Hash\n";
  state.auditLogs.forEach(l => {
    csv += `"${l.id}","${l.timestamp}","${l.machinery}","${l.fault}","${l.aiDiagnosis}","${l.engineerDecision}","${l.actionTaken}","${l.crew}","${l.completionTime}","${l.hash}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `Naval_Intelligence_Audit_Log_${Date.now()}.csv`);
  a.click();
}

// ==============================================================================
// 14. 2-MINUTE EVALUATOR TOUR AUTOMATION
// ==============================================================================
function runTourStep(stepNum) {
  // Update Tour Pills styling
  for (let i = 1; i <= 8; i++) {
    const pill = document.getElementById(`tour-step-${i}`);
    if (pill) pill.classList.toggle("active", i === stepNum);
  }

  switch (stepNum) {
    case 1:
      // Step 1: Ship View Cutaway
      switchTab("tab-ship-view");
      fitCutawayToScreen();
      break;

    case 2:
      // Step 2: Inspect Machine (Sys 07 CPP Hydraulic Pack)
      switchTab("tab-ship-view");
      openMachinerySlideover(state.vesselMode === "NAVAL" ? "N-SYS-07" : "C-SYS-07");
      break;

    case 3:
      // Step 3: Report Fault
      closeMachinerySlideover();
      startSpecificDiagnostic(state.vesselMode === "NAVAL" ? "N-SYS-07" : "C-SYS-07");
      break;

    case 4:
      // Step 4: AI Diagnostic Result
      switchTab("tab-ai-diagnosis");
      break;

    case 5:
      // Step 5: Evidence Sources ("Why did AI say this?")
      switchTab("tab-ai-diagnosis");
      toggleEvidenceSection();
      break;

    case 6:
      // Step 6: Officer Approval
      forwardToOfficerReview();
      break;

    case 7:
      // Step 7: Work Order Execution & Checklist
      switchTab("tab-maintenance");
      document.getElementById("wo-checklist-container")?.scrollIntoView({ behavior: "smooth" });
      break;

    case 8:
      // Step 8: Digital Logbook
      switchTab("tab-logbook");
      break;
  }
}


// ==============================================================================
// 15. SYSTEM CONFIGURATION & EVALUATOR TOOLS
// ==============================================================================
function injectRandomAnomaly() {
  const systems = getCurrentSystems();
  const normalSystems = systems.filter(s => s.status === 'NORMAL');
  if (normalSystems.length === 0) {
    alert('All systems currently have active alerts or scheduled maintenance.');
    return;
  }
  const target = normalSystems[Math.floor(Math.random() * normalSystems.length)];
  target.status = 'WARNING';
  target.temp = Math.round(target.temp + 28 + Math.random() * 20);
  target.vibration = parseFloat((target.vibration + 3.2).toFixed(1));
  
  renderMachineryMarkers();
  updateDashboardStats();
  
  alert('⚠️ TELEMETRY ANOMALY INJECTED!\n\n' +
        'Machinery: [SYS ' + target.sysNo + '] ' + target.name + '\n' +
        'Department: ' + target.category + '\n' +
        'Status: WARNING\n' +
        'Temp: ' + target.temp + target.tempUnit + ' | Vib: ' + target.vibration + ' mm/s\n\n' +
        'Redirecting to Ship View to inspect the anomaly marker.');
  
  switchTab('tab-ship-view');
  openMachinerySlideover(target.id);
}

function resetPrototypeData() {
  if (confirm('Reset prototype simulation data to factory baseline?')) {
    init();
    alert('✅ Prototype telemetry and system states reset to baseline.');
  }
}

function exportAuditLogJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.auditLogs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'naval_intelligence_audit_log_' + state.vesselMode.toLowerCase() + '.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function updateTelemetryFrequency(val) {
  console.log('Telemetry bus polling set to', val, 'ms');
}

function updateSensitivity(val) {
  console.log('Diagnostic model threshold set to', val);
}

# Script to update index.html and build the complete standalone HTML bundle
import base64
import os

def update_index_and_build():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Add Settings button in tab bar if not present
    tab_settings_btn = """        <button class="tab-btn" data-tab="tab-settings" onclick="switchTab('tab-settings')">
          <i class="fa-solid fa-gear"></i> Settings
        </button>"""

    if 'data-tab="tab-settings"' not in html:
        target_btn = """        <button class="tab-btn" data-tab="tab-security" onclick="switchTab('tab-security')">
          <i class="fa-solid fa-network-wired"></i> Architecture &amp; Future
        </button>"""
        if target_btn in html:
            html = html.replace(target_btn, target_btn + "\n" + tab_settings_btn)
            print("Added tab-settings button")
        else:
            print("Warning: target_btn not found")

    settings_section = """      <!-- =======================================================================
           TAB 12: SETTINGS (SYSTEM CONFIGURATION & EVALUATOR TOOLS)
           ======================================================================= -->
      <section id="tab-settings" class="tab-content hidden space-y-6">
        
        <!-- Header -->
        <div class="bg-white p-5 rounded-lg border border-slate-200 eng-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-cyan-700 uppercase tracking-wider">SYSTEM CONFIGURATION</span>
              <span class="badge-status badge-normal text-[10px]">ALL DAEMONS ACTIVE</span>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-1 uppercase">Engineering Platform Settings &amp; Telemetry Simulator</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage onboard air-gapped LAN bindings, local AI model inference parameters, telemetry polling rates, and demonstration tools.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="injectRandomAnomaly()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow transition-all flex items-center gap-2">
              <i class="fa-solid fa-bolt"></i> INJECT TEST FAULT (EVALUATOR DEMO)
            </button>
            <button onclick="resetPrototypeData()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 transition-all flex items-center gap-1.5">
              <i class="fa-solid fa-rotate-left"></i> RESET SIMULATION
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <!-- Card 1: Local Network & Edge Architecture -->
          <div class="bg-white p-5 rounded-lg border border-slate-200 eng-card space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <i class="fa-solid fa-network-wired text-cyan-600"></i> Local Onboard LAN
              </h3>
              <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">AIR-GAPPED</span>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">EDGE SERVER IP ADDRESS</span>
                <input type="text" value="192.168.1.104 (Port 8443 TLS)" readonly class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700">
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">INDUSTRIAL PROTOCOL BUS</span>
                <input type="text" value="Modbus TCP / NMEA 0183 (Emulated)" readonly class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700">
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">TELEMETRY INGESTION FREQUENCY</span>
                <select id="setting-telemetry-rate" onchange="updateTelemetryFrequency(this.value)" class="w-full mt-1 p-2 bg-white border border-slate-300 rounded font-medium text-slate-800">
                  <option value="1000" selected>1.0 Second (Real-time Precision)</option>
                  <option value="2000">2.0 Seconds (Standard Marine Polling)</option>
                  <option value="5000">5.0 Seconds (Low Power Watch)</option>
                </select>
              </div>
              <div class="pt-2 flex items-center justify-between text-slate-600">
                <span>External Cloud Sync:</span>
                <span class="font-bold text-rose-600 flex items-center gap-1"><i class="fa-solid fa-lock"></i> DISABLED BY POLICY</span>
              </div>
            </div>
          </div>

          <!-- Card 2: AI Diagnostic Parameters -->
          <div class="bg-white p-5 rounded-lg border border-slate-200 eng-card space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <i class="fa-solid fa-microchip text-indigo-600"></i> AI Inference Parameters
              </h3>
              <span class="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-bold">QUANTIZED FP16</span>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">DIAGNOSTIC SENSITIVITY BIAS</span>
                <select id="setting-diag-sensitivity" onchange="updateSensitivity(this.value)" class="w-full mt-1 p-2 bg-white border border-slate-300 rounded font-medium text-slate-800">
                  <option value="0.90">Conservative (90% Confidence Reqd)</option>
                  <option value="0.80" selected>Standard Naval Protocol (80% Reqd)</option>
                  <option value="0.70">Sensitive Early Warning (70% Reqd)</option>
                </select>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">EXPLAINABILITY / EVIDENCE ENFORCEMENT</span>
                <input type="text" value="Mandatory IETM Manual Citation (Strict)" readonly class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700">
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">ANOMALY DETECTION THRESHOLD</span>
                <input type="text" value="Z-Score > 2.50σ (Statistical Trend Trigger)" readonly class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700">
              </div>
              <div class="pt-2 flex items-center justify-between text-slate-600">
                <span>Auditory Alert Chimes:</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-audio-chime" checked class="sr-only peer">
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          <!-- Card 3: Security & Audit Controls -->
          <div class="bg-white p-5 rounded-lg border border-slate-200 eng-card space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <i class="fa-solid fa-shield-halved text-emerald-600"></i> Audit &amp; Data Security
              </h3>
              <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">SHA-256 SIGNED</span>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">OFFICER AUTHORIZATION TOKEN</span>
                <input type="text" value="TOKEN-ENG-OFFICER-P15B-VERIFIED" readonly class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-slate-700">
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">DIGITAL LOG INTEGRITY</span>
                <div class="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-mono text-xs flex items-center justify-between mt-1">
                  <span>Cryptographic Ledger:</span>
                  <span class="font-bold">VERIFIED HASH</span>
                </div>
              </div>
              <div class="pt-2 space-y-2">
                <button onclick="exportAuditLogJson()" class="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-xs shadow-sm flex items-center justify-center gap-2 transition-colors">
                  <i class="fa-solid fa-file-export"></i> EXPORT AUDIT TRAIL (JSON)
                </button>
                <button onclick="returnToVesselSelection()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 flex items-center justify-center gap-2 transition-colors">
                  <i class="fa-solid fa-arrow-right-arrow-left"></i> SWITCH VESSEL PROFILE
                </button>
              </div>
            </div>
          </div>

        </div>

      </section>"""

    if 'id="tab-settings"' not in html:
        target_main = "      </section>\n\n    </main>"
        if target_main in html:
            html = html.replace(target_main, "      </section>\n\n" + settings_section + "\n\n    </main>")
            print("Added tab-settings section")
        else:
            print("Warning: target_main not found")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html updated successfully.")

    # Read stylesheets and scripts
    with open('styles.css', 'r', encoding='utf-8') as f:
        styles_css = f.read()
    with open('data.js', 'r', encoding='utf-8') as f:
        data_js = f.read()
    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    # Read and encode uploaded images
    with open('assets/ins_visakhapatnam_p15b_cutaway.png', 'rb') as f:
        p15b_b64 = base64.b64encode(f.read()).decode('ascii')
    with open('assets/cargo_vessel_cutaway.png', 'rb') as f:
        cargo_b64 = base64.b64encode(f.read()).decode('ascii')

    p15b_data_uri = f"data:image/png;base64,{p15b_b64}"
    cargo_data_uri = f"data:image/png;base64,{cargo_b64}"

    print(f"P15B Data URI length: {len(p15b_data_uri)}")
    print(f"Cargo Data URI length: {len(cargo_data_uri)}")

    # Create self-contained bundle
    complete_html = html

    # Replace <link rel="stylesheet" href="styles.css"> with inline <style>
    style_tag = f"<style>\n{styles_css}\n</style>"
    complete_html = complete_html.replace('<link rel="stylesheet" href="styles.css">', style_tag)

    # In the cutaway image, set initial src to p15b_data_uri
    complete_html = complete_html.replace(
        'src="assets/ins_visakhapatnam_p15b_cutaway.png"',
        f'src="{p15b_data_uri}"'
    )

    # Embed data.js and app.js with the base64 constants
    embedded_scripts = f"""  <script>
// Base64 Embedded Cutaway Image Assets (User-Uploaded High-Resolution Drawings)
const P15B_CUTAWAY_SRC = "{p15b_data_uri}";
const CARGO_CUTAWAY_SRC = "{cargo_data_uri}";
window.P15B_CUTAWAY_SRC = P15B_CUTAWAY_SRC;
window.CARGO_CUTAWAY_SRC = CARGO_CUTAWAY_SRC;

{data_js}

{app_js}
  </script>"""

    # Replace script tags at the bottom
    complete_html = complete_html.replace(
        '  <!-- Core Script Dependencies -->\n  <script src="data.js"></script>\n  <script src="app.js"></script>',
        f'  <!-- Core Script Dependencies (Self-Contained Bundled) -->\n{embedded_scripts}'
    )

    # Ensure app.js uses P15B_CUTAWAY_SRC and CARGO_CUTAWAY_SRC
    complete_html = complete_html.replace(
        'cutawayImg.src = "assets/ins_visakhapatnam_p15b_cutaway.png";',
        'cutawayImg.src = P15B_CUTAWAY_SRC;'
    )
    complete_html = complete_html.replace(
        'cutawayImg.src = "assets/cargo_vessel_cutaway.png";',
        'cutawayImg.src = CARGO_CUTAWAY_SRC;'
    )

    # Save to naval_intelligence_system_complete.html
    with open('naval_intelligence_system_complete.html', 'w', encoding='utf-8') as f:
        f.write(complete_html)
    print(f"naval_intelligence_system_complete.html generated: {len(complete_html)} bytes")

    # Also save as index.html so Vercel, Netlify, or local folder deploys instantly with 100% self-containment!
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(complete_html)
    print(f"index.html also updated to self-contained bundle: {len(complete_html)} bytes")

if __name__ == '__main__':
    update_index_and_build()

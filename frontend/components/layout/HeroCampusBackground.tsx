import React from 'react';

/**
 * HeroCampusBackground
 * 
 * Stage 1: Live Digital Campus Operations Background
 * 
 * Features:
 * - Subtle blueprint architectural campus building outlines:
 *   Hostel A, Hostel B (Room 204 active), Mess/Dining, Academic & Labs Block,
 *   Main Gate Sentry Post, Central Nexora Request Engine, Facilities Workshop, Admin Cockpit.
 * - Technical coordinate grid & campus topography network.
 * - Connecting fiber/request infrastructure pipelines.
 * - Operational status indicators (color-coded for Normal, Active, Alert, Sentry).
 * - Moving data & request signals (slow, elegant SVG animateMotion).
 * - Soft ambient radial glows that never compromise text readability.
 * - Fully accessible and strictly respects prefers-reduced-motion.
 */
export default function HeroCampusBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden [mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,#000_40%,transparent_100%)]"
      aria-hidden="true"
    >
      {/* Faint Technical Coordinate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f263814_1px,transparent_1px),linear-gradient(to_bottom,#1f263814_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      <svg
        className="absolute inset-0 w-full h-full hero-animated-bg opacity-40 sm:opacity-50"
        viewBox="0 0 1440 860"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft Radial Ambient Glows for Campus Clusters */}
          <radialGradient id="glow-engine" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="glow-gate" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="glow-hostel" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="glow-mess" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="glow-academic" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="glow-admin" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>

          {/* Node Glow Filter */}
          <filter id="hero-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Glow Zones */}
        <circle cx="720" cy="160" r="160" fill="url(#glow-engine)" />
        <circle cx="200" cy="650" r="130" fill="url(#glow-gate)" />
        <circle cx="180" cy="150" r="120" fill="url(#glow-hostel)" />
        <circle cx="360" cy="490" r="110" fill="url(#glow-mess)" />
        <circle cx="1280" cy="380" r="130" fill="url(#glow-academic)" />
        <circle cx="1240" cy="650" r="130" fill="url(#glow-admin)" />

        {/* ==============================================================
            1. FAINT CAMPUS BUILDING BLUEPRINT OUTLINES
           ============================================================== */}

        {/* NODE 1: HOSTEL BLOCK B (Top-Left) */}
        <g opacity="0.45">
          {/* Perimeter & Dorm Units */}
          <rect x="110" y="105" width="145" height="95" rx="3" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 2" />
          <line x1="110" y1="140" x2="255" y2="140" stroke="#334155" strokeWidth="0.6" />
          <rect x="120" y="115" width="38" height="20" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="165" y="115" width="38" height="20" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="210" y="115" width="35" height="20" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          
          <rect x="120" y="150" width="38" height="22" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="165" y="150" width="38" height="22" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          {/* Room 204 Alert Marker (Plumbing Leak Ticket NX-10291) */}
          <rect x="210" y="150" width="35" height="22" rx="1.5" stroke="#f43f5e" strokeWidth="0.9" strokeOpacity="0.75" />
          <circle cx="227" cy="161" r="2.5" fill="#f43f5e" opacity="0.9" filter="url(#hero-node-glow)" />

          {/* Location Marker & Badge */}
          <text x="112" y="96" fill="#f43f5e" opacity="0.75" fontFamily="monospace" fontSize="8" letterSpacing="1">
            HOSTEL B // RM 204 [PLUMBING ALERT]
          </text>
          <text x="112" y="213" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            BLK-B RESIDENCE • 120 ROOMS
          </text>
        </g>

        {/* NODE 2: HOSTEL BLOCK A (Mid-Left) */}
        <g opacity="0.4">
          <rect x="65" y="320" width="130" height="85" rx="3" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 2" />
          {/* Inner Courtyard / Wing Grid */}
          <rect x="80" y="335" width="100" height="22" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="80" y="367" width="45" height="25" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="135" y="367" width="45" height="25" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <circle cx="102" cy="379" r="2" fill="#10b981" opacity="0.8" />
          <circle cx="157" cy="379" r="2" fill="#10b981" opacity="0.8" />

          {/* Location Marker */}
          <text x="67" y="312" fill="#10b981" opacity="0.75" fontFamily="monospace" fontSize="8" letterSpacing="1">
            HOSTEL A // RESIDENCE [NOMINAL]
          </text>
          <text x="67" y="418" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            BLK-A RESIDENCE • CURFEW SYNC: OK
          </text>
        </g>

        {/* NODE 3: CAMPUS MESS & DINING (West-Center Low) */}
        <g opacity="0.42">
          <rect x="300" y="460" width="130" height="75" rx="3" stroke="#059669" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2 2" />
          <line x1="300" y1="488" x2="430" y2="488" stroke="#334155" strokeWidth="0.6" />
          {/* Dining Table Bays */}
          <rect x="312" y="498" width="22" height="26" rx="1" stroke="#334155" strokeWidth="0.6" />
          <rect x="342" y="498" width="22" height="26" rx="1" stroke="#334155" strokeWidth="0.6" />
          <rect x="372" y="498" width="22" height="26" rx="1" stroke="#334155" strokeWidth="0.6" />
          <rect x="402" y="498" width="18" height="26" rx="1" stroke="#059669" strokeWidth="0.6" strokeOpacity="0.6" />
          <circle cx="411" cy="511" r="2" fill="#059669" opacity="0.8" />

          {/* Location Marker */}
          <text x="302" y="452" fill="#059669" opacity="0.75" fontFamily="monospace" fontSize="8" letterSpacing="1">
            MESS // CENTRAL DINING CORE
          </text>
          <text x="302" y="547" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            CAPACITY: 600 • MEAL TOKEN PASS
          </text>
        </g>

        {/* NODE 4: MAIN SENTRY GATE 01 (Bottom-Left) */}
        <g opacity="0.45">
          <rect x="140" y="615" width="140" height="80" rx="3" stroke="#06b6d4" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 2" />
          {/* Barrier Line & Checkpoint */}
          <line x1="140" y1="650" x2="280" y2="650" stroke="#334155" strokeWidth="0.6" />
          <rect x="155" y="660" width="40" height="24" rx="2" stroke="#06b6d4" strokeWidth="0.7" strokeOpacity="0.6" />
          <circle cx="175" cy="672" r="2.5" fill="#06b6d4" opacity="0.9" filter="url(#hero-node-glow)" />
          {/* Optical Sentry Scanner Bar */}
          <line x1="210" y1="662" x2="265" y2="662" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="4 2" />
          <line x1="210" y1="675" x2="265" y2="675" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 3" />

          {/* Location Marker */}
          <text x="142" y="607" fill="#06b6d4" opacity="0.8" fontFamily="monospace" fontSize="8" letterSpacing="1">
            MAIN GATE 01 // SENTRY SCANNER
          </text>
          <text x="142" y="707" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            HMAC QR TOKEN • 4-DIGIT PIN SENTRY
          </text>
        </g>

        {/* NODE 5: CENTRAL NEXORA REQUEST ENGINE (Top-Center) */}
        <g opacity="0.5">
          {/* Central Router Core Hexagon */}
          <polygon
            points="720,95 785,132 785,208 720,245 655,208 655,132"
            stroke="#d4af37"
            strokeWidth="0.9"
            strokeOpacity="0.65"
            strokeDasharray="4 3"
          />
          {/* Inner Orbital Concentric Rings */}
          <circle cx="720" cy="170" r="36" stroke="#475569" strokeWidth="0.6" strokeDasharray="3 3" />
          <circle cx="720" cy="170" r="20" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.7" />
          <circle cx="720" cy="170" r="4.5" fill="#d4af37" opacity="0.95" filter="url(#hero-node-glow)" />

          {/* Technical Location Marker */}
          <text x="635" y="82" fill="#d4af37" opacity="0.85" fontFamily="monospace" fontSize="8.5" letterSpacing="1.5">
            NEXORA REQUEST ENGINE // CORE FSM
          </text>
          <text x="645" y="260" fill="#94a3b8" opacity="0.6" fontFamily="monospace" fontSize="7" letterSpacing="0.8">
            ROUTING ENGINE • REGEX DISPATCH &lt;12ms
          </text>
        </g>

        {/* NODE 6: FACILITIES & MAINTENANCE WORKSHOPS (Top-Right) */}
        <g opacity="0.45">
          <rect x="1190" y="110" width="150" height="90" rx="3" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 2" />
          <line x1="1190" y1="145" x2="1340" y2="145" stroke="#334155" strokeWidth="0.6" />
          {/* Staging Bays: Plumbing & Electrical */}
          <rect x="1205" y="155" width="34" height="32" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="1248" y="155" width="34" height="32" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          {/* Plumbing Work Order Desk Highlight */}
          <rect x="1291" y="155" width="36" height="32" rx="1.5" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.6" />
          <circle cx="1309" cy="171" r="2.5" fill="#f59e0b" opacity="0.85" filter="url(#hero-node-glow)" />

          {/* Location Marker */}
          <text x="1192" y="101" fill="#f59e0b" opacity="0.75" fontFamily="monospace" fontSize="8" letterSpacing="1">
            FACILITIES // WORK ORDERS [PLUMBING]
          </text>
          <text x="1192" y="213" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            STAFF DESK • ASSIGNED: RAMESH KUMAR
          </text>
        </g>

        {/* NODE 7: ACADEMIC & LABS BLOCK (Mid-Right) */}
        <g opacity="0.42">
          <rect x="1230" y="330" width="150" height="85" rx="3" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 2" />
          {/* Lecture Hall & Lab Blueprint */}
          <path d="M 1245 355 Q 1285 345 1325 355" stroke="#334155" strokeWidth="0.7" fill="none" />
          <path d="M 1245 370 Q 1285 360 1325 370" stroke="#334155" strokeWidth="0.7" fill="none" />
          {/* Lab 302 Electrical Triage */}
          <rect x="1335" y="350" width="32" height="28" rx="1.5" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.5" />
          <circle cx="1351" cy="364" r="2" fill="#d4af37" opacity="0.8" />

          {/* Location Marker */}
          <text x="1232" y="321" fill="#d4af37" opacity="0.75" fontFamily="monospace" fontSize="8" letterSpacing="1">
            ACADEMIC BLOCK // LAB COMPLEX (LAB-302)
          </text>
          <text x="1232" y="428" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            ELECTRICAL TRIAGE • SLA 98.4% COMPLIANCE
          </text>
        </g>

        {/* NODE 8: INSTITUTIONAL ADMIN COCKPIT (Bottom-Right) */}
        <g opacity="0.45">
          <rect x="1170" y="615" width="160" height="85" rx="3" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 2" />
          {/* Governance Wing Roofline */}
          <polygon points="1250,598 1200,615 1300,615" stroke="#475569" strokeWidth="0.6" fill="none" />
          <rect x="1190" y="630" width="45" height="26" rx="1.5" stroke="#334155" strokeWidth="0.6" />
          <rect x="1250" y="630" width="55" height="26" rx="1.5" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.6" />
          <circle cx="1277" cy="643" r="3" fill="#a855f7" opacity="0.9" filter="url(#hero-node-glow)" />

          {/* Location Marker */}
          <text x="1172" y="591" fill="#a855f7" opacity="0.8" fontFamily="monospace" fontSize="8" letterSpacing="1">
            ADMIN COCKPIT // SECTION 44
          </text>
          <text x="1172" y="712" fill="#64748b" opacity="0.6" fontFamily="monospace" fontSize="7">
            SYSTEMIC CLUSTER ALERTS • AUDIT LOGS
          </text>
        </g>

        {/* ==============================================================
            2. CONNECTING INFRASTRUCTURE PIPELINES (SVG PATHS)
           ============================================================== */}

        {/* Path 1A: Hostel B -> Request Engine */}
        <path
          id="path-hostel-b-engine"
          d="M 255 160 L 450 160 L 550 170 L 655 170"
          stroke="#64748b"
          strokeWidth="0.9"
          strokeDasharray="3 4"
          strokeOpacity="0.35"
          fill="none"
        />

        {/* Path 1B: Request Engine -> Facilities / Plumbing Staff */}
        <path
          id="path-engine-facilities"
          d="M 785 170 L 930 170 L 1060 160 L 1190 160"
          stroke="#64748b"
          strokeWidth="0.9"
          strokeDasharray="3 4"
          strokeOpacity="0.35"
          fill="none"
        />

        {/* Path 2: Student (Hostel A) -> Main Gate Sentry Checkpoint */}
        <path
          id="path-student-gate"
          d="M 130 405 L 130 510 L 180 570 L 180 615"
          stroke="#06b6d4"
          strokeWidth="0.9"
          strokeDasharray="3 4"
          strokeOpacity="0.38"
          fill="none"
        />

        {/* Path 3: Hostel A -> Campus Dining Mess */}
        <path
          id="path-hostel-mess"
          d="M 195 380 L 260 420 L 300 480"
          stroke="#059669"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* Path 4: Academic Block -> Request Engine */}
        <path
          id="path-academic-engine"
          d="M 1230 365 L 1050 310 L 890 230 L 785 180"
          stroke="#f59e0b"
          strokeWidth="0.8"
          strokeDasharray="3 4"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* Path 5: Request Engine -> Admin Cockpit (Section 44 Cluster Telemetry) */}
        <path
          id="path-engine-admin"
          d="M 750 240 L 920 390 L 1070 510 L 1170 630"
          stroke="#a855f7"
          strokeWidth="0.8"
          strokeDasharray="3 4"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* Secondary Campus Cross-Grid Lines (Subtle Campus Backbone) */}
        <path
          d="M 280 650 L 500 590 L 720 540 L 960 590 L 1170 650"
          stroke="#334155"
          strokeWidth="0.6"
          strokeDasharray="2 5"
          strokeOpacity="0.22"
          fill="none"
        />
        <path
          d="M 430 500 L 580 430 L 720 380 L 880 430 L 1230 380"
          stroke="#334155"
          strokeWidth="0.6"
          strokeDasharray="2 5"
          strokeOpacity="0.2"
          fill="none"
        />

        {/* ==============================================================
            3. OPERATIONAL JUNCTION NODES & STATUS PINS
           ============================================================== */}

        {/* Hostel B Node Pin */}
        <circle cx="255" cy="160" r="3" fill="#f43f5e" opacity="0.85" />
        <circle cx="255" cy="160" r="7" stroke="#f43f5e" strokeWidth="0.6" strokeOpacity="0.35" />

        {/* Request Engine Entry / Exit Pins */}
        <circle cx="655" cy="170" r="3.5" fill="#d4af37" opacity="0.9" filter="url(#hero-node-glow)" />
        <circle cx="785" cy="170" r="3.5" fill="#d4af37" opacity="0.9" filter="url(#hero-node-glow)" />

        {/* Facilities Work Order Pin */}
        <circle cx="1190" cy="160" r="3.2" fill="#f59e0b" opacity="0.85" />
        <circle cx="1190" cy="160" r="7" stroke="#f59e0b" strokeWidth="0.6" strokeOpacity="0.35" />

        {/* Hostel A Node Pin */}
        <circle cx="130" cy="405" r="3" fill="#10b981" opacity="0.8" />
        <circle cx="130" cy="405" r="6" stroke="#10b981" strokeWidth="0.6" strokeOpacity="0.3" />

        {/* Mess Node Pin */}
        <circle cx="300" cy="480" r="3" fill="#059669" opacity="0.8" />

        {/* Main Gate Pin */}
        <circle cx="180" cy="615" r="3.5" fill="#06b6d4" opacity="0.9" filter="url(#hero-node-glow)" />
        <circle cx="180" cy="615" r="8" stroke="#06b6d4" strokeWidth="0.6" strokeOpacity="0.4" />

        {/* Academic Node Pin */}
        <circle cx="1230" cy="365" r="3" fill="#d4af37" opacity="0.8" />

        {/* Admin Node Pin */}
        <circle cx="1170" cy="630" r="3.5" fill="#a855f7" opacity="0.85" filter="url(#hero-node-glow)" />
        <circle cx="1170" cy="630" r="7" stroke="#a855f7" strokeWidth="0.6" strokeOpacity="0.35" />

        {/* ==============================================================
            4. MOVING DATA & REQUEST SIGNALS (Slow, Elegant, Native SVG)
           ============================================================== */}

        {/* SIGNAL 1: HOSTEL B -> REQUEST ENGINE (Plumbing ticket NX-10291, 8.5s) */}
        <circle r="2.8" fill="#d4af37" filter="url(#hero-node-glow)" opacity="0.9">
          <animateMotion dur="8.5s" repeatCount="indefinite">
            <mpath href="#path-hostel-b-engine" />
          </animateMotion>
        </circle>

        {/* SIGNAL 2: REQUEST ENGINE -> FACILITIES / STAFF (Assigned to Ramesh Kumar, 7.5s) */}
        <circle r="2.8" fill="#f59e0b" filter="url(#hero-node-glow)" opacity="0.9">
          <animateMotion dur="7.5s" repeatCount="indefinite">
            <mpath href="#path-engine-facilities" />
          </animateMotion>
        </circle>

        {/* SIGNAL 3: STUDENT -> MAIN GATE SENTRY (HMAC Gate Pass, 9.5s) */}
        <circle r="2.8" fill="#06b6d4" filter="url(#hero-node-glow)" opacity="0.9">
          <animateMotion dur="9.5s" repeatCount="indefinite">
            <mpath href="#path-student-gate" />
          </animateMotion>
        </circle>

        {/* SIGNAL 4: HOSTEL A -> DINING MESS (Breakfast/Dinner Token Pass, 11s) */}
        <circle r="2.4" fill="#059669" filter="url(#hero-node-glow)" opacity="0.8">
          <animateMotion dur="11s" repeatCount="indefinite">
            <mpath href="#path-hostel-mess" />
          </animateMotion>
        </circle>

        {/* SIGNAL 5: ACADEMIC BLOCK -> REQUEST ENGINE (Lab 302 Power Trip Triage, 9s) */}
        <circle r="2.4" fill="#d4af37" filter="url(#hero-node-glow)" opacity="0.8">
          <animateMotion dur="9s" repeatCount="indefinite">
            <mpath href="#path-academic-engine" />
          </animateMotion>
        </circle>

        {/* SIGNAL 6: REQUEST ENGINE -> ADMIN (Section 44 Cluster Telemetry, 12s) */}
        <circle r="2.6" fill="#a855f7" filter="url(#hero-node-glow)" opacity="0.85">
          <animateMotion dur="12s" repeatCount="indefinite">
            <mpath href="#path-engine-admin" />
          </animateMotion>
        </circle>

        {/* ==============================================================
            5. TECHNICAL TELEMETRY & COORDINATE MARKS
           ============================================================== */}
        <g opacity="0.25" fontFamily="monospace" fontSize="7.5" fill="#64748b">
          <text x="35" y="42">[CAMPUS_OS // 20.2961°N, 85.8245°E // BPUT_HUB]</text>
          <text x="1190" y="42">[TELEMETRY: LIVE // ROUTING: DETERMINISTIC]</text>
          <text x="35" y="830">[INFRA_GRID: 8 NODES // SENTRY_CHANNEL: HMAC-256]</text>
          <text x="1230" y="830">[CLUSTER_DETECTION: SEC_44 ACTIVE]</text>
        </g>
      </svg>
    </div>
  );
}

export const initialClaimChart = [
  {
    id: "el-1",
    elementNumber: "1",
    label: "Claim 1 [Limitation 1.a]",
    claimElement: "A temperature control device comprising: a wireless communication module configured to connect to a local area network;",
    accusedFeature: 'Acme Thermostat product page states: "WiFi-enabled smart thermostat connects to your home network"',
    aiReasoning: "The Acme device has WiFi capability which satisfies the wireless communication module requirement.",
    status: "confirmed", // "confirmed" | "weak" | "unsupported"
    history: [], // previous versions of {accusedFeature, aiReasoning, status}
    keywords: ["temperature control", "wireless", "wifi", "communication module", "network", "local area network", "connect"]
  },
  {
    id: "el-2",
    elementNumber: "2",
    label: "Claim 1 [Limitation 1.b]",
    claimElement: "a processor configured to execute a machine learning algorithm to predict user temperature preferences based on historical occupancy patterns;",
    accusedFeature: 'Acme User Manual (Rev 2.1), Section 4: "Smart Schedule feature observes daily routine to recommend energy-saving temperatures."',
    aiReasoning: "Acme Smart Schedule observes daily routines, showing rudimentary prediction of temperature settings.",
    status: "weak",
    history: [],
    keywords: ["processor", "machine learning", "ml", "algorithm", "predict", "preference", "preferences", "occupancy", "smart schedule", "routine", "historical"]
  },
  {
    id: "el-3",
    elementNumber: "3",
    label: "Claim 1 [Limitation 1.c]",
    claimElement: "and a control interface configured to automatically adjust ambient temperature based on the predicted user temperature preferences.",
    accusedFeature: 'Acme Technical Specs, Sheet 3: "Dual-relay 24VAC control interface triggers HVAC heating and cooling cycles automatically."',
    aiReasoning: "The relay interface automatically adjusts HVAC state in response to calculated temperature setpoints.",
    status: "confirmed",
    history: [],
    keywords: ["control interface", "automatically adjust", "ambient temperature", "hvac", "relay", "heating", "cooling", "adjust"]
  }
];

export const initialUploadedDocs = [
  { id: "doc-1", name: "Acme_Thermostat_Datasheet_v1.2.pdf", type: "pdf", size: "2.4 MB", dateAdded: "Today" },
  { id: "doc-2", name: "https://acme-hardware.com/products/smart-thermostat-pro", type: "url", size: "Webpage", dateAdded: "Today" },
  { id: "doc-3", name: "Acme_SmartThermostat_UserManual_2023.pdf", type: "pdf", size: "4.8 MB", dateAdded: "Today" }
];

export const defaultSystemPrompt = "Be conservative — flag anything not explicitly stated in the evidence. Require verbatim document quotes and rigorous element-by-element limitation mapping. Avoid speculative inferences.";

export const promptPresets = [
  {
    id: "conservative",
    title: "Conservative & Literal (Default)",
    description: "Strict patent literalism. Flag any gap not verbatim in evidence.",
    prompt: "Be conservative — flag anything not explicitly stated in the evidence. Require verbatim document quotes and rigorous element-by-element limitation mapping. Avoid speculative inferences."
  },
  {
    id: "technical",
    title: "Technical Litigation-Ready",
    description: "Deep mapping with architecture, hardware signals, and protocol analysis.",
    prompt: "Provide rigorous technical evidence mapping. Trace signals from processor registers through bus architecture to accused mechanical actuators, citing specific document sections."
  },
  {
    id: "broad",
    title: "Broad Claim Construction",
    description: "Plain & ordinary meaning (Phillips v. AWH Corp) with functional equivalency.",
    prompt: "Constrain claim terms according to their plain and ordinary meaning under Phillips v. AWH Corp. Emphasize functional and structural equivalence in accused features."
  }
];

// Keywords for uncovered topic check (Edge Case 3 trigger)
export const UNCOVERED_TOPICS = [
  "temperature sensor array",
  "sensor array",
  "humidity",
  "infrared",
  "ambient light sensor",
  "thermopile",
  "multi-zone sensor"
];

// Pre-seeded multi-case catalog for switching and past charts
export const PRESET_CASES = [
  {
    id: "case-thermostat",
    title: "Smart Thermostat HVAC Control",
    patentNumber: "US 10,489,122 B2",
    accusedProduct: "Acme Smart Thermostat Pro",
    lastModified: "Today at 09:15 AM",
    systemPrompt: defaultSystemPrompt,
    uploadedDocs: initialUploadedDocs,
    claimChart: initialClaimChart
  },
  {
    id: "case-biosensor",
    title: "Wearable Photoplethysmography Sensor",
    patentNumber: "US 10,912,490 B2",
    accusedProduct: "Nova Watch Ultra",
    lastModified: "Yesterday",
    systemPrompt: "Strict evidence mapping. Emphasize sensor signal-to-noise ratio and optical emitter wavelengths.",
    uploadedDocs: [
      { id: "doc-b1", name: "NovaWatch_Ultra_TechManual_v3.pdf", type: "pdf", size: "3.2 MB", dateAdded: "Yesterday" },
      { id: "doc-b2", name: "https://nova-tech.com/devices/watch-ultra/specs", type: "url", size: "Webpage", dateAdded: "Yesterday" }
    ],
    claimChart: [
      {
        id: "bio-1",
        elementNumber: "1",
        label: "Claim 7 [Limitation 7.a]",
        claimElement: "A wearable physiological monitoring device comprising: an optical sensor array including a plurality of light emitting diodes configured to emit light at multiple distinct optical wavelengths into biological tissue;",
        accusedFeature: 'Nova Watch Ultra Technical Manual, p. 12: "Multi-spectral optical bio-sensor incorporates 4 LED emitters (660nm red, 940nm infrared, 525nm green) positioned on the ceramic case back to illuminate subcutaneous tissue."',
        aiReasoning: "The accused multi-spectral bio-sensor explicitly embeds 4 LEDs emitting light at distinct optical wavelengths into biological tissue, literally meeting limitation 7.a.",
        status: "confirmed",
        history: [],
        keywords: ["wearable", "optical", "sensor", "light emitting", "led", "wavelengths", "tissue", "photoplethysmography"]
      },
      {
        id: "bio-2",
        elementNumber: "2",
        label: "Claim 7 [Limitation 7.b]",
        claimElement: "a photodetector configured to capture light reflected from the biological tissue and output a plethysmographic signal modulated by blood perfusion;",
        accusedFeature: 'Nova Watch Hardware Specs, Sheet 8: "Custom high-gain photodiode array samples reflected optical pulses at 100Hz and outputs raw PPG voltage data."',
        aiReasoning: "The high-gain photodiode array detects reflected photons and converts optical modulation to a digital plethysmography signal corresponding to blood volume changes.",
        status: "confirmed",
        history: [],
        keywords: ["photodetector", "photodiode", "reflected", "plethysmographic", "signal", "blood", "perfusion"]
      },
      {
        id: "bio-3",
        elementNumber: "3",
        label: "Claim 7 [Limitation 7.c]",
        claimElement: "and a digital signal processor configured to compute a blood oxygen saturation value while filtering motion artifacts based on simultaneous accelerometer data.",
        accusedFeature: 'Nova OS Firmware Release Notes: "SpO2 calculation algorithm utilizes wrist movement indicators to suppress noise during sleep tracking."',
        aiReasoning: "Reference to wrist movement noise suppression is preliminary; evidence lacks an explicit algorithmic filter pipeline proving accelerometer correlation.",
        status: "weak",
        history: [],
        keywords: ["digital signal processor", "dsp", "blood oxygen", "saturation", "spo2", "motion artifacts", "accelerometer"]
      }
    ]
  },
  {
    id: "case-autonomous",
    title: "Autonomous Vehicle LiDAR & Vision Sensor Fusion",
    patentNumber: "US 11,204,601 B1",
    accusedProduct: "Apex Drive Autopilot System",
    lastModified: "Sep 2, 2026",
    systemPrompt: "Provide deep technical mapping with firmware register citations, circuit-level corroboration, and USPTO Phillips construction.",
    uploadedDocs: [
      { id: "doc-a1", name: "Apex_Drive_Hardware_Architecture_v2.pdf", type: "pdf", size: "6.5 MB", dateAdded: "Sep 2" },
      { id: "doc-a2", name: "Apex_Sensor_SpecSheet_2026.pdf", type: "pdf", size: "1.9 MB", dateAdded: "Sep 2" }
    ],
    claimChart: [
      {
        id: "auto-1",
        elementNumber: "1",
        label: "Claim 12 [Limitation 12.a]",
        claimElement: "A perception system for an autonomous vehicle, comprising: a pulsed laser LiDAR scanner configured to generate a point cloud of an ambient roadway environment;",
        accusedFeature: 'Apex Hardware Architecture, Section 3.1: "Solid-state LiDAR module pulses 905nm laser diodes to construct 300,000 pts/sec 3D point cloud of surroundings."',
        aiReasoning: "The solid-state LiDAR module pulses laser diodes to construct 3D point cloud data of the roadway environment, satisfying the structural scanner limitation.",
        status: "confirmed",
        history: [],
        keywords: ["lidar", "pulsed laser", "point cloud", "scanner", "autonomous vehicle", "perception"]
      },
      {
        id: "auto-2",
        elementNumber: "2",
        label: "Claim 12 [Limitation 12.b]",
        claimElement: "a multi-camera vision array configured to capture stereoscopic RGB video frames of roadway objects;",
        accusedFeature: 'Apex Sensor Spec Sheet: "Triple forward-facing 8MP HDR camera array captures 60fps stereo imagery with 120-degree field of view."',
        aiReasoning: "The triple forward camera captures synchronized stereoscopic frames satisfying the multi-camera vision array limitation.",
        status: "confirmed",
        history: [],
        keywords: ["multi-camera", "camera", "stereoscopic", "rgb", "video", "roadway"]
      },
      {
        id: "auto-3",
        elementNumber: "3",
        label: "Claim 12 [Limitation 12.c]",
        claimElement: "and a fusion engine configured to synchronize hardware timestamps between LiDAR point clouds and camera video frames to output an occupancy grid.",
        accusedFeature: 'Apex Perception Whitepaper: "Sensor data streams are ingested and correlated across software queues."',
        aiReasoning: "General statement of combining sensor streams lacks explicit proof of sub-millisecond hardware timestamp synchronization required by limitation 12.c.",
        status: "weak",
        history: [],
        keywords: ["fusion engine", "synchronize", "timestamps", "occupancy grid", "clock", "hardware"]
      }
    ]
  }
];

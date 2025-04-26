// Sample AR objects data for the factory visualization
export const sampleObjects = [
  {
    id: 1,
    name: "Temperature Sensor T1",
    type: "Temperature",
    status: "Active",
    position: { x: -3.2, y: 1.2, z: -1.8 }, // Near machine 1
    color: 0xff5722, // Orange
    lastUpdated: "2025-04-27T09:30:22",
    readings: [65, 68, 72, 73, 75, 74, 73, 72],
    description: "Primary temperature monitor for extrusion machine"
  },
  {
    id: 2,
    name: "Humidity Sensor H1",
    type: "Humidity",
    status: "Active",
    position: { x: 2.8, y: 1.4, z: -1.2 }, // Near machine 2
    color: 0x2196f3, // Blue
    lastUpdated: "2025-04-27T09:45:43",
    readings: [42, 43, 45, 44, 43, 42, 41, 40],
    description: "Main humidity sensor for the production area"
  },
  {
    id: 3,
    name: "Pressure Sensor P1",
    type: "Pressure",
    status: "Warning",
    position: { x: 3.1, y: 0.9, z: -0.6 }, // On machine 2
    color: 0xffeb3b, // Yellow
    lastUpdated: "2025-04-27T09:22:10",
    readings: [65, 70, 75, 78, 82, 85, 83, 81],
    description: "Hydraulic system pressure monitor - approaching upper threshold"
  },
  {
    id: 4,
    name: "Motion Sensor M1",
    type: "Motion",
    status: "Offline",
    position: { x: -2.5, y: 2.1, z: -3.5 }, // Wall mounted
    color: 0xe91e63, // Pink
    lastUpdated: "2025-04-26T18:45:12",
    readings: [90, 85, 82, 78, 45, 20, 0, 0],
    description: "Personnel movement detector - maintenance scheduled for tomorrow"
  },
  {
    id: 5,
    name: "Light Sensor L1",
    type: "Light",
    status: "Active",
    position: { x: 0.3, y: 2.2, z: 1.8 }, // Above workbench
    color: 0x4caf50, // Green
    lastUpdated: "2025-04-27T09:35:33",
    readings: [85, 86, 85, 84, 86, 87, 88, 87],
    description: "Workstation illumination monitor for quality control"
  },
  {
    id: 6,
    name: "CO2 Sensor C1",
    type: "Carbon Dioxide",
    status: "Critical",
    position: { x: -3.8, y: 1.8, z: -2.2 }, // Near machine 1 exhaust
    color: 0xf44336, // Red
    lastUpdated: "2025-04-27T09:12:18",
    readings: [40, 48, 55, 68, 75, 82, 90, 95],
    description: "Air quality monitor - CO2 levels exceeding safety threshold"
  },
  {
    id: 7,
    name: "Flow Sensor F1",
    type: "Water Flow",
    status: "Active",
    position: { x: -4.0, y: 1.5, z: 0.5 }, // Connected to wall pipe
    color: 0x00bcd4, // Cyan
    lastUpdated: "2025-04-27T09:40:21",
    readings: [80, 82, 79, 81, 83, 80, 78, 81],
    description: "Cooling system water flow monitor"
  },
  {
    id: 8,
    name: "Sound Sensor S1",
    type: "Sound",
    status: "Active",
    position: { x: 0.5, y: 1.2, z: 2.3 }, // Near workbench
    color: 0x9c27b0, // Purple
    lastUpdated: "2025-04-27T09:37:44",
    readings: [30, 32, 35, 36, 35, 34, 33, 32],
    description: "Equipment noise level monitoring system"
  },
  {
    id: 9,
    name: "Vibration Sensor V1",
    type: "Vibration",
    status: "Warning",
    position: { x: -3.0, y: 0.8, z: -1.5 }, // Attached to machine 1
    color: 0xff9800, // Dark Orange
    lastUpdated: "2025-04-27T09:25:55",
    readings: [15, 18, 22, 28, 35, 42, 45, 48],
    description: "Equipment vibration monitor - showing increased levels"
  },
  {
    id: 10,
    name: "Voltage Sensor E1",
    type: "Electrical",
    status: "Active",
    position: { x: -4.5, y: 1.7, z: -4.0 }, // Near electrical panel
    color: 0xffc107, // Amber
    lastUpdated: "2025-04-27T09:15:30",
    readings: [220, 221, 222, 220, 219, 220, 221, 220],
    description: "Main equipment power supply monitor"
  },
  {
    id: 11,
    name: "Position Sensor P2",
    type: "Proximity",
    status: "Active",
    position: { x: 0.2, y: 0.9, z: 2.1 }, // On workbench
    color: 0x607d8b, // Blue Grey
    lastUpdated: "2025-04-27T09:42:11",
    readings: [0, 0, 1, 1, 1, 0, 0, 1],
    description: "Tool placement verification sensor"
  },
  {
    id: 12,
    name: "Gas Sensor G1",
    type: "Gas Detection",
    status: "Active",
    position: { x: 3.8, y: 1.6, z: -2.5 }, // Near machine 2
    color: 0x795548, // Brown
    lastUpdated: "2025-04-27T09:10:05",
    readings: [5, 6, 7, 8, 7, 6, 5, 6],
    description: "Combustible gas monitoring system"
  }
];
// Sample AR objects data for the visualization
export const sampleObjects = [
  {
    id: 1,
    name: "IoT Sensor A1",
    type: "Temperature",
    status: "Active",
    position: { x: 2, y: 0, z: -3 },
    color: 0xff5722, // Orange
    lastUpdated: "2025-04-25T15:30:22",
    readings: [45, 60, 72, 65, 80, 85, 78, 90],
    description: "Primary temperature sensor for the east zone"
  },
  {
    id: 2,
    name: "IoT Sensor B2",
    type: "Humidity",
    status: "Active",
    position: { x: -3, y: 1, z: 2 },
    color: 0x2196f3, // Blue
    lastUpdated: "2025-04-26T09:15:43",
    readings: [30, 35, 32, 40, 38, 42, 45, 41],
    description: "Main humidity sensor for the north zone"
  },
  {
    id: 3,
    name: "IoT Sensor C3",
    type: "Pressure",
    status: "Warning",
    position: { x: 0, y: 0, z: 4 },
    color: 0xffeb3b, // Yellow
    lastUpdated: "2025-04-26T08:22:10",
    readings: [65, 62, 70, 75, 68, 60, 55, 50],
    description: "Pressure monitoring system with recent fluctuations"
  },
  {
    id: 4,
    name: "IoT Sensor D4",
    type: "Motion",
    status: "Offline",
    position: { x: -4, y: -1, z: -2 },
    color: 0xe91e63, // Pink
    lastUpdated: "2025-04-25T23:45:12",
    readings: [90, 85, 82, 78, 75, 70, 65, 0],
    description: "Motion detector currently offline - maintenance scheduled"
  },
  {
    id: 5,
    name: "IoT Sensor E5",
    type: "Light",
    status: "Active",
    position: { x: 5, y: 2, z: 1 },
    color: 0x4caf50, // Green
    lastUpdated: "2025-04-26T10:05:33",
    readings: [25, 30, 40, 55, 70, 85, 88, 90],
    description: "Ambient light sensor for automatic brightness control"
  },
  {
    id: 6,
    name: "IoT Sensor F6",
    type: "Carbon Dioxide",
    status: "Critical",
    position: { x: 1, y: -2, z: -5 },
    color: 0xf44336, // Red
    lastUpdated: "2025-04-26T10:12:18",
    readings: [40, 45, 52, 68, 75, 82, 90, 95],
    description: "CO2 levels approaching critical threshold - ventilation recommended"
  },
  {
    id: 7,
    name: "IoT Sensor G7",
    type: "Water Flow",
    status: "Active",
    position: { x: -2, y: 3, z: 3 },
    color: 0x00bcd4, // Cyan
    lastUpdated: "2025-04-26T09:55:21",
    readings: [80, 82, 79, 81, 83, 80, 78, 81],
    description: "Water flow monitoring for system optimization"
  },
  {
    id: 8,
    name: "IoT Sensor H8",
    type: "Sound",
    status: "Active",
    position: { x: 3, y: 1, z: -1 },
    color: 0x9c27b0, // Purple
    lastUpdated: "2025-04-26T08:33:44",
    readings: [30, 32, 45, 65, 55, 40, 35, 32],
    description: "Acoustic monitoring system for ambient noise levels"
  }
];
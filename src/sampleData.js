// Sample data for 3D objects
export const sampleObjects = [
    {
      id: 'A105',
      name: 'Sensor A105',
      type: 'Temperature',
      position: { x: 2.5, y: 1.0, z: -3.0 },
      color: 0x3498db,
      status: 'Active',
      lastUpdated: '1h ago',
      readings: [25, 26, 24, 25, 27, 26]
    },
    {
      id: 'B221',
      name: 'Controller B221',
      type: 'System Hub',
      position: { x: -3.0, y: 0.5, z: 2.0 },
      color: 0x2ecc71,
      status: 'Active',
      lastUpdated: '30m ago',
      readings: [98, 97, 99, 98, 97, 99]
    },
    {
      id: 'C77',
      name: 'Beacon C77',
      type: 'Location',
      position: { x: 4.0, y: 0.0, z: 1.5 },
      color: 0xe67e22,
      status: 'Inactive',
      lastUpdated: '2d ago',
      readings: [45, 46, 44, 45, 47, 46]
    }
  ];
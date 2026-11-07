import { ProductCategory } from '../types';

export const CATEGORIES: ProductCategory[] = [
  {
    id: 'networking-equipment',
    name: 'Networking Equipment',
    slug: 'networking-equipment',
    description: 'Enterprise managed switches, core routers, firewall appliances, and transceivers for mission-critical infrastructure.',
    itemCount: 48,
    imageUrl: '/categories/networking-equipment.jpg',
    iconName: 'Network',
    subcategories: ['Managed Switches', 'PoE+ Switches', 'Enterprise Routers', 'Firewalls & Security Gateways', 'SFP / Fiber Transceivers']
  },
  {
    id: 'servers-storage',
    name: 'Servers & Storage',
    slug: 'servers-storage',
    description: 'Rackmount servers, enterprise NAS arrays, SAN storage appliances, and high-density compute nodes.',
    itemCount: 32,
    imageUrl: '/categories/servers-storage.jpg',
    iconName: 'Server',
    subcategories: ['1U / 2U Rack Servers', 'Tower Servers', 'Network Attached Storage (NAS)', 'Enterprise Hard Drives', 'SAN Controllers']
  },
  {
    id: 'cctv-surveillance',
    name: 'CCTV & Surveillance',
    slug: 'cctv-surveillance',
    description: 'Commercial IP cameras, AI-powered NVRs, PTZ dome systems, and biometric security surveillance gear.',
    itemCount: 42,
    imageUrl: '/categories/cctv-surveillance.jpg',
    iconName: 'Camera',
    subcategories: ['IP Bullet Cameras', 'PTZ Dome Cameras', 'Network Video Recorders (NVR)', 'Access Control Systems', 'Surveillance HDDs']
  },
  {
    id: 'ups-power-solutions',
    name: 'UPS & Power Solutions',
    slug: 'ups-power-solutions',
    description: 'Online double-conversion UPS, rackmount power distribution units (PDU), and surge protection systems.',
    itemCount: 2,
    imageUrl: '/categories/ups-power-solutions.jpg',
    iconName: 'Zap',
    subcategories: ['On-Line Double Conversion UPS', 'Line-Interactive UPS', 'Rackmount PDUs', 'Automatic Transfer Switches', 'Replacement Battery Packs']
  },
  {
    id: 'structured-cabling',
    name: 'Structured Cabling',
    slug: 'structured-cabling',
    description: 'Certified Cat6 / Cat6A UTP cabling, patch cords, patch panels, keystone jacks, and fiber optic trunks.',
    itemCount: 36,
    imageUrl: '/categories/structured-cabling.jpg',
    iconName: 'Cable',
    subcategories: ['Cat6 UTP Cable 305m', 'Cat6A Shielded Cable', '24/48-Port Patch Panels', 'Fiber Optic Patch Cords', 'Modular Keystone Jacks']
  },
  {
    id: 'racks-cabinets',
    name: 'Racks & Cabinets',
    slug: 'racks-cabinets',
    description: 'Data center server racks, wall-mount network enclosures, cable management trays, and cooling fans.',
    itemCount: 8,
    imageUrl: '/categories/racks-cabinets.jpg',
    iconName: 'Layers',
    subcategories: ['42U Server Rack Cabinets', '24U Enclosures', '6U/9U/12U Wall Mount Racks', 'Horizontal Cable Managers', 'Rackmount Fan Trays']
  },
  {
    id: 'wireless-connectivity',
    name: 'Wireless & Connectivity',
    slug: 'wireless-connectivity',
    description: 'Enterprise Wi-Fi 6 / 6E access points, point-to-point wireless bridges, and high-gain external antennas.',
    itemCount: 29,
    imageUrl: '/categories/wireless-connectivity.jpg',
    iconName: 'Wifi',
    subcategories: ['Ceiling-Mount Access Points', 'Outdoor Long-Range APs', 'Point-to-Point Wireless Bridges', 'Mesh Wi-Fi Systems', 'PoE Injectors']
  },
  {
    id: 'computers-laptops',
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    description: 'Corporate business laptops, enterprise desktop workstations, all-in-one PCs, and rugged field terminals.',
    itemCount: 35,
    imageUrl: '/categories/computers-laptops.jpg',
    iconName: 'Laptop',
    subcategories: ['Enterprise Business Laptops', 'Desktop Workstations', 'Mini Commercial PCs', 'All-in-One PCs', 'Mobile Workstations']
  },
  {
    id: 'computer-components',
    name: 'Computer Components',
    slug: 'computer-components',
    description: 'Server processors, ECC registered DDR4/DDR5 memory, enterprise SSDs, and industrial power supplies.',
    itemCount: 40,
    imageUrl: '/categories/computer-components.jpg',
    iconName: 'Cpu',
    subcategories: ['Intel Xeon / Core Processors', 'ECC Server RAM Modules', 'NVMe PCIe Enterprise SSDs', 'Raid Controller Cards', 'Industrial Power Supplies']
  },
  {
    id: 'printers-scanners',
    name: 'Printers & Scanners',
    slug: 'printers-scanners',
    description: 'High-volume office laser printers, heavy-duty document scanners, barcode label printers, and genuine toners.',
    itemCount: 20,
    imageUrl: '/categories/printers-scanners.jpg',
    iconName: 'Printer',
    subcategories: ['Enterprise Laser MFPs', 'Sheet-fed Document Scanners', 'Thermal Barcode Printers', 'Original OEM Toners & Drums']
  },
  {
    id: 'peripherals-accessories',
    name: 'Peripherals & Accessories',
    slug: 'peripherals-accessories',
    description: 'Conference room 4K cameras, commercial display monitors, KVM switches, and ergonomic office input devices.',
    itemCount: 31,
    imageUrl: '/categories/peripherals-accessories.jpg',
    iconName: 'MousePointer',
    subcategories: ['Video Conference Bar Systems', 'KVM Rack Consoles', 'Commercial IPS Monitors', 'Wireless Business Keyboards & Mice', 'Docking Stations']
  },
  {
    id: 'software-licensing',
    name: 'Software & Licensing',
    slug: 'software-licensing',
    description: 'Enterprise operating systems, virtualization licenses, firewall security subscriptions, and commercial office suites.',
    itemCount: 16,
    imageUrl: '/categories/software-licensing.jpg',
    iconName: 'ShieldCheck',
    subcategories: ['Microsoft Windows Server CALs', 'VMware vSphere Virtualization', 'Firewall Threat Protection Subscriptions', 'Microsoft 365 Business Plans']
  }
];

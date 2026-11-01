import { ProductCategory } from '../types';

export const CATEGORIES: ProductCategory[] = [
  {
    id: 'networking-equipment',
    name: 'Networking Equipment',
    slug: 'networking-equipment',
    description: 'Enterprise managed switches, core routers, firewall appliances, and transceivers for mission-critical infrastructure.',
    itemCount: 48,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    iconName: 'Network',
    subcategories: ['Managed Switches', 'PoE+ Switches', 'Enterprise Routers', 'Firewalls & Security Gateways', 'SFP / Fiber Transceivers']
  },
  {
    id: 'servers-storage',
    name: 'Servers & Storage',
    slug: 'servers-storage',
    description: 'Rackmount servers, enterprise NAS arrays, SAN storage appliances, and high-density compute nodes.',
    itemCount: 32,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    iconName: 'Server',
    subcategories: ['1U / 2U Rack Servers', 'Tower Servers', 'Network Attached Storage (NAS)', 'Enterprise Hard Drives', 'SAN Controllers']
  },
  {
    id: 'cctv-surveillance',
    name: 'CCTV & Surveillance',
    slug: 'cctv-surveillance',
    description: 'Commercial IP cameras, AI-powered NVRs, PTZ dome systems, and biometric security surveillance gear.',
    itemCount: 42,
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    iconName: 'Camera',
    subcategories: ['IP Bullet Cameras', 'PTZ Dome Cameras', 'Network Video Recorders (NVR)', 'Access Control Systems', 'Surveillance HDDs']
  },
  {
    id: 'ups-power-solutions',
    name: 'UPS & Power Solutions',
    slug: 'ups-power-solutions',
    description: 'Online double-conversion UPS, rackmount power distribution units (PDU), and surge protection systems.',
    itemCount: 26,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    iconName: 'Zap',
    subcategories: ['On-Line Double Conversion UPS', 'Line-Interactive UPS', 'Rackmount PDUs', 'Automatic Transfer Switches', 'Replacement Battery Packs']
  },
  {
    id: 'structured-cabling',
    name: 'Structured Cabling',
    slug: 'structured-cabling',
    description: 'Certified Cat6 / Cat6A UTP cabling, patch cords, patch panels, keystone jacks, and fiber optic trunks.',
    itemCount: 38,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    iconName: 'Cable',
    subcategories: ['Cat6 UTP Cable 305m', 'Cat6A Shielded Cable', '24/48-Port Patch Panels', 'Fiber Optic Patch Cords', 'Modular Keystone Jacks']
  },
  {
    id: 'racks-cabinets',
    name: 'Racks & Cabinets',
    slug: 'racks-cabinets',
    description: 'Data center server racks, wall-mount network enclosures, cable management trays, and cooling fans.',
    itemCount: 22,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80',
    iconName: 'Layers',
    subcategories: ['42U Server Rack Cabinets', '24U Enclosures', '6U/9U/12U Wall Mount Racks', 'Horizontal Cable Managers', 'Rackmount Fan Trays']
  },
  {
    id: 'wireless-connectivity',
    name: 'Wireless & Connectivity',
    slug: 'wireless-connectivity',
    description: 'Enterprise Wi-Fi 6 / 6E access points, point-to-point wireless bridges, and high-gain external antennas.',
    itemCount: 29,
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
    iconName: 'Wifi',
    subcategories: ['Ceiling-Mount Access Points', 'Outdoor Long-Range APs', 'Point-to-Point Wireless Bridges', 'Mesh Wi-Fi Systems', 'PoE Injectors']
  },
  {
    id: 'computers-laptops',
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    description: 'Corporate business laptops, enterprise desktop workstations, all-in-one PCs, and rugged field terminals.',
    itemCount: 35,
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    iconName: 'Laptop',
    subcategories: ['Enterprise Business Laptops', 'Desktop Workstations', 'Mini Commercial PCs', 'All-in-One PCs', 'Mobile Workstations']
  },
  {
    id: 'computer-components',
    name: 'Computer Components',
    slug: 'computer-components',
    description: 'Server processors, ECC registered DDR4/DDR5 memory, enterprise SSDs, and industrial power supplies.',
    itemCount: 40,
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    iconName: 'Cpu',
    subcategories: ['Intel Xeon / Core Processors', 'ECC Server RAM Modules', 'NVMe PCIe Enterprise SSDs', 'Raid Controller Cards', 'Industrial Power Supplies']
  },
  {
    id: 'printers-scanners',
    name: 'Printers & Scanners',
    slug: 'printers-scanners',
    description: 'High-volume office laser printers, heavy-duty document scanners, barcode label printers, and genuine toners.',
    itemCount: 20,
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
    iconName: 'Printer',
    subcategories: ['Enterprise Laser MFPs', 'Sheet-fed Document Scanners', 'Thermal Barcode Printers', 'Original OEM Toners & Drums']
  },
  {
    id: 'peripherals-accessories',
    name: 'Peripherals & Accessories',
    slug: 'peripherals-accessories',
    description: 'Conference room 4K cameras, commercial display monitors, KVM switches, and ergonomic office input devices.',
    itemCount: 31,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    iconName: 'MousePointer',
    subcategories: ['Video Conference Bar Systems', 'KVM Rack Consoles', 'Commercial IPS Monitors', 'Wireless Business Keyboards & Mice', 'Docking Stations']
  },
  {
    id: 'software-licensing',
    name: 'Software & Licensing',
    slug: 'software-licensing',
    description: 'Enterprise operating systems, virtualization licenses, firewall security subscriptions, and commercial office suites.',
    itemCount: 16,
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    iconName: 'ShieldCheck',
    subcategories: ['Microsoft Windows Server CALs', 'VMware vSphere Virtualization', 'Firewall Threat Protection Subscriptions', 'Microsoft 365 Business Plans']
  }
];

import { Product } from '../types';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    sku: 'ZEZ-CS-9200L-24P',
    model: 'C9200L-24P-4G-E',
    name: 'Cisco Catalyst 9200L 24-Port Gigabit PoE+ Managed Switch',
    brand: 'Cisco',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Enterprise 24-port Gigabit Ethernet switch with 370W PoE+ power budget and 4x 1G SFP uplinks.',
    fullDescription: 'The Cisco Catalyst 9200L Series switches extend the power of intent-based networking and Catalyst 9000 hardware and software innovation to a broader set of deployments. Featuring 24 10/100/1000 PoE+ ports, Layer 3 routing capabilities, dual redundant power supply options, and enterprise-grade ASIC architecture, it provides resilient foundational switching for corporate branches and campus networks.',
    pricePhp: 89500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Cisco Enhanced Limited Lifetime Hardware Warranty (E-LLW)',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '24x 10/100/1000 Gigabit Ethernet PoE+ Ports',
      '370W Total PoE Power Budget',
      '4x 1G SFP Fixed Uplink Ports',
      '56 Gbps Switching Capacity / 41.66 Mpps Forwarding',
      'Cisco DNA Network Essentials Support'
    ],
    specifications: [
      { category: 'Networking', label: 'Port Count', value: '24x 10/100/1000 Mbps RJ45' },
      { category: 'Networking', label: 'PoE Standard', value: '802.3at / 802.3af PoE+ (Up to 30W per port)' },
      { category: 'Networking', label: 'PoE Power Budget', value: '370 Watts' },
      { category: 'Performance', label: 'Switching Capacity', value: '56 Gbps' },
      { category: 'Performance', label: 'Forwarding Rate', value: '41.66 Mpps' },
      { category: 'Networking', label: 'Uplink Interfaces', value: '4x 1G SFP Uplinks' },
      { category: 'Management', label: 'Management', value: 'Cisco IOS XE, Web UI, CLI, SNMP, RESTCONF' },
      { category: 'Power', label: 'Power Supply', value: 'Internal 500W AC (Field Replaceable)' },
      { category: 'Physical', label: 'Form Factor', value: '1U 19-inch Rackmount (4.4 x 44.5 x 28.8 cm)' }
    ],
    includedAccessories: ['Rackmount brackets & screws', 'Console cable', 'AC power cord', 'Rubber feet'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Cisco-Catalyst-9200L-Datasheet.pdf'
  },
  {
    id: 'prod-02',
    sku: 'ZEZ-UB-UDM-SE',
    model: 'UDM-SE',
    name: 'Ubiquiti UniFi Dream Machine Special Edition (UDM-SE)',
    brand: 'Ubiquiti',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'All-in-one 10G enterprise router, 8-port PoE switch, UniFi OS gateway, and integrated NVR.',
    fullDescription: 'The UniFi Dream Machine Special Edition is an all-in-one enterprise network gateway and security console. Built with 8 integrated PoE/PoE+ ports, a 2.5 GbE WAN port, dual 10G SFP+ ports, and an integrated 128 GB SSD for UniFi Protect NVR storage (expandable with a 3.5" HDD bay), it is the quintessential control center for modern business offices.',
    pricePhp: 38900,
    isPriceNegotiable: false,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year Ubiquiti Manufacturer Warranty',
    isFeatured: true,
    isNewArrival: true,
    mainImage: 'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '8x GbE RJ45 Ports (6x PoE, 2x PoE+)',
      '1x 2.5 GbE RJ45 WAN Port + 1x 10G SFP+ WAN',
      '1x 10G SFP+ LAN Port',
      '3.5 Gbps Routing with IDS/IPS Deep Packet Inspection',
      'Integrated 128GB SSD + 3.5" HDD NVR Bay'
    ],
    specifications: [
      { category: 'Routing', label: 'IDS/IPS Throughput', value: '3.5 Gbps' },
      { category: 'Networking', label: 'LAN Ports', value: '8x GbE RJ45 (6x 802.3af PoE, 2x 802.3at PoE+)' },
      { category: 'Networking', label: 'WAN Ports', value: '1x 2.5 GbE RJ45 & 1x 10G SFP+' },
      { category: 'Storage', label: 'Onboard Storage', value: '128 GB Integrated SSD + 1x 3.5" SATA HDD Tray' },
      { category: 'Hardware', label: 'Processor', value: 'Quad-Core ARM Cortex-A57 @ 1.7 GHz / 4GB DDR4' },
      { category: 'Physical', label: 'Display', value: '1.3" Touchscreen Status Display' },
      { category: 'Physical', label: 'Form Factor', value: '1U Rackmount' }
    ],
    includedAccessories: ['1U Rackmount ears & screw kit', 'Power cable', 'Quick Start Guide'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Ubiquiti-UDM-SE-Datasheet.pdf'
  },
  {
    id: 'prod-03',
    sku: 'ZEZ-UB-U6-ENT',
    model: 'U6-Enterprise',
    name: 'Ubiquiti UniFi U6 Enterprise Wi-Fi 6E Access Point',
    brand: 'Ubiquiti',
    categoryId: 'wireless-connectivity',
    categoryName: 'Wireless & Connectivity',
    shortDescription: 'Tri-band Wi-Fi 6E ceiling access point supporting 6 GHz band and 2.5 GbE uplink.',
    fullDescription: 'High-density enterprise access point engineered for massive multi-client environments such as conference halls, corporate auditoriums, and open-plan campuses. Leverages the clean, uncongested 6 GHz band with up to 10.2 Gbps aggregate throughput over 10 spatial streams.',
    pricePhp: 21500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year Ubiquiti Manufacturer Warranty',
    isFeatured: true,
    isNewArrival: true,
    mainImage: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Tri-Band Wi-Fi 6E (2.4 GHz, 5 GHz, 6 GHz)',
      '10.2 Gbps Aggregate Over-the-Air Throughput',
      '1x 2.5 GbE RJ45 Uplink Port (PoE+ Required)',
      '600+ Concurrent Client Capacity',
      'Powered via 802.3at PoE+'
    ],
    specifications: [
      { category: 'Wireless', label: 'Bands', value: '2.4 GHz (4x4 MU-MIMO), 5 GHz (4x4), 6 GHz (4x4)' },
      { category: 'Wireless', label: 'Max Throughput', value: '6 GHz: 4.8 Gbps | 5 GHz: 4.8 Gbps | 2.4 GHz: 573.5 Mbps' },
      { category: 'Networking', label: 'Uplink', value: '1x 2.5 GbE RJ45 Port' },
      { category: 'Power', label: 'Power Input', value: '802.3at PoE+ (22W Max)' },
      { category: 'Physical', label: 'Dimensions', value: 'Ø220 x 48.1 mm (Weight: 960g)' }
    ],
    includedAccessories: ['Ceiling & wall mounting bracket', 'Mounting hardware kit'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'UniFi-U6-Enterprise-Datasheet.pdf'
  },
  {
    id: 'prod-04',
    sku: 'ZEZ-HK-DS2646G2',
    model: 'DS-2CD2646G2-IZS',
    name: 'Hikvision 4MP AcuSense DarkFighter Motorized Varifocal Bullet IP Camera',
    brand: 'Hikvision',
    categoryId: 'cctv-surveillance',
    categoryName: 'CCTV & Surveillance',
    shortDescription: 'Commercial 4MP bullet camera with DarkFighter ultra-low light tech, 2.8-12mm motorized zoom, and AcuSense AI.',
    fullDescription: 'Equipped with Hikvision AcuSense and DarkFighter technology, this bullet camera provides crystal-clear color surveillance even in challenging ultra-low-light environments. Deep learning algorithms accurately distinguish humans and vehicles from false alarm triggers like foliage and pets. Built with rugged IP67 weather resistance and IK10 vandal resistance.',
    pricePhp: 14800,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year Hikvision Authorized Warranty',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '4 MP High-Resolution (2688 × 1520 @ 30 fps)',
      '2.8 to 12 mm Motorized Varifocal Zoom Lens',
      'DarkFighter 0.003 Lux Ultra-Low Light Imaging',
      'AcuSense Deep Learning Human & Vehicle Classification',
      '60m IR Night Vision Distance / IP67 & IK10 Rated'
    ],
    specifications: [
      { category: 'Optics', label: 'Sensor', value: '1/2.7" Progressive Scan CMOS' },
      { category: 'Optics', label: 'Lens', value: '2.8 mm to 12 mm Motorized Varifocal (FOV 108° to 30°)' },
      { category: 'Video', label: 'Compression', value: 'H.265+ / H.265 / H.264+ / H.264' },
      { category: 'Night Vision', label: 'IR Range', value: 'Up to 60 meters Smart IR' },
      { category: 'Smart Features', label: 'AI Analytics', value: 'Line crossing, intrusion detection, human/vehicle target' },
      { category: 'Enclosure', label: 'Protection Rating', value: 'IP67 Water & Dust / IK10 Vandal Resistance' },
      { category: 'Power', label: 'Power Supply', value: '12 VDC ± 25% or PoE (802.3at)' }
    ],
    includedAccessories: ['Weatherproof junction connector', 'Drill template', 'Mounting screws'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Hikvision-DS-2CD2646G2-IZS.pdf'
  },
  {
    id: 'prod-05',
    sku: 'ZEZ-DH-NVR5216',
    model: 'NVR5216-16P-I',
    name: 'Dahua 16-Channel 1U 16-PoE WizMind 4K Network Video Recorder',
    brand: 'Dahua',
    categoryId: 'cctv-surveillance',
    categoryName: 'CCTV & Surveillance',
    shortDescription: 'Enterprise 16-channel 4K NVR with 16 built-in PoE ports, face recognition, and dual 16TB SATA support.',
    fullDescription: 'The Dahua WizMind NVR5216-16P-I offers exceptional recording performance with AI features directly inside the NVR, including 2-channel face recognition, perimeter protection, and metadata search. Supports cameras up to 16 MP resolution with 320 Mbps incoming bandwidth.',
    pricePhp: 28500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year Dahua Commercial Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '16 Channels IP Video Input (Up to 16MP Resolution)',
      '16 Built-in PoE Ports (IEEE 802.3af/at, 130W Total)',
      '320 Mbps Incoming Bandwidth Recording',
      'Dual SATA III Ports (Up to 16TB per drive, 32TB total)',
      'WizMind AI: Face Recognition, Vehicle Plate, Perimeter'
    ],
    specifications: [
      { category: 'Video', label: 'IP Channels', value: '16 Channels' },
      { category: 'Performance', label: 'Bandwidth', value: '320 Mbps access, 320 Mbps storage, 320 Mbps forwarding' },
      { category: 'Storage', label: 'HDD Bays', value: '2x SATA III ports, up to 16TB each' },
      { category: 'PoE', label: 'PoE Interface', value: '16 ports (IEEE802.3af/at) 130W max output' },
      { category: 'Video Out', label: 'Displays', value: '1x HDMI (4K UHD) + 1x VGA simultaneous' },
      { category: 'Physical', label: 'Dimensions', value: '1U, 375.0 mm × 327.4 mm × 53.0 mm' }
    ],
    includedAccessories: ['Power adapter', 'USB mouse', 'SATA data & power cables', 'Rackmount brackets'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Dahua-NVR5216-16P-I-Datasheet.pdf'
  },
  {
    id: 'prod-06',
    sku: 'ZEZ-APC-SURT3000',
    model: 'SURT3000XLI',
    name: 'APC Smart-UPS RT 3000VA 230V On-Line Double-Conversion UPS',
    brand: 'APC',
    categoryId: 'ups-power-solutions',
    categoryName: 'UPS & Power Solutions',
    shortDescription: 'High-density, double-conversion on-line power protection with scalable runtime for servers and voice/data networks.',
    fullDescription: 'The APC Smart-UPS RT SURT3000XLI delivers genuine double-conversion online power protection, ensuring zero transfer time to battery when utility power fluctuates or fails. Perfect for critical enterprise servers, PBX telecom systems, and high-density network switches. Supports external battery packs for extended multi-hour runtime.',
    pricePhp: 94800,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year APC by Schneider Electric Factory Warranty',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '3000VA / 2100W Pure Sine Wave Output',
      'True On-Line Double Conversion (Zero Transfer Time)',
      '230V Nominal Input/Output with ±1% Voltage Regulation',
      'SmartSlot for Network Management Card (AP9630/AP9640)',
      'Tower / 3U Rack Convertible Form Factor'
    ],
    specifications: [
      { category: 'Power', label: 'Capacity', value: '3000VA / 2100 Watts' },
      { category: 'Topology', label: 'Topology', value: 'Double Conversion On-Line' },
      { category: 'Output', label: 'Waveform', value: 'Pure Sine Wave (0 ms transfer time)' },
      { category: 'Connections', label: 'Output Receptacles', value: '8x IEC 320 C13 & 2x IEC 320 C19' },
      { category: 'Input', label: 'Input Voltage', value: '230V (160 - 280V operational window)' },
      { category: 'Battery', label: 'Battery Type', value: 'Maintenance-free sealed Lead-Acid with suspended electrolyte' },
      { category: 'Physical', label: 'Weight & Form', value: '54.5 kg / 3U Convertible (130 x 432 x 660 mm)' }
    ],
    includedAccessories: ['Rack mounting support rails', 'Smart UPS signaling RS-232 cable', 'User manual', 'CD software'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'APC-Smart-UPS-RT-3000VA.pdf'
  },
  {
    id: 'prod-07',
    sku: 'ZEZ-SYN-DS1821P',
    model: 'DS1821+',
    name: 'Synology DiskStation DS1821+ 8-Bay Enterprise NAS',
    brand: 'Synology',
    categoryId: 'servers-storage',
    categoryName: 'Servers & Storage',
    shortDescription: 'High-capacity 8-bay desktop NAS powered by AMD Ryzen Quad-Core with dual M.2 NVMe SSD cache slots.',
    fullDescription: 'Designed for SMBs and data-intensive IT environments, the Synology DS1821+ provides up to 108 TB of raw capacity across 8 drive bays, expandable to 18 bays with two DX517 units. Features an AMD Ryzen V1500B quad-core 2.2 GHz processor, 4GB ECC DDR4 memory (upgradeable to 32GB), and a PCIe 3.0 slot for optional 10GbE network cards.',
    pricePhp: 68500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Synology Manufacturer Warranty (Extendable to 5-Year)',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '8x 3.5"/2.5" SATA HDD/SSD Hot-Swappable Bays',
      'AMD Ryzen Quad-Core 2.2 GHz Processor',
      '4GB DDR4 ECC RAM (Expandable to 32GB)',
      'Dual M.2 2280 NVMe SSD Cache Slots',
      '4x Gigabit LAN Ports with Link Aggregation / Failover'
    ],
    specifications: [
      { category: 'Compute', label: 'CPU', value: 'AMD Ryzen V1500B 4-core 2.2 GHz 64-bit' },
      { category: 'Memory', label: 'System Memory', value: '4 GB DDR4 ECC SODIMM (2 Slots, Up to 32 GB)' },
      { category: 'Storage', label: 'Drive Bays', value: '8 Bays (Expandable to 18 Bays with 2x DX517)' },
      { category: 'Cache', label: 'SSD Cache', value: '2x M.2 2280 NVMe SSD slots' },
      { category: 'Expansion', label: 'PCIe Slot', value: '1x Gen3 x8 slot (x4 link) for 10GbE / 25GbE NIC' },
      { category: 'Network', label: 'RJ-45 LAN Ports', value: '4x 1GbE with Link Aggregation / Failover' }
    ],
    includedAccessories: ['AC power adapter', '2x RJ-45 LAN cables', 'Drive bay lock keys', 'Accessory pack'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Synology-DS1821+-Datasheet.pdf'
  },
  {
    id: 'prod-08',
    sku: 'ZEZ-DELL-R450',
    model: 'PowerEdge R450',
    name: 'Dell PowerEdge R450 1U Dual-Socket Rack Server',
    brand: 'Dell',
    categoryId: 'servers-storage',
    categoryName: 'Servers & Storage',
    shortDescription: 'Dense 1U enterprise server powered by 3rd Gen Intel Xeon Scalable Processors for virtualization and corporate workloads.',
    fullDescription: 'The Dell EMC PowerEdge R450 is a two-socket 1U server offering the ultimate balance of processing power, storage density, and enterprise manageability via iDRAC9. Built for edge computing, virtualization clusters, corporate ERP databases, and collaboration platforms in space-constrained data centers.',
    pricePhp: 198000,
    isPriceNegotiable: true,
    stockStatus: 'Pre-Order (5-7 Days)',
    leadTimeDays: 7,
    warranty: '3-Year Dell ProSupport & Next Business Day Onsite Service',
    isFeatured: true,
    isNewArrival: true,
    mainImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Dual 3rd Gen Intel Xeon Silver 4314 (16C/32T, 2.4 GHz)',
      '64GB (2x32GB) DDR4 3200MHz ECC Registered RDIMMs',
      'PERC H755 RAID Controller with 8GB Non-Volatile Cache',
      '4x 3.5" Hot-Plug SAS/SATA Hard Drive Chassis',
      'Dual 800W Titanium Redundant Hot-Plug Power Supplies'
    ],
    specifications: [
      { category: 'Processor', label: 'CPU Model', value: 'Intel Xeon Silver 4314 2.4G, 16C/32T, 24M Cache' },
      { category: 'Memory', label: 'RAM Config', value: '64GB (2x32GB) RDIMM, 3200MT/s Dual Rank (16 DIMM slots max)' },
      { category: 'Storage Controller', label: 'RAID', value: 'PERC H755 SAS/SATA RAID 0, 1, 5, 6, 10, 50, 60' },
      { category: 'Management', label: 'Remote Management', value: 'iDRAC9 Enterprise 15G with OpenManage Enterprise' },
      { category: 'Networking', label: 'LOM Ports', value: 'Dual 1GbE Broadcom On-Board LOM + OCP 3.0 Slot' },
      { category: 'Power', label: 'PSU', value: 'Dual Hot-Plug Redundant Power Supply (1+1) 800W' }
    ],
    includedAccessories: ['ReadyRails sliding rack rails', 'Cable management arm', '2x C13-C14 power cords'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Dell-PowerEdge-R450-Spec-Sheet.pdf'
  },
  {
    id: 'prod-09',
    sku: 'ZEZ-PAN-CAT6A',
    model: 'PUC6AS04BU-EG',
    name: 'Panduit Pan-Net Category 6A UTP Copper Cable 305m Box (Blue)',
    brand: 'Panduit',
    categoryId: 'structured-cabling',
    categoryName: 'Structured Cabling',
    shortDescription: 'Commercial 10GBASE-T certified 23 AWG 4-pair unshielded twisted pair cable reel for data centers and structured cabling.',
    fullDescription: 'Panduit TX6A Category 6A UTP Copper Cable exceeds ISO/IEC 11801 Class EA and ANSI/TIA-568.2-D Category 6A standards. Engineered with patented Matrix tape technology to suppress alien crosstalk without requiring grounding shields, ensuring robust 10 Gbps Ethernet throughput up to 100 meters.',
    pricePhp: 18200,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: 'Panduit 25-Year System Performance Warranty when certified',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Category 6A / 10GBASE-T High-Performance Copper',
      '305 Meters (1,000 Feet) Easy-Pull Reel in a Box',
      '23 AWG Solid Bare Copper Conductors',
      'Flame Rating: CM / IEC 60332-1',
      'Alien Crosstalk Suppression with Advanced Tape Matrix'
    ],
    specifications: [
      { category: 'Cabling', label: 'Category', value: 'Cat 6A UTP (Unshielded Twisted Pair)' },
      { category: 'Physical', label: 'Conductor Gauge', value: '23 AWG Solid Annealed Bare Copper' },
      { category: 'Length', label: 'Reel Length', value: '305m (1000 ft)' },
      { category: 'Frequency', label: 'Bandwidth', value: 'Tested up to 500 MHz (Guaranteed 10 Gbps)' },
      { category: 'Jacket', label: 'Material', value: 'Flame-retardant PVC (CM rated), Blue' }
    ],
    includedAccessories: ['Pull-box dispensing system with descending footage counter'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Panduit-TX6A-Cat6A-Datasheet.pdf'
  },
  {
    id: 'prod-10',
    sku: 'ZEZ-TOT-42U',
    model: 'G-Series 42U 600x1000',
    name: 'Toten 42U Server Rack Cabinet 600x1000mm Perforated Mesh Doors',
    brand: 'APC', // Under enterprise racks
    categoryId: 'racks-cabinets',
    categoryName: 'Racks & Cabinets',
    shortDescription: 'Heavy-duty 42U 19-inch data center server rack cabinet with high-ventilation hexagonal perforated mesh doors.',
    fullDescription: 'Constructed from high-tensile cold rolled SPCC steel with up to 1000 kg static load capacity. Comes fully equipped with 4 whisper-quiet roof exhaust fans, heavy-duty castors, leveling feet, vertical cable management raceways, and grounding bonding kit.',
    pricePhp: 34500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 2,
    warranty: '5-Year Structural Frame Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '42U Standard 19-inch Mounting Height',
      'Dimensions: 600mm (W) x 1000mm (D) x 2055mm (H)',
      '1000 kg Static Load Capacity (SPCC Cold Rolled Steel)',
      '75% Perforation Hexagonal High-Airflow Doors',
      '4x Low-Noise Roof Fan Unit Pre-Installed'
    ],
    specifications: [
      { category: 'Dimensions', label: 'Rack Units', value: '42U (2055mm H x 600mm W x 1000mm D)' },
      { category: 'Capacity', label: 'Static Load', value: '1,000 kg (2,204 lbs)' },
      { category: 'Ventilation', label: 'Perforation', value: '75% High Airflow Hexagonal Mesh' },
      { category: 'Cooling', label: 'Fan System', value: '4-Fan Roof Unit with 220V AC Power Cord' },
      { category: 'Security', label: 'Locking System', value: 'Front and Rear Swing Handle Cam Key Locks' }
    ],
    includedAccessories: ['4x Heavy-duty castors', '4x Leveling feet', '50x M6 Cage nuts & bolts', '2x Keys'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Toten-42U-Rack-Specification.pdf'
  },
  {
    id: 'prod-11',
    sku: 'ZEZ-MT-CRS328',
    model: 'CRS328-24P-4S+RM',
    name: 'MikroTik Cloud Router Switch 24-Port Gigabit PoE+ with 4x 10G SFP+',
    brand: 'MikroTik',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Dual-boot RouterOS / SwOS 24-port Gigabit switch with automatic 802.3af/at & 24V passive PoE output (450W).',
    fullDescription: 'The MikroTik CRS328-24P-4S+RM is a 28 independent port switch with 24 Gigabit Ethernet ports offering different power output options: Passive PoE, low voltage PoE, and 802.3af/at with auto-sensing. Four 10G SFP+ cages provide blistering 10 Gbps optical uplinks.',
    pricePhp: 29800,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year MikroTik Manufacturer Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '24x GbE RJ45 Ports with Auto 802.3af/at & 24V Passive PoE',
      '450W Maximum Internal PoE Power Supply',
      '4x 10G SFP+ Ports for High-Speed Fiber Uplinks',
      'Dual Boot System: SwOS or RouterOS Level 5',
      'Non-Blocking Throughput: 64 Gbps'
    ],
    specifications: [
      { category: 'Networking', label: 'Port Count', value: '24x 10/100/1000 RJ45 + 4x 10G SFP+' },
      { category: 'PoE', label: 'PoE Standards', value: '802.3af/at & 24V Passive (450W total)' },
      { category: 'Performance', label: 'Switching Capacity', value: '128 Gbps' },
      { category: 'Operating System', label: 'OS', value: 'Dual Boot SwOS / RouterOS Level 5' },
      { category: 'Physical', label: 'Form Factor', value: '1U 19" Rackmount (443 x 300 x 44 mm)' }
    ],
    includedAccessories: ['Rack ears and screws', 'IEC AC power cable'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'MikroTik-CRS328-Datasheet.pdf'
  },
  {
    id: 'prod-12',
    sku: 'ZEZ-TPL-ER7206',
    model: 'ER7206 (TL-ER7206)',
    name: 'TP-Link Omada Multi-WAN Gigabit VPN Enterprise Router',
    brand: 'TP-Link',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Business VPN gateway integrated into Omada SDN with up to 4 WAN ports and IPsec/OpenVPN/WireGuard support.',
    fullDescription: 'The ER7206 is an Omada SDN-ready enterprise VPN router supporting up to 4 WAN Gigabit ports (1x SFP WAN, 1x RJ45 WAN, 2x RJ45 WAN/LAN). Offers high-security VPN capabilities including 100 IPsec VPN tunnels, SSL VPN, and central cloud management via the Omada software controller or app.',
    pricePhp: 9200,
    isPriceNegotiable: false,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year TP-Link Enterprise Limited Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-199123fa6d8d?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '1x Gigabit SFP WAN Port + 1x Gigabit RJ45 WAN Port',
      '2x Gigabit WAN/LAN Ports + 2x Gigabit LAN Ports',
      'High-Security IPsec / PPTP / L2TP / OpenVPN / WireGuard',
      'Centralized Omada SDN Cloud Management',
      'Multi-WAN Load Balancing and Policy Routing'
    ],
    specifications: [
      { category: 'Ports', label: 'Interfaces', value: '1x Gigabit SFP WAN, 1x Gigabit RJ45 WAN, 2x WAN/LAN, 2x LAN' },
      { category: 'VPN', label: 'IPsec Tunnels', value: 'Up to 100 Tunnels (67 Mbps IPsec Throughput)' },
      { category: 'Capacity', label: 'Concurrent Sessions', value: '150,000' },
      { category: 'Management', label: 'Controller', value: 'Omada Cloud Controller or Standalone Web GUI' },
      { category: 'Physical', label: 'Casing', value: 'Durable steel casing, desktop or rackmount' }
    ],
    includedAccessories: ['Power cord', 'Rackmount kit', 'Rubber feet', 'Quick installation guide'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'TP-Link-Omada-ER7206-Datasheet.pdf'
  },
  {
    id: 'prod-13',
    sku: 'ZEZ-LEN-T14S',
    model: 'ThinkPad T14s Gen 4',
    name: 'Lenovo ThinkPad T14s Gen 4 14" Business Laptop',
    brand: 'Lenovo',
    categoryId: 'computers-laptops',
    categoryName: 'Computers & Laptops',
    shortDescription: 'Ultraportable enterprise laptop with Intel Core i7-1355U, 16GB LPDDR5, 512GB NVMe SSD, and Windows 11 Pro.',
    fullDescription: 'The gold standard for corporate mobility. Tested against MIL-STD 810H military durability standards, the ThinkPad T14s Gen 4 provides military-grade resilience, all-day battery life with Rapid Charge, ThinkShield hardware security, and an ergonomic backlit keyboard with legendary TrackPoint navigation.',
    pricePhp: 78900,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Lenovo Premier Support with Onsite NBD',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Intel Core i7-1355U (10 Cores, up to 5.0 GHz Turbo)',
      '16GB LPDDR5x-4800MHz Onboard RAM',
      '512GB M.2 2280 PCIe 4.0 NVMe Opal2 SSD',
      '14.0" WUXGA (1920x1200) IPS Anti-Glare 300 nits Display',
      'FHD 1080p Web Camera with Privacy Shutter & Windows Hello'
    ],
    specifications: [
      { category: 'Processor', label: 'CPU', value: 'Intel Core i7-1355U (2 P-cores, 8 E-cores, 12 Threads)' },
      { category: 'Memory', label: 'RAM', value: '16GB LPDDR5x 4800MHz' },
      { category: 'Storage', label: 'Drive', value: '512GB PCIe Gen4 Performance NVMe M.2 SSD' },
      { category: 'Display', label: 'Screen', value: '14" WUXGA (1920x1200) IPS, 16:10, Anti-glare' },
      { category: 'Security', label: 'Features', value: 'dTPM 2.0, Match-on-chip fingerprint reader, Kensington lock slot' },
      { category: 'OS', label: 'Operating System', value: 'Windows 11 Pro 64-bit English OEM' }
    ],
    includedAccessories: ['65W USB-C GaN power adapter', 'Lenovo ThinkPad sleeve'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Lenovo-ThinkPad-T14s-Gen4-PSREF.pdf'
  },
  {
    id: 'prod-14',
    sku: 'ZEZ-HP-M430F',
    model: 'LaserJet Enterprise MFP M430f',
    name: 'HP LaserJet Enterprise MFP M430f All-in-One Monochrome Printer',
    brand: 'HP',
    categoryId: 'printers-scanners',
    categoryName: 'Printers & Scanners',
    shortDescription: 'Enterprise-class monochrome multi-function printer with HP Wolf Enterprise Security and fast 42 ppm print speeds.',
    fullDescription: 'Built for enterprise workgroups that need robust, reliable document handling. Combines high-speed printing, dual-sided scanning in a single pass, copying, and faxing with automated fleet management via HP Web Jetadmin and self-healing BIOS security.',
    pricePhp: 46200,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 2,
    warranty: '1-Year HP Onsite Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Print, Copy, Scan, Fax Multifunction Functions',
      'Print Speed: Up to 42 ppm (Black, A4)',
      '50-Sheet Single-Pass Dual-Head Duplexing ADF',
      'HP Wolf Enterprise Security with Automatic Intrusion Recovery',
      '2.7-inch Color Touchscreen Control Panel'
    ],
    specifications: [
      { category: 'Functions', label: 'Type', value: 'Print, Copy, Scan, Fax' },
      { category: 'Speed', label: 'Print Speed', value: 'Up to 42 ppm (Normal A4)' },
      { category: 'Duty Cycle', label: 'Monthly Volume', value: 'Up to 100,000 pages (Recommended 900 to 4,800 pages)' },
      { category: 'Connectivity', label: 'Ports', value: '1x Hi-Speed USB 2.0, 1x Gigabit Ethernet 10/100/1000T' },
      { category: 'Toner Cartridge', label: 'Consumable', value: 'HP 58A Black (~3,000 pages) / HP 58X High Yield (~10,000 pages)' }
    ],
    includedAccessories: ['HP Black Original LaserJet Toner (~3,000 pages)', 'Power cord', 'USB cable', 'Telecom cord'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'HP-MFP-M430f-Datasheet.pdf'
  },
  {
    id: 'prod-15',
    sku: 'ZEZ-MS-WINSRV22',
    model: 'P73-08328',
    name: 'Microsoft Windows Server 2022 Standard Edition 16-Core License',
    brand: 'Software & Licensing',
    categoryId: 'software-licensing',
    categoryName: 'Software & Licensing',
    shortDescription: 'Commercial perpetual 16-core license for Microsoft Windows Server 2022 Standard with multi-layer hybrid security.',
    fullDescription: 'Windows Server 2022 introduces advanced multi-layer security, hybrid capabilities with Microsoft Azure, and a flexible application platform. Standard Edition allows 2 virtual operating system environments (OSEs) or Hyper-V containers when all physical cores are licensed.',
    pricePhp: 48900,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: 'Microsoft Genuine License Guarantee',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Perpetual License for 16 Physical Server Cores',
      'Includes Rights for 2 Virtual Machines / OSEs',
      'Secured-Core Server Technology & TLS 1.3 by Default',
      'Seamless Hybrid Integration with Azure Arc',
      'Storage Spaces Direct & Containerization Improvements'
    ],
    specifications: [
      { category: 'Licensing', label: 'Model', value: 'Per Core (Covers up to 16 Physical Cores)' },
      { category: 'Virtualization', label: 'VM Rights', value: '2 Operating System Environments (OSE) or VMs' },
      { category: 'Delivery', label: 'Fulfillment', value: 'Digital License Certificate (COA / Electronic Key)' },
      { category: 'Language', label: 'Language', value: 'Single Language / English Multi-Region' }
    ],
    includedAccessories: ['Official License Confirmation Letter and Digital Key Certificate'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Windows-Server-2022-Licensing-Guide.pdf'
  },
  {
    id: 'prod-16',
    sku: 'ZEZ-CS-SYSTIMAX24',
    model: '760062364 | 1100-U-GS3-24',
    name: 'CommScope Systimax GigaSPEED XL Cat6 24-Port Patch Panel 1U',
    brand: 'CommScope',
    categoryId: 'structured-cabling',
    categoryName: 'Structured Cabling',
    shortDescription: 'Enterprise 1U 24-port Category 6 unshielded patch panel with universal T568A/T568B wiring.',
    fullDescription: 'The CommScope SYSTIMAX GigaSPEED XL 1100GS3 modular patch panel is engineered to support Gigabit and multi-gigabit Ethernet applications with superior headroom. Features universal wiring labels, rugged steel frame, and integrated rear cable management bracket.',
    pricePhp: 6800,
    isPriceNegotiable: false,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: 'CommScope 20-Year Extended Product Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '24-Port 1U 19-inch Unshielded Patch Panel',
      'Exceeds ANSI/TIA-568.2-D Category 6 Standards',
      'Rear Cable Support Bar with Strain Relief',
      'High-Durability Gold-Plated IDC Contacts',
      'Universal T568A and T568B Wiring Blocks'
    ],
    specifications: [
      { category: 'Cabling', label: 'Standard', value: 'Category 6 (ANSI/TIA-568.2-D)' },
      { category: 'Ports', label: 'Port Count', value: '24 RJ45 Ports' },
      { category: 'Mounting', label: 'Rack Units', value: '1U (44.45 mm x 482.6 mm)' },
      { category: 'Material', label: 'Construction', value: 'High-impact powder-coated steel' }
    ],
    includedAccessories: ['Rear cable support bar', 'Cable ties', 'Mounting screws & cage nuts'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'CommScope-1100GS3-24Port.pdf'
  },
  {
    id: 'prod-17',
    sku: 'ZEZ-INT-14700K',
    model: 'BX8071514700K',
    name: 'Intel Core i7-14700K 20-Core (8P+12E) Desktop Processor',
    brand: 'Computer Components',
    categoryId: 'computer-components',
    categoryName: 'Computer Components',
    shortDescription: '14th Gen Intel processor with 20 cores, 28 threads, and up to 5.6 GHz clock speeds for engineering workstations.',
    fullDescription: 'Equipped with 8 Performance cores and 12 Efficient cores, the Core i7-14700K delivers extraordinary multi-threaded horsepower for rendering, AutoCAD, 3D simulation, and intensive multi-tasking workloads. Compatible with Intel 600 and 700 series motherboards.',
    pricePhp: 25900,
    isPriceNegotiable: false,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Intel Boxed Processor Warranty',
    isFeatured: false,
    isNewArrival: true,
    mainImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '20 Cores (8 Performance + 12 Efficient) / 28 Threads',
      'Max Turbo Frequency Up to 5.6 GHz',
      '33 MB Intel Smart Cache / 28 MB L2 Cache',
      'Support for DDR5 5600 MT/s and DDR4 3200 MT/s',
      'Intel UHD Graphics 770 Integrated'
    ],
    specifications: [
      { category: 'Processor', label: 'Socket', value: 'LGA1700' },
      { category: 'Compute', label: 'Cores / Threads', value: '20 Cores / 28 Threads' },
      { category: 'Clock', label: 'Base / Boost', value: '3.4 GHz P-core Base / 5.6 GHz Turbo Boost' },
      { category: 'Power', label: 'TDP', value: '125W Base / 253W Max Turbo' }
    ],
    includedAccessories: ['Processor in authentic retail security seal box'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Intel-i7-14700K-Spec.pdf'
  },
  {
    id: 'prod-18',
    sku: 'ZEZ-KNG-64GBDDR5',
    model: 'KSM48R40BD4TMM-64HMR',
    name: 'Kingston Server Premier 64GB DDR5 4800MHz ECC Registered RDIMM',
    brand: 'Computer Components',
    categoryId: 'computer-components',
    categoryName: 'Computer Components',
    shortDescription: 'Industrial server-grade 288-pin DDR5 ECC Registered memory module for Dell, HP, and Supermicro servers.',
    fullDescription: 'Kingston Server Premier memory is specifically engineered for mission-critical enterprise servers. Features locked BOM (Bill of Materials), rigorous dynamic burn-in testing, and on-die ECC plus registered sideband error mitigation for continuous 24/7 uptime.',
    pricePhp: 19500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: 'Kingston Lifetime Enterprise Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '64GB Single Module Capacity',
      'DDR5 4800MT/s Speed (PC5-38400)',
      'ECC Registered Dual Rank x4 (2Rx4)',
      '1.1V Low Operating Voltage',
      'Server Platform Certified for Intel Xeon & AMD EPYC'
    ],
    specifications: [
      { category: 'Memory', label: 'Capacity', value: '64 GB' },
      { category: 'Memory', label: 'Standard', value: 'DDR5 Registered DIMM (RDIMM)' },
      { category: 'Speed', label: 'Frequency', value: '4800 MT/s (CL40)' },
      { category: 'Voltage', label: 'Voltage', value: '1.1V' }
    ],
    includedAccessories: ['Anti-static protective blister packaging'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Kingston-64GB-DDR5-RDIMM.pdf'
  },
  {
    id: 'prod-19',
    sku: 'ZEZ-SEA-16TBEXOS',
    model: 'ST16000NM000J',
    name: 'Seagate Exos X18 16TB Enterprise 7200 RPM SATA 6Gb/s 512e/4Kn HDD',
    brand: 'Servers & Storage',
    categoryId: 'servers-storage',
    categoryName: 'Servers & Storage',
    shortDescription: 'Hyperscale 16TB enterprise hard drive built for cloud data centers and high-density SAN/NAS storage arrays.',
    fullDescription: 'Seagate Exos X18 delivers proven enterprise reliability with 2.5 million hour MTBF, helium-sealed drive design for lower power consumption, and PowerChoice idle power management. Designed for 24/7 rigorous enterprise storage demands.',
    pricePhp: 22800,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '5-Year Seagate Limited Manufacturer Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '16TB Massive Hyperscale Enterprise Storage',
      'SATA 6 Gb/s Interface / 7200 RPM Spindle Speed',
      '256 MB High-Speed Multi-Segmented Cache Buffer',
      'Helium-Sealed Drive Design for Power Efficiency',
      '2.5M-Hour MTBF / 550 TB/year Workload Rating'
    ],
    specifications: [
      { category: 'Storage', label: 'Capacity', value: '16 TB' },
      { category: 'Interface', label: 'SATA', value: 'SATA 6.0 Gb/s' },
      { category: 'Performance', label: 'Rotational Speed', value: '7,200 RPM' },
      { category: 'Cache', label: 'Buffer', value: '256 MB' },
      { category: 'Reliability', label: 'MTBF', value: '2,500,000 Hours' }
    ],
    includedAccessories: ['Anti-static sealed envelope'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Seagate-Exos-X18-Datasheet.pdf'
  },
  {
    id: 'prod-20',
    sku: 'ZEZ-LOG-MEETUP',
    model: '960-001101',
    name: 'Logitech MeetUp 4K Ultra-HD Conference Camera with Integrated Audio',
    brand: 'Peripherals & Accessories',
    categoryId: 'peripherals-accessories',
    categoryName: 'Peripherals & Accessories',
    shortDescription: 'All-in-one conference camera with super-wide 120° FOV, motorized pan/tilt, and RightSight AI framing for huddle rooms.',
    fullDescription: 'Engineered specifically for small conference rooms and huddle spaces. The extra-wide 120° field of view captures everyone around the table. Integrated custom-tuned beamforming microphones and full-range speaker system deliver studio-grade acoustics.',
    pricePhp: 48500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year Logitech Hardware Warranty',
    isFeatured: true,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '4K Ultra HD Sensor with 5x HD Zoom',
      'Super-Wide 120° Field of View with Motorized Pan/Tilt',
      '3 Beamforming Microphones with 4-Meter Pickup Range',
      'RightSight Auto-Framing & RightSound Noise Suppression',
      'Plug-and-Play USB Connectivity (Teams & Zoom Certified)'
    ],
    specifications: [
      { category: 'Optics', label: 'Resolution', value: '4K Ultra HD (3840 x 2160 @ 30 fps)' },
      { category: 'Optics', label: 'FOV', value: '120° Diagonal (113° Horizontal, 80.7° Vertical)' },
      { category: 'Audio', label: 'Microphone', value: '3 beamforming mics with AEC & VAD' },
      { category: 'Audio', label: 'Speaker', value: 'Acoustically suspended speaker tuned for voice clarity' }
    ],
    includedAccessories: ['Remote control', '5m USB 2.0 cable', 'Power supply', 'Wall mount bracket'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Logitech-MeetUp-Datasheet.pdf'
  },
  {
    id: 'prod-21',
    sku: 'ZEZ-ASU-B9400',
    model: 'B9400CBA-KC0271X',
    name: 'ASUS ExpertBook B9 Ultralight Enterprise Laptop 14"',
    brand: 'ASUS',
    categoryId: 'computers-laptops',
    categoryName: 'Computers & Laptops',
    shortDescription: 'World\'s lightest 14" business laptop weighing only 880g, with magnesium-lithium alloy chassis and dual NVMe RAID.',
    fullDescription: 'Crafted from premium magnesium-lithium alloy, the ASUS ExpertBook B9 balances ultra-lightweight portability with enterprise endurance. Features an Intel Core i7-1255U processor, 32GB LPDDR5 RAM, dual 1TB NVMe SSDs in RAID 1 configuration for real-time redundancy, and up to 16 hours of battery life.',
    pricePhp: 92500,
    isPriceNegotiable: true,
    stockStatus: 'Pre-Order (5-7 Days)',
    leadTimeDays: 5,
    warranty: '3-Year ASUS Commercial Onsite Warranty with Accidental Damage Protection',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Featherweight 880 grams Magnesium-Lithium Alloy Chassis',
      'Intel Core i7-1255U Processor (10 Cores, up to 4.7 GHz)',
      '32GB LPDDR5 5200MHz RAM Onboard',
      '2TB PCIe 4.0 SSD (2x 1TB NVMe with RAID 0/1 Support)',
      'Full I/O Ports: Dual Thunderbolt 4, HDMI 2.0, RJ45 Micro-HDMI'
    ],
    specifications: [
      { category: 'Weight', label: 'Weight', value: '0.88 kg (1.94 lbs)' },
      { category: 'Processor', label: 'CPU', value: 'Intel Core i7-1255U 10-core (2P + 8E)' },
      { category: 'Display', label: 'Screen', value: '14.0" FHD (1920 x 1080) 16:9 400nits Anti-glare 100% sRGB' },
      { category: 'Security', label: 'Security', value: 'TPM 2.0, Fingerprint sensor, IR camera with Windows Hello' }
    ],
    includedAccessories: ['65W Type-C AC Adapter', 'Micro HDMI to RJ45 gigabit dongle', 'Protective carry sleeve'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'ASUS-ExpertBook-B9-Spec.pdf'
  },
  {
    id: 'prod-22',
    sku: 'ZEZ-CS-CBS350',
    model: 'CBS350-24T-4G',
    name: 'Cisco Business 350 Series 24-Port Gigabit Managed Switch',
    brand: 'Cisco',
    categoryId: 'networking-equipment',
    categoryName: 'Networking Equipment',
    shortDescription: 'Reliable Layer 3 managed switch with 24 Gigabit Ethernet ports and 4 dedicated Gigabit SFP uplinks.',
    fullDescription: 'The Cisco Business 350 Series switches are reliable workhorses designed for small-to-medium businesses. Combining advanced security, Layer 3 routing, energy-efficient Ethernet, and an intuitive web management dashboard, they provide an affordable foundation for corporate office networks.',
    pricePhp: 38200,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: 'Cisco Limited Lifetime Hardware Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '24x 10/100/1000 Gigabit RJ-45 Data Ports',
      '4x 1G SFP Dedicated Optical Uplinks',
      '56 Gbps Non-Blocking Switching Capacity',
      'Layer 3 Routing (Static Routing & CIDR)',
      'Cisco Business Dashboard Network Management'
    ],
    specifications: [
      { category: 'Capacity', label: 'Switching Bandwidth', value: '56 Gbps (41.66 Mpps)' },
      { category: 'Ports', label: 'RJ45 Ports', value: '24x 10/100/1000 Mbps' },
      { category: 'Uplinks', label: 'SFP Ports', value: '4x Gigabit SFP' },
      { category: 'Layer 3', label: 'IPv4/IPv6 Routing', value: 'Up to 990 static routes and 4094 VLANs' }
    ],
    includedAccessories: ['Rackmount kit', 'Console cable', 'Power cord', 'Rubber feet'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Cisco-CBS350-24T-Datasheet.pdf'
  },
  {
    id: 'prod-23',
    sku: 'ZEZ-HK-COLORVU',
    model: 'DS-2CD2387G2-LSU/SL',
    name: 'Hikvision 8MP 4K ColorVu Strobe Light & Audio Alarm Turret IP Camera',
    brand: 'Hikvision',
    categoryId: 'cctv-surveillance',
    categoryName: 'CCTV & Surveillance',
    shortDescription: '4K ColorVu security camera providing 24/7 vivid color imaging, two-way audio, and active strobe deterrence.',
    fullDescription: 'Hikvision ColorVu technology enables round-the-clock color video with an F1.0 super-aperture lens and advanced sensor. Includes live two-way talk intercom, flashing strobe light for intruder deterrent, and AcuSense AI classification for perimeter safety.',
    pricePhp: 16900,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year Hikvision Authorized Warranty',
    isFeatured: false,
    isNewArrival: true,
    mainImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '8 MP 4K UHD Resolution (3840 × 2160 @ 20 fps)',
      '24/7 Full-Color Imaging with F1.0 Super Aperture',
      'Active Deterrence: Built-in Strobe Light & Siren Alert',
      'Two-Way Audio with Built-in Mic & Speaker',
      'AcuSense Deep Learning Human/Vehicle Classification'
    ],
    specifications: [
      { category: 'Optics', label: 'Aperture', value: 'F1.0 Super Aperture' },
      { category: 'Resolution', label: 'Sensor', value: '1/1.2" Progressive Scan CMOS, 8 Megapixels' },
      { category: 'Illumination', label: 'White Light Range', value: 'Up to 30 meters soft warm supplemental light' },
      { category: 'Protection', label: 'Weatherproof', value: 'IP67 Water & Dust Resistance' }
    ],
    includedAccessories: ['Waterproof cable gland', 'Screws and wall plugs', 'Drilling template'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Hikvision-ColorVu-8MP-Spec.pdf'
  },
  {
    id: 'prod-24',
    sku: 'ZEZ-DEL-LAT5540',
    model: 'Latitude 5540 Business',
    name: 'Dell Latitude 5540 15.6" Business Workstation Laptop',
    brand: 'Dell',
    categoryId: 'computers-laptops',
    categoryName: 'Computers & Laptops',
    shortDescription: 'Scalable corporate 15.6" laptop with Intel Core i5-1345U vPro, numeric keypad, and long battery life.',
    fullDescription: 'Designed for finance, engineering, and enterprise office personnel who require a dedicated numeric keypad and a larger 15.6" display. Features Dell Optimizer AI software, hardware TPM 2.0 security, and comprehensive enterprise docking capabilities.',
    pricePhp: 62500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '3-Year Dell ProSupport Onsite Next Business Day',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Intel Core i5-1345U vPro (10 Cores, Up to 4.7 GHz)',
      '16GB DDR4 3200MHz Memory (2x SoDIMM Slots, Up to 64GB)',
      '512GB PCIe NVMe Class 35 Solid State Drive',
      '15.6" FHD (1920x1080) Anti-Glare IPS 250 nits Display',
      'Full Backlit Keyboard with 10-Key Numeric Pad'
    ],
    specifications: [
      { category: 'Processor', label: 'CPU', value: 'Intel Core i5-1345U vPro Enterprise' },
      { category: 'Display', label: 'Screen', value: '15.6" FHD (1920x1080) Non-Touch, 250 nits' },
      { category: 'Ports', label: 'I/O', value: '2x Thunderbolt 4 with Power Delivery & DP, 2x USB 3.2, 1x HDMI 2.0, 1x RJ-45' },
      { category: 'OS', label: 'System', value: 'Windows 11 Pro 64-bit' }
    ],
    includedAccessories: ['65W AC Type-C power adapter', 'Dell Pro briefcase'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'Dell-Latitude-5540-Datasheet.pdf'
  },
  {
    id: 'prod-25',
    sku: 'ZEZ-APC-SRV1000',
    model: 'SRV1KI-E',
    name: 'APC Easy UPS On-Line SRV 1000VA 230V Tower UPS',
    brand: 'APC',
    categoryId: 'ups-power-solutions',
    categoryName: 'UPS & Power Solutions',
    shortDescription: 'High quality, double-conversion on-line UPS designed for essential power protection in unstable power conditions.',
    fullDescription: 'Cost-effective true double-conversion on-line power protection for small server closets, network routers, and high-performance laboratory equipment. Features an LCD status display, ECO mode for up to 94% efficiency, and generator compatibility.',
    pricePhp: 24500,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '2-Year APC Repair or Replace Warranty',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      '1000VA / 800W Double-Conversion On-Line Power',
      '230V Pure Sine Wave Output (0ms Transfer Time)',
      'Multi-function LCD Status and Control Console',
      'Wide Input Voltage Window (110 - 300V) at Half Load',
      'Intelligent Battery Management for Longer Cell Life'
    ],
    specifications: [
      { category: 'Capacity', label: 'Output Power', value: '1000VA / 800 Watts' },
      { category: 'Waveform', label: 'Waveform Type', value: 'Sine wave on battery' },
      { category: 'Outlets', label: 'Connections', value: '3x IEC 60320 C13 receptacles' },
      { category: 'Dimensions', label: 'Size', value: '22.3 x 14.5 x 28.8 cm (9.3 kg)' }
    ],
    includedAccessories: ['Power cable', 'USB cable', 'User documentation'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'APC-Easy-UPS-SRV1KI-Spec.pdf'
  },
  {
    id: 'prod-26',
    sku: 'ZEZ-VMW-VSPHERE',
    model: 'VS8-STD-C',
    name: 'VMware vSphere 8 Standard Edition License (1-Year Support)',
    brand: 'Software & Licensing',
    categoryId: 'software-licensing',
    categoryName: 'Software & Licensing',
    shortDescription: 'Industry standard server virtualization platform enabling high application availability and resource consolidation.',
    fullDescription: 'VMware vSphere 8 Standard delivers basic server consolidation to slash hardware costs while accelerating application deployment. Includes vMotion live migration, High Availability (HA), vSphere Trust Authority, and centralized management via VMware vCenter Server.',
    pricePhp: 115000,
    isPriceNegotiable: true,
    stockStatus: 'In Stock',
    leadTimeDays: 1,
    warranty: '1-Year 24x7 VMware Production Support & Subscription',
    isFeatured: false,
    isNewArrival: false,
    mainImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
    ],
    keySpecs: [
      'Per-CPU Core Licensing (Licensed per 32 cores per CPU)',
      'Zero-Downtime Live Migration with vMotion',
      'Automated VM Failover with vSphere High Availability',
      'Centralized Resource Management via vCenter Server',
      'Includes 1 Year Production Support (24x7)'
    ],
    specifications: [
      { category: 'Software', label: 'Edition', value: 'VMware vSphere Standard 8' },
      { category: 'Model', label: 'Metric', value: 'Per Core (32 Core minimum per CPU)' },
      { category: 'Features', label: 'Included', value: 'vMotion, High Availability, vShield Endpoint, vSphere Replication' }
    ],
    includedAccessories: ['VMware Customer Connect license activation certificate'],
    datasheetUrl: '#datasheet',
    datasheetFileName: 'VMware-vSphere-8-Datasheet.pdf'
  }
];

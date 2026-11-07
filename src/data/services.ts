export interface EngineeringService {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  deliverables: string[];
  imageUrl: string;
  sourceUrl: string;
}

export const ENGINEERING_SERVICES: EngineeringService[] = [
  {
    id: 'fire-detection-alarm',
    name: 'Fire Detection and Alarm System',
    shortName: 'FDAS',
    tagline: 'Life safety sensing, addressable detection, and alarm notification',
    description: 'Design, supply, and installation of compliant Fire Detection and Alarm Systems (FDAS). Addressable and conventional control panels, smoke and heat detectors, manual pull stations, and synchronized audio-visual notification appliances for commercial buildings and industrial facilities.',
    deliverables: [
      'Addressable Fire Alarm Control Panels (FACP)',
      'Intelligent optical smoke & thermal heat sensors',
      'Audible horns, strobes & emergency warning beacons',
      'System wiring, programming, commissioning & testing'
    ],
    imageUrl: '/services/fire-detection-alarm.jpg',
    sourceUrl: 'https://zigmatech.shop/services/'
  },
  {
    id: 'fire-protection',
    name: 'Fire Protection System',
    shortName: 'Fire Protection',
    tagline: 'Automatic fire suppression, sprinkler lines, and standpipe engineering',
    description: 'Complete fire protection piping, automatic wet-pipe sprinkler systems, dry-pipe systems, and fire pump installations. Built in accordance with Philippine Fire Code (RA 9514) and NFPA standards to safeguard personnel, inventory, and structural investments.',
    deliverables: [
      'Automatic fire sprinkler system (AFSS) piping & heads',
      'Fire riser lines, check valves & tamper supervisory switches',
      'Fire hose cabinets, landing valves & Siamese connections',
      'Hydraulic calculation sizing & hydrostatic pressure testing'
    ],
    imageUrl: '/services/fire-protection.jpg',
    sourceUrl: 'https://zigmatech.shop/services/'
  },
  {
    id: 'structured-cabling',
    name: 'Structured Cabling',
    shortName: 'Cabling Infrastructure',
    tagline: 'Enterprise copper and fiber optic horizontal & backbone infrastructure',
    description: 'End-to-end network cabling design and deployment for corporate offices, data halls, and campuses. Certified Cat5e, Cat6, Cat6A UTP/STP, and single-mode/multi-mode fiber backbones with complete cable tray management, patch panel termination, and fluke testing certification.',
    deliverables: [
      'Cat6 / Cat6A UTP & FTP horizontal structured cabling',
      'Single-mode & Multi-mode fiber optic backbone runs',
      'Server rack enclosures, cable ladders & wire basket trays',
      'Permanent link certification & port labeling mapping'
    ],
    imageUrl: '/services/structured-cabling.jpg',
    sourceUrl: 'https://zigmatech.shop/services/'
  },
  {
    id: 'public-address-music',
    name: 'Public Address / Background Music System',
    shortName: 'PA / BGM',
    tagline: 'Multi-zone acoustic distribution, paging, and voice evacuation',
    description: 'Commercial Public Address and Background Music (PA/BGM) systems for retail establishments, corporate offices, warehouses, and hospitality venues. Zoned audio routing, emergency voice evacuation override, ceiling coaxial speakers, and mixer amplifiers.',
    deliverables: [
      'Zoned commercial mixer amplifiers & matrix processors',
      'Ceiling speakers, column speakers & weatherproof horn arrays',
      'Paging stations with selective zone microphone consoles',
      'Emergency voice alarm override & background music source integration'
    ],
    imageUrl: '/services/public-address-music.jpg',
    sourceUrl: 'https://zigmatech.shop/services/'
  },
  {
    id: 'mechanical-works',
    name: 'Mechanical Works',
    shortName: 'Mechanical & HVAC',
    tagline: 'Precision ventilation, air conditioning ducting, and exhaust systems',
    description: 'Commercial mechanical engineering including central air conditioning (VRF/VRV), precision climate control for server and battery rooms, fresh air intake, and industrial exhaust ventilation ductwork tailored to enterprise thermal requirements.',
    deliverables: [
      'Precision air conditioning (PACU) for computer rooms',
      'Sheet metal supply, return & exhaust air ductwork',
      'Chilled water / refrigerant piping insulation & valving',
      'Air balancing, commissioning & preventive maintenance'
    ],
    imageUrl: '/services/mechanical-works.jpg',
    sourceUrl: 'https://zigmatech.shop/services/'
  },
  {
    id: 'telephone-system',
    name: 'Telephone System',
    shortName: 'Telephony & VoIP',
    tagline: 'Enterprise IP PBX, unified communications, and VoIP telephony',
    description: 'Modern voice communication architecture for enterprise teams. Unified on-premise and cloud IP PBX platforms, SIP trunking, VoIP executive desk phones, auto-attendant IVR, and seamless extension roaming for branch and headquarters connectivity.',
    deliverables: [
      'IP PBX server appliances & hybrid telephony gateways',
      'Enterprise Gigabit PoE VoIP desk phones & conference units',
      'Interactive Voice Response (IVR) & automated attendant setup',
      'SIP trunk provisioning, call routing & intercom integration'
    ],
    imageUrl: '/services/telephone-system.jpg',
    sourceUrl: 'https://zigmatech.shop/'
  },
  {
    id: 'generators',
    name: 'Generators',
    shortName: 'Power Generation',
    tagline: 'Heavy-duty standby diesel generators and automatic transfer switches',
    description: 'Commercial and industrial standby power generation systems engineered for mission-critical operations. Supply, rigging, installation, sound-attenuated enclosures, exhaust silencers, and Automatic Transfer Switch (ATS) integration for seamless electrical continuity.',
    deliverables: [
      'Single & three-phase diesel generator sets (15 kVA to 1,500+ kVA)',
      'Automatic Transfer Switches (ATS) with utility sensing',
      'Soundproof weatherproof acoustic canopies & vibration isolators',
      'Fuel storage tanks, exhaust piping & load bank commissioning'
    ],
    imageUrl: '/services/generators.jpg',
    sourceUrl: 'https://zigmatech.shop/'
  }
];

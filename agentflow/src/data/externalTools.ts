import {
  MessageSquare,
  Users,
  Send,
  Phone,
  Mail,
  Calendar,
  Video,
  Database,
  Table2,
  FileSpreadsheet,
  FileSpreadsheet as ExcelIcon,
  BookMarked,
  BookMarked as NotionIcon,
  Box as BoxIcon,
  Github,
  Gitlab,
  Cloud as CloudIcon,
  CloudLightning as LambdaIcon,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Package,
  Layers,
  BarChart3,
  LineChart,
  Gauge,
  Search,
  Globe,
  Briefcase,
  FileText,
  MessageCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
  KeyRound,
  Clock,
  Mic,
  Brain,
  CheckSquare,
} from 'lucide-react';

export type ExternalTool = {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity?: 'simple' | 'medium' | 'complex';
  usage?: number; // approximate usage count for UI
  aliases?: string[]; // for search
  capabilities?: string[]; // for capability-based discovery
};

export const externalToolsCatalog: ExternalTool[] = [
  // Communication & Messaging
  { id: 'slack', name: 'Slack', description: 'Team communication, channel creation, message sending', category: 'Communication & Messaging', complexity: 'medium', usage: 2100000, aliases: ['messaging','team chat'], capabilities: ['send messages','channels','notifications'] },
  { id: 'discord', name: 'Discord', description: 'Community management, server automation', category: 'Communication & Messaging' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', description: 'Enterprise communication, meeting scheduling', category: 'Communication & Messaging', complexity: 'medium' },
  { id: 'telegram', name: 'Telegram', description: 'Bot messaging, channel broadcasting', category: 'Communication & Messaging' },
  { id: 'whatsapp-business', name: 'WhatsApp Business', description: 'Customer messaging, automated responses', category: 'Communication & Messaging', aliases: ['whatsapp','wa'] },
  { id: 'twilio', name: 'Twilio', description: 'SMS/voice messaging, phone number management', category: 'Communication & Messaging' },
  { id: 'sendgrid', name: 'SendGrid', description: 'Transactional email sending', category: 'Communication & Messaging' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing campaigns', category: 'Communication & Messaging' },
  { id: 'intercom', name: 'Intercom', description: 'Customer support chat, user messaging', category: 'Communication & Messaging' },

  // Email & Calendar
  { id: 'gmail', name: 'Gmail', description: 'Email reading, sending, filtering, labeling', category: 'Email & Calendar', complexity: 'simple', usage: 3500000, aliases: ['google mail'], capabilities: ['send email','read email'] },
  { id: 'outlook', name: 'Outlook', description: 'Email management, calendar integration', category: 'Email & Calendar' },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Event creation, scheduling, availability checking', category: 'Email & Calendar', complexity: 'simple', aliases: ['calendar'], capabilities: ['create event','availability'] },
  { id: 'calendly', name: 'Calendly', description: 'Meeting scheduling, availability management', category: 'Email & Calendar' },
  { id: 'zoom', name: 'Zoom', description: 'Meeting creation, webinar management', category: 'Email & Calendar' },
  { id: 'google-meet', name: 'Google Meet', description: 'Video call scheduling and management', category: 'Email & Calendar' },

  // Data Management & Storage
  { id: 'airtable', name: 'Airtable', description: 'Database operations, record management', category: 'Data Management & Storage', complexity: 'simple', usage: 1200000 },
  { id: 'google-sheets', name: 'Google Sheets', description: 'Spreadsheet automation, data manipulation', category: 'Data Management & Storage' },
  { id: 'excel-online', name: 'Excel Online', description: 'Workbook editing, formula calculations', category: 'Data Management & Storage' },
  { id: 'notion', name: 'Notion', description: 'Page creation, database management', category: 'Data Management & Storage', complexity: 'medium' },
  { id: 'mongodb', name: 'MongoDB', description: 'Document database operations', category: 'Data Management & Storage' },
  { id: 'postgresql', name: 'PostgreSQL', description: 'Relational database queries', category: 'Data Management & Storage' },
  { id: 'supabase', name: 'Supabase', description: 'Backend-as-a-service operations', category: 'Data Management & Storage' },
  { id: 'firebase', name: 'Firebase', description: 'Real-time database, authentication', category: 'Data Management & Storage' },

  // CRM & Sales
  { id: 'hubspot', name: 'HubSpot', description: 'Contact management, deal pipeline automation', category: 'CRM & Sales' },
  { id: 'salesforce', name: 'Salesforce', description: 'Lead management, opportunity tracking', category: 'CRM & Sales', complexity: 'complex' },
  { id: 'pipedrive', name: 'Pipedrive', description: 'Sales pipeline automation', category: 'CRM & Sales' },
  { id: 'zoho-crm', name: 'Zoho CRM', description: 'Customer relationship management', category: 'CRM & Sales' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing, subscription management', category: 'CRM & Sales', complexity: 'medium', usage: 2200000 },
  { id: 'paypal', name: 'PayPal', description: 'Transaction processing, invoice creation', category: 'CRM & Sales' },

  // Project Management
  { id: 'trello', name: 'Trello', description: 'Card creation, board management', category: 'Project Management', complexity: 'simple' },
  { id: 'asana', name: 'Asana', description: 'Task management, project tracking', category: 'Project Management' },
  { id: 'monday', name: 'Monday.com', description: 'Workflow automation, status updates', category: 'Project Management' },
  { id: 'jira', name: 'Jira', description: 'Issue tracking, sprint management', category: 'Project Management' },
  { id: 'linear', name: 'Linear', description: 'Bug tracking, feature requests', category: 'Project Management' },
  { id: 'clickup', name: 'ClickUp', description: 'Task automation, time tracking', category: 'Project Management' },
  { id: 'github', name: 'GitHub', description: 'Repository management, issue creation, PR automation', category: 'Project Management' },

  // Social Media & Marketing
  { id: 'twitter', name: 'Twitter/X', description: 'Tweet posting, engagement tracking', category: 'Social Media & Marketing' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Post publishing, connection management', category: 'Social Media & Marketing' },
  { id: 'facebook', name: 'Facebook', description: 'Page management, post scheduling', category: 'Social Media & Marketing' },
  { id: 'instagram', name: 'Instagram', description: 'Content publishing, story management', category: 'Social Media & Marketing' },
  { id: 'youtube', name: 'YouTube', description: 'Video upload, metadata management', category: 'Social Media & Marketing' },
  { id: 'tiktok', name: 'TikTok', description: 'Content posting, analytics tracking', category: 'Social Media & Marketing' },
  { id: 'buffer', name: 'Buffer', description: 'Social media scheduling', category: 'Social Media & Marketing' },
  { id: 'hootsuite', name: 'Hootsuite', description: 'Multi-platform social management', category: 'Social Media & Marketing' },

  // E-commerce & Inventory
  { id: 'shopify', name: 'Shopify', description: 'Product management, order processing', category: 'E-commerce & Inventory' },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Store automation, inventory updates', category: 'E-commerce & Inventory' },
  { id: 'amazon-seller', name: 'Amazon Seller Central', description: 'Product listing, order fulfillment', category: 'E-commerce & Inventory' },
  { id: 'ebay', name: 'eBay', description: 'Listing management, bid tracking', category: 'E-commerce & Inventory' },
  { id: 'square', name: 'Square', description: 'Point-of-sale integration, inventory sync', category: 'E-commerce & Inventory' },

  // File & Content Management
  { id: 'google-drive', name: 'Google Drive', description: 'File storage, sharing, collaboration', category: 'File & Content Management' },
  { id: 'dropbox', name: 'Dropbox', description: 'File synchronization, sharing', category: 'File & Content Management' },
  { id: 'onedrive', name: 'OneDrive', description: 'Document management, collaboration', category: 'File & Content Management' },
  { id: 'box', name: 'Box', description: 'Enterprise file sharing', category: 'File & Content Management' },
  { id: 'aws-s3', name: 'AWS S3', description: 'Cloud storage, file operations', category: 'File & Content Management' },
  { id: 'cloudinary', name: 'Cloudinary', description: 'Image/video processing, optimization', category: 'File & Content Management' },

  // Analytics & Monitoring
  { id: 'google-analytics', name: 'Google Analytics', description: 'Website traffic analysis', category: 'Analytics & Monitoring' },
  { id: 'mixpanel', name: 'Mixpanel', description: 'User behavior tracking', category: 'Analytics & Monitoring' },
  { id: 'amplitude', name: 'Amplitude', description: 'Product analytics', category: 'Analytics & Monitoring' },
  { id: 'hotjar', name: 'Hotjar', description: 'User session recording, heatmaps', category: 'Analytics & Monitoring' },
  { id: 'new-relic', name: 'New Relic', description: 'Application performance monitoring', category: 'Analytics & Monitoring' },
  { id: 'datadog', name: 'DataDog', description: 'Infrastructure monitoring, alerting', category: 'Analytics & Monitoring' },

  // Search & Information
  { id: 'google-search', name: 'Google Search', description: 'Web search, information retrieval', category: 'Search & Information' },
  { id: 'bing-search', name: 'Bing Search', description: 'Alternative web search', category: 'Search & Information' },
  { id: 'wikipedia', name: 'Wikipedia', description: 'Knowledge base queries', category: 'Search & Information' },
  { id: 'wolfram-alpha', name: 'Wolfram Alpha', description: 'Computational queries', category: 'Search & Information' },
  { id: 'perplexity', name: 'Perplexity', description: 'AI-powered search and research', category: 'Search & Information' },

  // HR & Recruitment
  { id: 'bamboohr', name: 'BambooHR', description: 'Employee management, time tracking', category: 'HR & Recruitment' },
  { id: 'workday', name: 'Workday', description: 'Human resources automation', category: 'HR & Recruitment' },
  { id: 'linkedin-recruiter', name: 'LinkedIn Recruiter', description: 'Candidate sourcing, outreach', category: 'HR & Recruitment' },
  { id: 'greenhouse', name: 'Greenhouse', description: 'Recruitment pipeline automation', category: 'HR & Recruitment' },
  { id: 'lever', name: 'Lever', description: 'Hiring workflow management', category: 'HR & Recruitment' },

  // Financial & Accounting
  { id: 'quickbooks', name: 'QuickBooks', description: 'Accounting automation, invoice management', category: 'Financial & Accounting' },
  { id: 'xero', name: 'Xero', description: 'Financial reporting, expense tracking', category: 'Financial & Accounting' },
  { id: 'freshbooks', name: 'FreshBooks', description: 'Time tracking, invoicing', category: 'Financial & Accounting' },
  { id: 'wave', name: 'Wave', description: 'Small business accounting', category: 'Financial & Accounting' },
  { id: 'mint', name: 'Mint', description: 'Personal finance tracking', category: 'Financial & Accounting' },

  // Development & DevOps
  { id: 'gitlab', name: 'GitLab', description: 'DevOps pipeline automation', category: 'Development & DevOps' },
  { id: 'docker-hub', name: 'Docker Hub', description: 'Container management', category: 'Development & DevOps' },
  { id: 'vercel', name: 'Vercel', description: 'Deployment automation', category: 'Development & DevOps' },
  { id: 'netlify', name: 'Netlify', description: 'Static site deployment', category: 'Development & DevOps' },
  { id: 'aws-lambda', name: 'AWS Lambda', description: 'Serverless function execution', category: 'Development & DevOps' },
  { id: 'heroku', name: 'Heroku', description: 'Application deployment, scaling', category: 'Development & DevOps' },

  // Customer Support
  { id: 'zendesk', name: 'Zendesk', description: 'Ticket management, customer support', category: 'Customer Support' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'Help desk automation', category: 'Customer Support' },
  { id: 'help-scout', name: 'Help Scout', description: 'Customer service workflows', category: 'Customer Support' },
  { id: 'crisp', name: 'Crisp', description: 'Live chat automation', category: 'Customer Support' },
  { id: 'helpshift', name: 'Helpshift', description: 'In-app support automation', category: 'Customer Support' },

  // Design & Creative
  { id: 'figma', name: 'Figma', description: 'Design file management, prototype sharing', category: 'Design & Creative' },
  { id: 'canva', name: 'Canva', description: 'Automated graphic creation', category: 'Design & Creative' },
  { id: 'adobe-cc', name: 'Adobe Creative Cloud', description: 'Asset management, automation', category: 'Design & Creative' },
  { id: 'sketch', name: 'Sketch', description: 'Design workflow automation', category: 'Design & Creative' },

  // Specialized Tools
  { id: 'zapier', name: 'Zapier', description: 'Integration bridge (meta-integration)', category: 'Specialized Tools' },
  { id: 'ifttt', name: 'IFTTT', description: 'Simple automation triggers', category: 'Specialized Tools' },
  { id: 'power-automate', name: 'Microsoft Power Automate', description: 'Enterprise workflow automation', category: 'Specialized Tools' },
  { id: 'workato', name: 'Workato', description: 'Enterprise integration platform', category: 'Specialized Tools' },
  { id: 'retool', name: 'Retool', description: 'Internal tool automation', category: 'Specialized Tools' },

  // Emerging AI Tools
  { id: 'openai', name: 'OpenAI API', description: 'GPT model integration', category: 'Emerging AI Tools' },
  { id: 'anthropic', name: 'Anthropic Claude', description: 'Advanced reasoning capabilities', category: 'Emerging AI Tools' },
  { id: 'midjourney', name: 'Midjourney', description: 'AI image generation', category: 'Emerging AI Tools' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Voice synthesis and processing', category: 'Emerging AI Tools' },
  { id: 'runway', name: 'Runway', description: 'AI video generation', category: 'Emerging AI Tools' },
  { id: 'pinecone', name: 'Pinecone', description: 'Vector database operations', category: 'Emerging AI Tools' },
  { id: 'langchain', name: 'LangChain', description: 'AI application framework integration', category: 'Emerging AI Tools' },

  // Productivity & Utilities
  { id: 'todoist', name: 'Todoist', description: 'Task management automation', category: 'Productivity & Utilities' },
  { id: 'evernote', name: 'Evernote', description: 'Note organization, content search', category: 'Productivity & Utilities' },
  { id: '1password', name: '1Password', description: 'Credential management', category: 'Productivity & Utilities' },
  { id: 'lastpass', name: 'LastPass', description: 'Password automation', category: 'Productivity & Utilities' },
  { id: 'rescuetime', name: 'RescueTime', description: 'Time tracking, productivity monitoring', category: 'Productivity & Utilities' },
];

export const externalToolCategories = Array.from(
  new Set(externalToolsCatalog.map((t) => t.category))
);

// Best-effort icon mapping using Lucide icons (brand approximations)
export function getExternalToolIcon(id: string) {
  const map: Record<string, any> = {
    // Communication & Messaging
    slack: MessageSquare,
    discord: MessageSquare,
    'microsoft-teams': Users,
    telegram: Send,
    'whatsapp-business': Phone,
    twilio: Phone,
    sendgrid: Mail,
    mailchimp: Mail,
    intercom: MessageSquare,

    // Email & Calendar
    gmail: Mail,
    outlook: Mail,
    'google-calendar': Calendar,
    calendly: Calendar,
    zoom: Video,
    'google-meet': Video,

    // Data Management & Storage
    airtable: Table2,
    'google-sheets': FileSpreadsheet,
    'excel-online': ExcelIcon,
    notion: NotionIcon,
    mongodb: Database,
    postgresql: Database,
    supabase: Database,
    firebase: Database,

    // CRM & Sales
    hubspot: Users,
    salesforce: Users,
    pipedrive: Users,
    'zoho-crm': Users,
    stripe: CreditCard,
    paypal: DollarSign,

    // Project Management
    trello: Layers,
    asana: Layers,
    monday: Layers,
    jira: Layers,
    linear: Layers,
    clickup: Layers,
    github: Github,

    // Social Media & Marketing
    twitter: MessageCircle,
    linkedin: Users,
    facebook: MessageSquare,
    instagram: ImageIcon,
    youtube: VideoIcon,
    tiktok: VideoIcon,
    buffer: MessageSquare,
    hootsuite: MessageSquare,

    // E-commerce & Inventory
    shopify: ShoppingCart,
    woocommerce: ShoppingCart,
    'amazon-seller': Package,
    ebay: Package,
    square: CreditCard,

    // File & Content Management
    'google-drive': FileText,
    dropbox: BoxIcon,
    onedrive: FileText,
    box: BoxIcon,
    'aws-s3': CloudIcon,
    cloudinary: ImageIcon,

    // Analytics & Monitoring
    'google-analytics': BarChart3,
    mixpanel: LineChart,
    amplitude: LineChart,
    hotjar: Gauge,
    'new-relic': Gauge,
    datadog: Gauge,

    // Search & Information
    'google-search': Search,
    'bing-search': Search,
    wikipedia: BookMarked,
    'wolfram-alpha': Globe,
    perplexity: Search,

    // HR & Recruitment
    bamboohr: Users,
    workday: Briefcase,
    'linkedin-recruiter': Users,
    greenhouse: Users,
    lever: Users,

    // Financial & Accounting
    quickbooks: DollarSign,
    xero: DollarSign,
    freshbooks: DollarSign,
    wave: DollarSign,
    mint: DollarSign,

    // Development & DevOps
    gitlab: Gitlab,
    'docker-hub': BoxIcon,
    vercel: CloudIcon,
    netlify: CloudIcon,
    'aws-lambda': LambdaIcon,
    heroku: CloudIcon,

    // Customer Support
    zendesk: MessageSquare,
    freshdesk: MessageSquare,
    'help-scout': MessageSquare,
    crisp: MessageSquare,
    helpshift: MessageSquare,

    // Design & Creative
    figma: ImageIcon,
    canva: ImageIcon,
    'adobe-cc': ImageIcon,
    sketch: ImageIcon,

    // Specialized Tools
    zapier: CloudIcon,
    ifttt: CloudIcon,
    'power-automate': CloudIcon,
    workato: CloudIcon,
    retool: CloudIcon,

    // Emerging AI Tools
    openai: Brain,
    anthropic: Brain,
    midjourney: ImageIcon,
    elevenlabs: Mic,
    runway: VideoIcon,
    pinecone: Database,
    langchain: Brain,

    // Productivity & Utilities
    todoist: CheckSquare,
    evernote: FileText,
    '1password': KeyRound,
    lastpass: KeyRound,
    rescuetime: Clock,
  } as Record<string, any>;
  return map[id] || MessageSquare;
}

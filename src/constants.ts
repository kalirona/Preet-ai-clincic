export const SITES = [
  { id: 1, name: 'Main Agency Site', url: 'https://preet-agency.com', status: 'Connected', lastSync: '10 mins ago' },
  { id: 2, name: 'Client: Zen SEO', url: 'https://zenithseo.io', status: 'Connected', lastSync: '2 hours ago' },
];

export const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { name: 'AI Suite', icon: 'Sparkles', children: [
    { name: 'Content Writer', href: '/ai-tools', icon: 'Sparkles' },
    { name: 'Blog Planner', href: '/blog-writer', icon: 'FileText' },
  ]},
  { name: 'CRM', href: '/crm', icon: 'Users' },
  { name: 'SEO Scanner', href: '/seo', icon: 'Search' },
  { name: 'WordPress', href: '/wordpress', icon: 'Globe' },
  { name: 'Billing', href: '/billing', icon: 'CreditCard' },
  { name: 'Settings', href: '/settings', icon: 'Settings' },
];

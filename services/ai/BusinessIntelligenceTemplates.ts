/**
 * Business Intelligence Field Templates
 * Predefined field mappings and templates for common business data types
 */

export interface FieldTemplate {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'array';
  description: string;
  category: 'discovery' | 'profile' | 'metrics' | 'funding' | 'tech_stack' | 'general';
  examples?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface BusinessTemplate {
  id: string;
  name: string;
  description: string;
  category: 'companies' | 'contacts' | 'products' | 'events' | 'projects';
  fields: FieldTemplate[];
  sampleQueries: string[];
  dataTypes: string[];
}

export const BUSINESS_INTELLIGENCE_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'tech-companies',
    name: 'Technology Companies',
    description: 'SaaS companies, startups, and technology businesses',
    category: 'companies',
    fields: [
      {
        name: 'company_name',
        label: 'Company Name',
        type: 'text',
        description: 'Official company name',
        category: 'discovery',
        examples: ['TechCorp Solutions', 'DataFlow Systems', 'CloudBase Inc'],
      },
      {
        name: 'website',
        label: 'Website',
        type: 'text',
        description: 'Company website URL',
        category: 'discovery',
        validation: {
          pattern: '^https?://.+',
        },
      },
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        description: 'Primary industry sector',
        category: 'profile',
        examples: ['Software as a Service (SaaS)', 'FinTech', 'HealthTech', 'EdTech'],
      },
      {
        name: 'headquarters',
        label: 'Headquarters',
        type: 'text',
        description: 'Company headquarters location',
        category: 'profile',
        examples: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Tokyo, Japan'],
      },
      {
        name: 'employee_count',
        label: 'Employee Count',
        type: 'number',
        description: 'Number of employees',
        category: 'metrics',
        validation: {
          min: 1,
          max: 100000,
        },
      },
      {
        name: 'revenue',
        label: 'Annual Revenue',
        type: 'number',
        description: 'Annual revenue in USD',
        category: 'metrics',
        validation: {
          min: 10000,
          max: 10000000000,
        },
      },
      {
        name: 'funding_stage',
        label: 'Funding Stage',
        type: 'text',
        description: 'Current funding stage',
        category: 'funding',
        validation: {
          options: ['Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'IPO', 'Bootstrapped'],
        },
      },
      {
        name: 'total_funding',
        label: 'Total Funding',
        type: 'number',
        description: 'Total funding raised in USD',
        category: 'funding',
        validation: {
          min: 0,
          max: 10000000000,
        },
      },
      {
        name: 'tech_stack',
        label: 'Tech Stack',
        type: 'array',
        description: 'Primary technologies used',
        category: 'tech_stack',
        examples: ['React, Node.js, AWS', 'Python, Django, GCP'],
      },
      {
        name: 'ceo',
        label: 'CEO',
        type: 'text',
        description: 'Chief Executive Officer name',
        category: 'general',
        examples: ['Sarah Johnson', 'Michael Chen', 'Emma Williams'],
      },
      {
        name: 'founded_year',
        label: 'Founded Year',
        type: 'number',
        description: 'Year the company was founded',
        category: 'profile',
        validation: {
          min: 1900,
          max: new Date().getFullYear(),
        },
      },
    ],
    sampleQueries: [
      'SaaS companies in California',
      'FinTech startups with Series A funding',
      'AI companies with 50-200 employees',
      'Enterprise software companies',
    ],
    dataTypes: [
      'technology companies',
      'software companies',
      'SaaS businesses',
      'startups',
      'tech companies',
    ],
  },
  {
    id: 'japanese-companies',
    name: 'Japanese Companies',
    description: 'Japanese businesses and corporations',
    category: 'companies',
    fields: [
      {
        name: 'company_name',
        label: 'Company Name (Japanese)',
        type: 'text',
        description: 'Company name in Japanese',
        category: 'discovery',
        examples: ['株式会社テックコーポ', 'データフロー株式会社', 'クラウドベース・ジャパン'],
      },
      {
        name: 'company_name_en',
        label: 'Company Name (English)',
        type: 'text',
        description: 'Company name in English',
        category: 'discovery',
        examples: ['TechCorp Japan', 'DataFlow Inc.', 'CloudBase Japan'],
      },
      {
        name: 'website',
        label: 'Website',
        type: 'text',
        description: 'Company website URL',
        category: 'discovery',
      },
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        description: 'Industry sector in Japanese',
        category: 'profile',
        examples: ['ソフトウェア開発', '金融サービス', 'ヘルスケア', '教育'],
      },
      {
        name: 'headquarters',
        label: 'Headquarters',
        type: 'text',
        description: 'Headquarters location in Japan',
        category: 'profile',
        examples: ['東京都渋谷区', '大阪府大阪市', '愛知県名古屋市', '福岡県福岡市'],
      },
      {
        name: 'employee_count',
        label: 'Number of Employees',
        type: 'number',
        description: 'Total number of employees',
        category: 'metrics',
        validation: {
          min: 1,
          max: 100000,
        },
      },
      {
        name: 'revenue',
        label: 'Annual Revenue',
        type: 'number',
        description: 'Annual revenue in JPY',
        category: 'metrics',
        validation: {
          min: 1000000,
          max: 1000000000000,
        },
      },
      {
        name: 'stock_exchange',
        label: 'Stock Exchange',
        type: 'text',
        description: 'Stock exchange where listed',
        category: 'funding',
        validation: {
          options: ['TSE', 'JASDAQ', 'Mothers', 'Unlisted'],
        },
      },
      {
        name: 'representative',
        label: 'Representative',
        type: 'text',
        description: 'Company representative name',
        category: 'general',
        examples: ['田中太郎', '佐藤花子', '鈴木一郎'],
      },
      {
        name: 'founded_year',
        label: 'Founded Year',
        type: 'number',
        description: 'Year company was founded',
        category: 'profile',
        validation: {
          min: 1900,
          max: new Date().getFullYear(),
        },
      },
    ],
    sampleQueries: [
      'Japanese technology companies in Tokyo',
      'Manufacturing companies in Osaka',
      'Japanese automotive companies',
      'Japanese retail companies',
    ],
    dataTypes: [
      'Japanese companies',
      'companies in Japan',
      'Japanese businesses',
      'Japan corporations',
    ],
  },
  {
    id: 'sales-contacts',
    name: 'Sales Contacts',
    description: 'Contact information for sales and marketing',
    category: 'contacts',
    fields: [
      {
        name: 'first_name',
        label: 'First Name',
        type: 'text',
        description: 'Contact first name',
        category: 'general',
        examples: ['John', 'Sarah', 'Michael', 'Emma'],
      },
      {
        name: 'last_name',
        label: 'Last Name',
        type: 'text',
        description: 'Contact last name',
        category: 'general',
        examples: ['Smith', 'Johnson', 'Williams', 'Brown'],
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        description: 'Business email address',
        category: 'general',
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        },
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'text',
        description: 'Business phone number',
        category: 'general',
      },
      {
        name: 'job_title',
        label: 'Job Title',
        type: 'text',
        description: 'Professional job title',
        category: 'general',
        examples: ['Sales Manager', 'CEO', 'Marketing Director', 'Product Manager'],
      },
      {
        name: 'company',
        label: 'Company',
        type: 'text',
        description: 'Company name',
        category: 'discovery',
      },
      {
        name: 'industry',
        label: 'Industry',
        type: 'text',
        description: 'Company industry',
        category: 'profile',
      },
      {
        name: 'company_size',
        label: 'Company Size',
        type: 'text',
        description: 'Company size category',
        category: 'metrics',
        validation: {
          options: ['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'],
        },
      },
      {
        name: 'linkedin_url',
        label: 'LinkedIn URL',
        type: 'text',
        description: 'LinkedIn profile URL',
        category: 'general',
      },
      {
        name: 'decision_maker',
        label: 'Decision Maker',
        type: 'boolean',
        description: 'Whether this contact is a decision maker',
        category: 'general',
      },
      {
        name: 'seniority_level',
        label: 'Seniority Level',
        type: 'text',
        description: 'Seniority level of the contact',
        category: 'general',
        validation: {
          options: ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Manager', 'Director', 'VP', 'C-Level', 'Owner'],
        },
      },
    ],
    sampleQueries: [
      'CEOs in technology companies',
      'Marketing managers at SaaS companies',
      'Sales directors in financial services',
      'IT decision makers at manufacturing companies',
    ],
    dataTypes: [
      'sales contacts',
      'business contacts',
      'leads',
      'prospects',
      'customer contacts',
    ],
  },
  {
    id: 'ecommerce-stores',
    name: 'E-commerce Stores',
    description: 'Online retail businesses and stores',
    category: 'companies',
    fields: [
      {
        name: 'store_name',
        label: 'Store Name',
        type: 'text',
        description: 'Name of the e-commerce store',
        category: 'discovery',
        examples: ['TechGadgets Store', 'FashionHub', 'HomeEssentials', 'SportsGear Pro'],
      },
      {
        name: 'website',
        label: 'Website',
        type: 'text',
        description: 'Store website URL',
        category: 'discovery',
      },
      {
        name: 'category',
        label: 'Store Category',
        type: 'text',
        description: 'Primary product category',
        category: 'profile',
        examples: ['Electronics', 'Fashion & Apparel', 'Home & Garden', 'Sports & Outdoors', 'Beauty & Health'],
      },
      {
        name: 'products_count',
        label: 'Products Count',
        type: 'number',
        description: 'Number of products listed',
        category: 'metrics',
        validation: {
          min: 1,
          max: 100000,
        },
      },
      {
        name: 'monthly_revenue',
        label: 'Monthly Revenue',
        type: 'number',
        description: 'Average monthly revenue in USD',
        category: 'metrics',
        validation: {
          min: 1000,
          max: 10000000,
        },
      },
      {
        name: 'platform',
        label: 'E-commerce Platform',
        type: 'text',
        description: 'Platform the store uses',
        category: 'tech_stack',
        validation: {
          options: ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Custom Built', 'Amazon', 'Etsy'],
        },
      },
      {
        name: 'country',
        label: 'Country',
        type: 'text',
        description: 'Country where the store is based',
        category: 'profile',
        examples: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'],
      },
      {
        name: 'owner_name',
        label: 'Owner Name',
        type: 'text',
        description: 'Store owner name',
        category: 'general',
        examples: ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emma Williams'],
      },
      {
        name: 'email',
        label: 'Contact Email',
        type: 'text',
        description: 'Store contact email',
        category: 'general',
      },
      {
        name: 'year_established',
        label: 'Year Established',
        type: 'number',
        description: 'Year the store was established',
        category: 'profile',
        validation: {
          min: 1990,
          max: new Date().getFullYear(),
        },
      },
    ],
    sampleQueries: [
      'Fashion stores on Shopify',
      'Electronics e-commerce stores',
      'Home decor online stores',
      'US-based e-commerce businesses',
    ],
    dataTypes: [
      'e-commerce stores',
      'online stores',
      'retail businesses',
      'webshops',
      'online retailers',
    ],
  },
];

/**
 * Get field template by name
 */
export function getFieldTemplate(fieldName: string): FieldTemplate | null {
  for (const template of BUSINESS_INTELLIGENCE_TEMPLATES) {
    const field = template.fields.find(f =>
      f.name === fieldName || f.label === fieldName
    );
    if (field) return field;
  }
  return null;
}

/**
 * Get business template by ID
 */
export function getBusinessTemplate(templateId: string): BusinessTemplate | null {
  return BUSINESS_INTELLIGENCE_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Search templates by keywords
 */
export function searchTemplates(keywords: string[]): BusinessTemplate[] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  return BUSINESS_INTELLIGENCE_TEMPLATES.filter(template => {
    const searchableText = [
      template.name,
      template.description,
      ...template.dataTypes,
      ...template.sampleQueries,
      ...template.fields.map(f => f.name),
      ...template.fields.map(f => f.label),
      ...template.fields.map(f => f.description),
    ].join(' ').toLowerCase();

    return lowerKeywords.some(keyword => searchableText.includes(keyword));
  });
}

/**
 * Get column mappings for a template
 */
export function getColumnMappings(template: BusinessTemplate): Record<string, FieldTemplate> {
  const mappings: Record<string, FieldTemplate> = {};

  template.fields.forEach(field => {
    mappings[field.name] = field;
    mappings[field.label] = field;
  });

  return mappings;
}

/**
 * Suggest template based on table columns
 */
export function suggestTemplate(columns: Array<{ name: string; label?: string; type?: string }>): BusinessTemplate | null {
  // Score each template based on column matches
  let bestTemplate: BusinessTemplate | null = null;
  let bestScore = 0;

  BUSINESS_INTELLIGENCE_TEMPLATES.forEach(template => {
    let score = 0;
    const columnNames = columns.map(c => [c.name.toLowerCase(), (c.label || '').toLowerCase()]);

    template.fields.forEach(field => {
      const fieldName = field.name.toLowerCase();
      const fieldLabel = field.label.toLowerCase();

      // Check for exact matches
      columnNames.forEach(([colName, colLabel]) => {
        if (colName.includes(fieldName) || fieldName.includes(colName)) score += 3;
        if (colLabel.includes(fieldName) || fieldName.includes(colLabel)) score += 2;
        if (colName.includes(fieldLabel) || fieldLabel.includes(colName)) score += 2;
        if (colLabel.includes(fieldLabel) || fieldLabel.includes(colLabel)) score += 1;
      });
    });

    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  });

  return bestScore > 3 ? bestTemplate : null;
}
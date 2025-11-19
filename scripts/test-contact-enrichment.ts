/**
 * Test script for Gemini3ContactEnrichmentAgent
 * Run with: npx tsx scripts/test-contact-enrichment.ts
 */

import { Gemini3ContactEnrichmentAgent } from '../lib/services/enrichment/agents/Gemini3ContactEnrichmentAgent';
import type { TableRecord } from '../lib/services/enrichment/agents/Gemini3ContactEnrichmentAgent';
import type { EnrichmentField } from '../lib/services/enrichment/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_KEY;

if (!GEMINI_API_KEY || !FIRECRAWL_API_KEY) {
  console.error('Error: GEMINI_API_KEY and FIRECRAWL_KEY must be set');
  process.exit(1);
}

async function testContactEnrichment() {
  console.log('🧪 Testing Gemini3ContactEnrichmentAgent\n');

  const agent = new Gemini3ContactEnrichmentAgent(GEMINI_API_KEY!, FIRECRAWL_API_KEY!);

  // Test 1: Record with full context (company name + website)
  console.log('Test 1: Record with full context');
  console.log('─'.repeat(80));

  const record1: TableRecord = {
    id: 'test-1',
    name: '山田太郎',
    company: 'BASE株式会社',
    data: {
      website: 'https://binc.jp',
      industry: 'Eコマース',
    },
  };

  const targetFields: EnrichmentField[] = [
    { name: 'email', displayName: 'Email', type: 'string', description: 'メールアドレス', required: false },
    { name: 'phone', displayName: 'Phone', type: 'string', description: '電話番号', required: false },
    { name: 'address', displayName: 'Address', type: 'string', description: '住所', required: false },
  ];

  const result1 = await agent.enrichRecord(
    record1,
    targetFields,
    (message, type) => {
      const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✗' : 'ℹ';
      console.log(`  ${icon} ${message}`);
    }
  );

  console.log('\nResult 1:');
  console.log('Success:', result1.success);
  console.log('Fields:');
  result1.fields.forEach(field => {
    console.log(`  - ${field.name}: ${field.value} (confidence: ${field.confidence})`);
  });
  console.log('Sources:', result1.sources.length);
  console.log('\n');

  // Test 2: Record with minimal context (only company name)
  console.log('Test 2: Record with minimal context');
  console.log('─'.repeat(80));

  const record2: TableRecord = {
    id: 'test-2',
    company: 'STORES株式会社',
    data: {},
  };

  const result2 = await agent.enrichRecord(
    record2,
    targetFields,
    (message, type) => {
      const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✗' : 'ℹ';
      console.log(`  ${icon} ${message}`);
    }
  );

  console.log('\nResult 2:');
  console.log('Success:', result2.success);
  console.log('Fields:');
  result2.fields.forEach(field => {
    console.log(`  - ${field.name}: ${field.value} (confidence: ${field.confidence})`);
  });
  console.log('Sources:', result2.sources.length);
  console.log('\n');

  // Summary
  console.log('─'.repeat(80));
  console.log('✅ Tests complete!');
  console.log(`Test 1: ${result1.success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 2: ${result2.success ? 'PASS' : 'FAIL'}`);
}

testContactEnrichment().catch(console.error);

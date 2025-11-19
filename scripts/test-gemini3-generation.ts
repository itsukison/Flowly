/**
 * Test script for Gemini 3 hybrid data generation
 * Run with: npx tsx scripts/test-gemini3-generation.ts
 */

import { Gemini3KnowledgeAgent } from '../lib/services/enrichment/agents/Gemini3KnowledgeAgent';
import { Gemini3EnrichmentAgent } from '../lib/services/enrichment/agents/Gemini3EnrichmentAgent';
import { EnrichmentField } from '../lib/services/enrichment/types';

async function testGeneration() {
  console.log('🧪 Testing Gemini 3 Hybrid Data Generation\n');

  // Check environment variables
  const geminiKey = process.env.GEMINI_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_KEY;

  if (!geminiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }

  if (!firecrawlKey) {
    console.error('❌ FIRECRAWL_KEY not found in environment');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');

  // Test configuration
  const dataType = '日本のecommerce会社';
  const specifications = 'スケールがあまり多くない会社';
  const count = 3;
  const fields: EnrichmentField[] = [
    { name: 'company_name', displayName: '会社名', description: '企業の正式名称', type: 'string', required: true },
    { name: 'website', displayName: 'ウェブサイト', description: '公式ウェブサイトURL', type: 'string', required: false },
    { name: 'email', displayName: 'メールアドレス', description: '連絡先メールアドレス', type: 'string', required: false },
    { name: 'employee_count', displayName: '従業員数', description: '従業員の人数', type: 'number', required: false },
  ];

  console.log('📋 Test Configuration:');
  console.log(`  Data Type: ${dataType}`);
  console.log(`  Specifications: ${specifications}`);
  console.log(`  Count: ${count}`);
  console.log(`  Fields: ${fields.map(f => f.name).join(', ')}\n`);

  try {
    // Phase 1: Knowledge Extraction
    console.log('🔍 Phase 1: Knowledge Extraction\n');
    const knowledgeAgent = new Gemini3KnowledgeAgent(geminiKey);
    
    const startKnowledge = Date.now();
    const companies = await knowledgeAgent.execute(
      dataType,
      specifications,
      count,
      fields,
      (message, type) => {
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${message}`);
      }
    );
    const knowledgeTime = Date.now() - startKnowledge;

    console.log(`\n⏱️  Knowledge extraction took ${(knowledgeTime / 1000).toFixed(2)}s\n`);

    if (companies.length === 0) {
      console.error('❌ No companies found');
      process.exit(1);
    }

    // Display results
    console.log('📊 Knowledge Extraction Results:\n');
    companies.forEach((company, i) => {
      console.log(`${i + 1}. ${company.name}`);
      console.log(`   Website: ${company.website}`);
      
      const highConf = company.fields.filter(f => f.confidence >= 0.80 && f.value !== null);
      const lowConf = company.fields.filter(f => f.confidence < 0.80 || f.value === null);
      
      console.log(`   High-confidence fields (${highConf.length}):`);
      highConf.forEach(f => {
        console.log(`     ✓ ${f.name}: ${JSON.stringify(f.value)} (${(f.confidence * 100).toFixed(0)}%)`);
      });
      
      if (lowConf.length > 0) {
        console.log(`   Low-confidence fields (${lowConf.length}):`);
        lowConf.forEach(f => {
          console.log(`     ✗ ${f.name}: needs enrichment (${(f.confidence * 100).toFixed(0)}%)`);
        });
      }
      console.log('');
    });

    // Phase 2: Enrichment
    console.log('🔧 Phase 2: Targeted Enrichment\n');
    const enrichmentAgent = new Gemini3EnrichmentAgent(geminiKey, firecrawlKey);
    
    const startEnrichment = Date.now();
    const enrichedCompanies = [];
    
    for (const company of companies) {
      const enriched = await enrichmentAgent.execute(
        company,
        fields,
        (message, type) => {
          const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${message}`);
        }
      );
      enrichedCompanies.push(enriched);
    }
    
    const enrichmentTime = Date.now() - startEnrichment;
    console.log(`\n⏱️  Enrichment took ${(enrichmentTime / 1000).toFixed(2)}s\n`);

    // Final results
    console.log('🎉 Final Results:\n');
    enrichedCompanies.forEach((company, i) => {
      console.log(`${i + 1}. ${company.name}`);
      
      const data: Record<string, any> = {};
      company.fields.forEach(f => {
        if (f.value !== null) {
          data[f.name] = f.value;
        }
      });
      
      console.log(`   Data:`, JSON.stringify(data, null, 2).split('\n').map((line, idx) => idx === 0 ? line : `   ${line}`).join('\n'));
      console.log(`   Sources: ${company.sources.length} attributions`);
      console.log('');
    });

    // Summary
    const totalTime = Date.now() - startKnowledge;
    console.log('📈 Summary:');
    console.log(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Companies generated: ${enrichedCompanies.length}/${count}`);
    console.log(`  Phase 1 (Knowledge): ${(knowledgeTime / 1000).toFixed(2)}s`);
    console.log(`  Phase 2 (Enrichment): ${(enrichmentTime / 1000).toFixed(2)}s`);
    console.log(`  Average per company: ${(totalTime / enrichedCompanies.length / 1000).toFixed(2)}s`);
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testGeneration();

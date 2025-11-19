/**
 * @deprecated This API endpoint is deprecated and will be removed in a future version.
 * 
 * Use /api/enrichment/enrich-contacts instead for better performance and features.
 * 
 * The new endpoint uses Gemini 3 Pro with Firecrawl fallback:
 * - 57-81% cost reduction
 * - 2-3x faster enrichment
 * - Real-time progress tracking
 * - Uses ALL row data for smarter enrichment
 * - Job-based async processing
 * 
 * Migration: Replace calls to /api/enrich/contact with /api/enrichment/enrich-contacts
 * See: .agent/tasks/CONTACT_ENRICHMENT_GEMINI3_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichByUrl, enrichByCompanyName } from '@/lib/services/enrichmentService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recordIds, sourceColumn, targetFields } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: 'Invalid recordIds' }, { status: 400 });
    }

    if (!sourceColumn || !targetFields || !Array.isArray(targetFields)) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    // Fetch records
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .in('id', recordIds);

    if (fetchError || !records || records.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // Get table_id from first record
    const tableId = records[0].table_id;

    // Check if columns exist, create if needed
    const columnMapping: Record<string, string> = {
      email: 'メールアドレス',
      phone: '電話番号',
      representative: '担当者'
    };

    for (const field of targetFields) {
      if (field === 'email') continue; // email is a direct column, skip

      const columnName = field;
      const columnLabel = columnMapping[field];

      // Check if column exists
      const { data: existingColumn } = await supabase
        .from('table_columns')
        .select('id')
        .eq('table_id', tableId)
        .eq('name', columnName)
        .single();

      if (!existingColumn) {
        // Create the column
        const { data: maxOrder } = await supabase
          .from('table_columns')
          .select('display_order')
          .eq('table_id', tableId)
          .order('display_order', { ascending: false })
          .limit(1)
          .single();

        await supabase
          .from('table_columns')
          .insert({
            table_id: tableId,
            name: columnName,
            label: columnLabel,
            type: 'text',
            is_required: false,
            display_order: (maxOrder?.display_order || 0) + 1,
            options: {}
          });
      }
    }

    // Process each record
    const results = await Promise.all(
      records.map(async (record) => {
        try {
          // Get source value (company name or URL)
          const data = (record.data as Record<string, any>) || {};
          const sourceValue = (record as any)[sourceColumn] || data[sourceColumn];

          if (!sourceValue) {
            return {
              recordId: record.id,
              success: false,
              error: 'Source value not found'
            };
          }

          // Determine enrichment strategy
          const isUrl = sourceColumn.toLowerCase().includes('url') ||
                       sourceColumn.toLowerCase().includes('website') ||
                       sourceColumn.toLowerCase().includes('domain');

          const enrichmentResult = isUrl
            ? await enrichByUrl(sourceValue)
            : await enrichByCompanyName(sourceValue);

          if (!enrichmentResult.success) {
            return {
              recordId: record.id,
              success: false,
              error: enrichmentResult.error
            };
          }

          // Update record with enriched data in JSONB fields
          const enrichedData = {
            ...data,
          };

          // Add enriched fields to data
          if (targetFields.includes('phone') && enrichmentResult.data?.phone) {
            enrichedData.phone = enrichmentResult.data.phone;
          }
          if (targetFields.includes('representative') && enrichmentResult.data?.representative) {
            enrichedData.representative = enrichmentResult.data.representative;
          }

          // Store metadata
          enrichedData.enrichment_metadata = {
            confidence: enrichmentResult.data?.confidence,
            source: enrichmentResult.data?.source,
            tokushoho_url: enrichmentResult.data?.tokushoho_url,
            enriched_at: new Date().toISOString(),
          };

          // Update direct email field if requested
          const updates: any = { data: enrichedData };

          if (targetFields.includes('email') && enrichmentResult.data?.email) {
            updates.email = enrichmentResult.data.email;
          }

          const { error: updateError } = await supabase
            .from('records')
            .update(updates)
            .eq('id', record.id);

          if (updateError) {
            throw new Error('Failed to update record');
          }

          return {
            recordId: record.id,
            success: true,
            data: enrichmentResult.data
          };
        } catch (error) {
          return {
            recordId: record.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successCount,
      failureCount,
      results
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to process enrichment' },
      { status: 500 }
    );
  }
}

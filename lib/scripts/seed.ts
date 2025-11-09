/**
 * Seed script for development/testing
 * Run this to populate the database with sample data
 * 
 * Usage: Create an organization and user first through the UI,
 * then run this script with their IDs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key for seeding

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Starting seed...')

  // You'll need to replace these with actual IDs from your database
  const ORGANIZATION_ID = 'YOUR_ORG_ID_HERE'
  const USER_ID = 'YOUR_USER_ID_HERE'

  // Sample customers
  const customers = [
    {
      organization_id: ORGANIZATION_ID,
      name: '山田太郎',
      name_furigana: 'やまだたろう',
      email: 'yamada@toyota.co.jp',
      phone: '03-1234-5678',
      company_name: 'トヨタ自動車株式会社',
      company_domain: 'toyota.co.jp',
      address: '愛知県豊田市トヨタ町1番地',
      industry: '自動車製造',
      employee_count: 70000,
      status: '商談中',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '佐藤花子',
      name_furigana: 'さとうはなこ',
      email: 'sato@sony.co.jp',
      phone: '03-2345-6789',
      company_name: 'ソニー株式会社',
      company_domain: 'sony.co.jp',
      address: '東京都港区港南1-7-1',
      industry: '電子機器',
      employee_count: 110000,
      status: '契約',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '鈴木一郎',
      name_furigana: 'すずきいちろう',
      email: 'suzuki@rakuten.co.jp',
      phone: '03-3456-7890',
      company_name: '楽天グループ株式会社',
      company_domain: 'rakuten.co.jp',
      address: '東京都世田谷区玉川1-14-1',
      industry: 'Eコマース',
      employee_count: 28000,
      status: 'リード',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '田中美咲',
      name_furigana: 'たなかみさき',
      email: 'tanaka@softbank.jp',
      phone: '03-4567-8901',
      company_name: 'ソフトバンク株式会社',
      company_domain: 'softbank.jp',
      address: '東京都港区海岸1-7-1',
      industry: '通信',
      employee_count: 18000,
      status: '運用中',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '高橋健太',
      name_furigana: 'たかはしけんた',
      email: 'takahashi@panasonic.com',
      phone: '06-6908-1121',
      company_name: 'パナソニック株式会社',
      company_domain: 'panasonic.com',
      address: '大阪府門真市大字門真1006番地',
      industry: '電子機器',
      employee_count: 240000,
      status: '商談中',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '伊藤さくら',
      name_furigana: 'いとうさくら',
      email: 'ito@ntt.co.jp',
      phone: '03-5678-9012',
      company_name: '日本電信電話株式会社',
      company_domain: 'ntt.co.jp',
      address: '東京都千代田区大手町1-5-1',
      industry: '通信',
      employee_count: 330000,
      status: 'リード',
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '渡辺大輔',
      name_furigana: 'わたなべだいすけ',
      email: 'watanabe@honda.co.jp',
      phone: '03-6789-0123',
      company_name: '本田技研工業株式会社',
      company_domain: 'honda.co.jp',
      address: '東京都港区南青山2-1-1',
      industry: '自動車製造',
      employee_count: 220000,
      status: '休眠',
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '中村優子',
      name_furigana: 'なかむらゆうこ',
      email: 'nakamura@mitsubishi.com',
      phone: '03-7890-1234',
      company_name: '三菱電機株式会社',
      company_domain: 'mitsubishi.com',
      address: '東京都千代田区丸の内2-7-3',
      industry: '電子機器',
      employee_count: 146000,
      status: '契約',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '小林誠',
      name_furigana: 'こばやしまこと',
      email: 'kobayashi@canon.co.jp',
      phone: '03-8901-2345',
      company_name: 'キヤノン株式会社',
      company_domain: 'canon.co.jp',
      address: '東京都大田区下丸子3-30-2',
      industry: '光学機器',
      employee_count: 180000,
      status: '商談中',
      assigned_to: USER_ID,
      created_by: USER_ID,
    },
    {
      organization_id: ORGANIZATION_ID,
      name: '加藤愛',
      name_furigana: 'かとうあい',
      email: 'kato@fujitsu.com',
      phone: '044-777-1111',
      company_name: '富士通株式会社',
      company_domain: 'fujitsu.com',
      address: '神奈川県川崎市中原区上小田中4-1-1',
      industry: 'IT・ソフトウェア',
      employee_count: 126000,
      status: 'リード',
      created_by: USER_ID,
    },
  ]

  try {
    // Insert customers
    console.log('📝 Inserting customers...')
    const { data: insertedCustomers, error: customerError } = await supabase
      .from('customers')
      .insert(customers)
      .select()

    if (customerError) {
      console.error('❌ Error inserting customers:', customerError)
      return
    }

    console.log(`✅ Inserted ${insertedCustomers.length} customers`)

    // Create activity logs for each customer
    console.log('📝 Creating activity logs...')
    const activityLogs = insertedCustomers.map((customer) => ({
      customer_id: customer.id,
      organization_id: ORGANIZATION_ID,
      user_id: USER_ID,
      action_type: 'created',
      changes: { customer },
    }))

    const { error: activityError } = await supabase
      .from('customer_activity_log')
      .insert(activityLogs)

    if (activityError) {
      console.error('❌ Error creating activity logs:', activityError)
      return
    }

    console.log(`✅ Created ${activityLogs.length} activity logs`)

    // Create some duplicate candidates for testing
    console.log('📝 Creating duplicate candidates...')
    if (insertedCustomers.length >= 2) {
      const duplicates = [
        {
          organization_id: ORGANIZATION_ID,
          customer_id_1: insertedCustomers[0].id,
          customer_id_2: insertedCustomers[1].id,
          similarity_score: 0.75,
          match_reasons: ['名前が類似'],
          status: 'pending',
        },
      ]

      const { error: duplicateError } = await supabase
        .from('duplicate_candidates')
        .insert(duplicates)

      if (duplicateError) {
        console.error('❌ Error creating duplicates:', duplicateError)
      } else {
        console.log(`✅ Created ${duplicates.length} duplicate candidates`)
      }
    }

    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
  }
}

// Run seed
seed()

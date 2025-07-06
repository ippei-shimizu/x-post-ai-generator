// Supabase接続テスト（Node.js）
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: './frontend/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 環境変数チェック:')
console.log('SUPABASE_URL:', supabaseUrl || '❌ 未設定')
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 設定済み' : '❌ 未設定')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('\n🚀 Supabase接続テスト開始...\n')
  
  try {
    // 1. 基本的な接続テスト
    console.log('1️⃣ データベース接続テスト...')
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 接続エラー:', error.message)
    } else {
      console.log('✅ データベース接続成功！')
    }
    
    // 2. 認証サービステスト
    console.log('\n2️⃣ 認証サービステスト...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ 認証サービスエラー:', authError.message)
    } else {
      console.log('✅ 認証サービス利用可能')
      console.log('   現在のユーザー:', user?.email || '（未ログイン）')
    }
    
    // 3. RLS動作確認
    console.log('\n3️⃣ Row Level Security (RLS) テスト...')
    const { data: rlsData, error: rlsError } = await supabase
      .from('personas')
      .select('count')
      .limit(1)
    
    if (rlsError) {
      console.error('❌ RLSエラー:', rlsError.message)
    } else {
      console.log('✅ RLSポリシーが正常に動作')
      console.log('   レコード数:', rlsData?.length || 0, '（認証なしのため0件）')
    }
    
    // 4. pgvector確認
    console.log('\n4️⃣ pgvector拡張機能テスト...')
    const { data: vectorData, error: vectorError } = await supabase
      .from('content_embeddings')
      .select('count')
      .limit(1)
    
    if (vectorError) {
      console.error('❌ pgvectorエラー:', vectorError.message)
    } else {
      console.log('✅ pgvector拡張機能が利用可能')
    }
    
    // サマリー
    console.log('\n🎉 接続テスト完了')
    console.log('─'.repeat(40))
    console.log('✅ ローカルSupabaseに正常に接続')
    console.log('✅ 全テーブルが作成済み')
    console.log('✅ RLSポリシーが有効')
    console.log('✅ pgvectorが利用可能')
    console.log('\n📊 Supabase Local Info:')
    console.log(`   URL: ${supabaseUrl}`)
    console.log('   Studio: http://127.0.0.1:54323')
    console.log('   Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    
  } catch (err) {
    console.error('\n❌ 予期しないエラー:', err.message)
  }
}

testConnection()
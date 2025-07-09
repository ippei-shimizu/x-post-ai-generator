#!/bin/bash

# Supabase マイグレーション実行スクリプト
# ローカル開発環境とリモート環境の両方に対応

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 使用方法
usage() {
    echo "Usage: $0 [local|remote] [migration_file]"
    echo "  local  - ローカルのSupabaseインスタンスで実行"
    echo "  remote - リモートのSupabaseプロジェクトで実行"
    echo ""
    echo "Example:"
    echo "  $0 local database/migrations/001_create_users_table.sql"
    echo "  $0 remote database/migrations/001_create_users_table.sql"
    exit 1
}

# 引数チェック
if [ $# -ne 2 ]; then
    usage
fi

ENV=$1
MIGRATION_FILE=$2

# ファイルの存在チェック
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Running migration: $MIGRATION_FILE${NC}"
echo ""

if [ "$ENV" = "local" ]; then
    # ローカル環境での実行
    echo -e "${GREEN}Executing on local Supabase...${NC}"
    
    # Supabase CLIがインストールされているか確認
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}Error: Supabase CLI is not installed${NC}"
        echo "Install it with: brew install supabase/tap/supabase"
        exit 1
    fi
    
    # ローカルSupabaseが起動しているか確認
    if ! supabase status &> /dev/null; then
        echo -e "${YELLOW}Starting local Supabase...${NC}"
        supabase start
    fi
    
    # マイグレーション実行
    supabase db push --local < "$MIGRATION_FILE"
    
    echo -e "${GREEN}Migration completed on local Supabase!${NC}"
    
elif [ "$ENV" = "remote" ]; then
    # リモート環境での実行
    echo -e "${GREEN}Executing on remote Supabase...${NC}"
    
    # 環境変数チェック
    if [ -z "$SUPABASE_DB_URL" ]; then
        echo -e "${RED}Error: SUPABASE_DB_URL environment variable is not set${NC}"
        echo "Set it with: export SUPABASE_DB_URL='your-database-url'"
        exit 1
    fi
    
    # psqlがインストールされているか確認
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}Error: psql is not installed${NC}"
        echo "Install PostgreSQL client tools"
        exit 1
    fi
    
    # マイグレーション実行
    psql "$SUPABASE_DB_URL" -f "$MIGRATION_FILE"
    
    echo -e "${GREEN}Migration completed on remote Supabase!${NC}"
    
else
    echo -e "${RED}Error: Invalid environment. Use 'local' or 'remote'${NC}"
    usage
fi

echo ""
echo -e "${GREEN}✓ Migration executed successfully!${NC}"
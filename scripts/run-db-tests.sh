#!/bin/bash

# データベーステスト実行スクリプト
# RLS ポリシーやトリガーのテストを実行

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 使用方法
usage() {
    echo "Usage: $0 [local|remote] [test_file]"
    echo "  local  - ローカルのSupabaseインスタンスで実行"
    echo "  remote - リモートのSupabaseプロジェクトで実行"
    echo ""
    echo "Example:"
    echo "  $0 local database/tests/users_rls_test.sql"
    echo "  $0 remote database/tests/users_rls_test.sql"
    exit 1
}

# 引数チェック
if [ $# -ne 2 ]; then
    usage
fi

ENV=$1
TEST_FILE=$2

# ファイルの存在チェック
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}Error: Test file not found: $TEST_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Running database tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}Test file: $TEST_FILE${NC}"
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
    
    # テスト実行
    echo ""
    echo -e "${YELLOW}Executing tests...${NC}"
    echo ""
    
    supabase db push --local < "$TEST_FILE" 2>&1 | while IFS= read -r line; do
        if [[ $line == *"NOTICE:"* ]]; then
            if [[ $line == *"passed"* ]]; then
                echo -e "${GREEN}✓ $line${NC}"
            else
                echo -e "${YELLOW}ℹ $line${NC}"
            fi
        elif [[ $line == *"ERROR:"* ]] || [[ $line == *"ASSERT"* ]]; then
            echo -e "${RED}✗ $line${NC}"
        else
            echo "$line"
        fi
    done
    
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
    
    # テスト実行
    echo ""
    echo -e "${YELLOW}Executing tests...${NC}"
    echo ""
    
    psql "$SUPABASE_DB_URL" -f "$TEST_FILE" 2>&1 | while IFS= read -r line; do
        if [[ $line == *"NOTICE:"* ]]; then
            if [[ $line == *"passed"* ]]; then
                echo -e "${GREEN}✓ $line${NC}"
            else
                echo -e "${YELLOW}ℹ $line${NC}"
            fi
        elif [[ $line == *"ERROR:"* ]] || [[ $line == *"ASSERT"* ]]; then
            echo -e "${RED}✗ $line${NC}"
        else
            echo "$line"
        fi
    done
    
else
    echo -e "${RED}Error: Invalid environment. Use 'local' or 'remote'${NC}"
    usage
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Test execution completed!${NC}"
echo -e "${BLUE}================================${NC}"
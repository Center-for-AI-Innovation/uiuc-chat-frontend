#!/bin/bash

# requires postgresql@15

# MacOS
# brew install postgresql@15
# brew info postgresql@15
# check if postgres is in path. if not, add it to path.
# echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.bash_profile
# source ~/.bash_profile
# brew services start postgresql@15

# source .env file
source .env

# Use the environment variables directly
PGPASSWORD=$SUPABASE_PASSWORD pg_dump -h aws-0-us-east-1.pooler.supabase.com -U postgres.$SUPABASE_URL -d postgres --schema-only > schema.sql


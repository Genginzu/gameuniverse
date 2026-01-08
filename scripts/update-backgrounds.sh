#!/bin/bash
# Shell script to update game backgrounds
# This script runs the migration and updates existing games with background customization

echo "🎮 Updating game backgrounds..."

# Run the migration to add background fields
echo "📦 Running migration to add background fields..."
bunx supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

echo "✅ Migration completed successfully!"

# Update existing games with background data
echo "🎨 Updating existing games with background colors and images..."
bunx supabase db reset --linked

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed!"
    exit 1
fi

echo "✅ Database updated successfully!"
echo "🎉 Game backgrounds have been updated! You can now test the new background customization feature."
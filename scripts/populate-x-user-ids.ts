#!/usr/bin/env npx tsx
/**
 * Populate X User IDs Script
 * 
 * Slowly populates x_user_id column in tracked_experts table
 * Respects X API free tier rate limits (25 user lookups per 15 mins)
 * 
 * Run this multiple times - it will pick up where it left off:
 * 
 *   npx tsx scripts/populate-x-user-ids.ts
 * 
 * Options:
 *   --batch=N    Number of experts to process (default: 5)
 *   --delay=MS   Delay between requests in ms (default: 5000)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bearerToken = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line args
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '5');
const delayMs = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '5000');

async function getUserId(username: string): Promise<string | null> {
  if (!bearerToken) {
    throw new Error('TWITTER_BEARER_TOKEN not set');
  }

  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  );

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API error ${response.status}: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data?.data?.id || null;
}

async function main() {
  console.log('=== Populate X User IDs ===');
  console.log(`Batch size: ${batchSize}`);
  console.log(`Delay between requests: ${delayMs}ms\n`);

  if (!bearerToken) {
    console.error('❌ TWITTER_BEARER_TOKEN not set in .env.local');
    process.exit(1);
  }

  // Get experts without user IDs
  const { data: experts, error } = await supabase
    .from('tracked_experts')
    .select('slug, name, x_handle')
    .not('x_handle', 'is', null)
    .is('x_user_id', null)
    .eq('is_active', true)
    .limit(batchSize);

  if (error) {
    console.error('Failed to fetch experts:', error);
    process.exit(1);
  }

  if (!experts || experts.length === 0) {
    console.log('✅ All experts already have cached user IDs!');
    
    // Show stats
    const { count: total } = await supabase
      .from('tracked_experts')
      .select('*', { count: 'exact', head: true })
      .not('x_handle', 'is', null);
    
    const { count: cached } = await supabase
      .from('tracked_experts')
      .select('*', { count: 'exact', head: true })
      .not('x_handle', 'is', null)
      .not('x_user_id', 'is', null);
    
    console.log(`\n📊 Stats: ${cached}/${total} experts have cached IDs`);
    return;
  }

  console.log(`Processing ${experts.length} experts (need IDs)...\n`);

  let succeeded = 0;
  let failed = 0;
  let rateLimited = false;

  for (const expert of experts) {
    if (!expert.x_handle) continue;

    console.log(`Looking up @${expert.x_handle} (${expert.name})...`);

    try {
      const userId = await getUserId(expert.x_handle);

      if (userId) {
        await supabase
          .from('tracked_experts')
          .update({ x_user_id: userId })
          .eq('slug', expert.slug);

        console.log(`  ✅ Cached: ${userId}`);
        succeeded++;
      } else {
        console.log(`  ⚠️ No user found`);
        failed++;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMITED') {
        console.log(`  ⛔ Rate limited! Stopping batch.`);
        rateLimited = true;
        break;
      }
      console.log(`  ❌ Error: ${err instanceof Error ? err.message : err}`);
      failed++;
    }

    // Wait between requests
    if (experts.indexOf(expert) < experts.length - 1 && !rateLimited) {
      console.log(`  Waiting ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Final stats
  const { count: remaining } = await supabase
    .from('tracked_experts')
    .select('*', { count: 'exact', head: true })
    .not('x_handle', 'is', null)
    .is('x_user_id', null)
    .eq('is_active', true);

  console.log('\n=== Results ===');
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Remaining: ${remaining}`);

  if (rateLimited) {
    console.log('\n⚠️ Rate limited! Wait 15 minutes and run again.');
  } else if (remaining && remaining > 0) {
    console.log(`\n💡 Run again to process ${remaining} more experts.`);
  } else {
    console.log('\n🎉 All experts have cached user IDs!');
  }
}

main().catch(console.error);

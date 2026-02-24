import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wavdcidowmeknqjbaehz.supabase.co',
  'sb_publishable_S8W8AyYRHO5_V3gv_q8Ptw_N9KV6fb6'
);

async function checkProfiles() {
  try {
    // Get sample profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('membership_id, full_name')
      .limit(10);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log('Sample profiles:');
    data?.forEach(p => console.log(`  - ${p.membership_id}: ${p.full_name}`));
    
    // Try to find the specific ID
    const { data: found } = await supabase
      .from('profiles')
      .select('membership_id, full_name')
      .eq('membership_id', 'SAV-2026-42424');
    
    console.log('\nSearch for SAV-2026-42424:');
    if (found && found.length > 0) {
      console.log('FOUND:', found[0]);
    } else {
      console.log('NOT FOUND - Trying fuzzy search...');
      
      // Try ilike
      const { data: fuzzy } = await supabase
        .from('profiles')
        .select('membership_id, full_name')
        .ilike('membership_id', '%42424%');
      
      if (fuzzy && fuzzy.length > 0) {
        console.log('Fuzzy match found:');
        fuzzy.forEach(p => console.log(`  - ${p.membership_id}: ${p.full_name}`));
      } else {
        console.log('No fuzzy match either');
      }
    }
    
    // Check count
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('\nTotal profiles in DB:', count);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkProfiles();

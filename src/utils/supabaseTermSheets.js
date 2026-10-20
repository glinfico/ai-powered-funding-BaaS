import { supabase } from '../supabaseClient';

/**
 * Saves a generated REI Term Sheet payload directly into Supabase database.
 */
export async function saveTermSheetToSupabase(termSheetPayload) {
  try {
    const { data, error } = await supabase
      .from('term_sheets') // Target Supabase table
      .insert([termSheetPayload])
      .select();

    if (error) {
      console.error('Supabase Term Sheet Save Error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, record: data[0] };
  } catch (err) {
    console.error('Unexpected error saving term sheet:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches recent term sheets for display in the CRM workspace.
 */
export async function fetchRecentTermSheets() {
  try {
    const { data, error } = await supabase
      .from('term_sheets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error fetching term sheets:', err.message);
    return { success: false, data: [] };
  }
}

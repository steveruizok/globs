import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get a shared project from the database.
 * @param id
 * @returns
 */
export async function fetchSharedProject(id: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .select("*")
    .eq("id", id)

  if (error) throw error

  return data
}

/**
 * Create a new shared project. Visits to the project URL will display the project.
 * @param name
 * @param json
 * @returns
 */
export async function createSharedProject(name: string, json: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .insert([{ document: json, name }])

  if (error) throw error

  return data
}

/**
 * Update a shared project.
 * @param id
 * @param name
 * @param json
 * @returns
 */
export async function updateSharedProject(
  id: string,
  name: string,
  json: string
) {
  const { data, error } = await supabase
    .from("shared-projects")
    .update([{ document: json, name }])
    .eq("id", id)

  if (error) throw error

  return data
}

/**
 * Delete (unshare) a shared project. Visits to the project URL will no longer return the project.
 * @param id
 * @returns
 */
export async function deleteSharedProject(id: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .delete()
    .eq("id", id)

  if (error) throw error

  return data
}

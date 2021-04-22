import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Create a new shared project. Visits to the project URL will display the project.
 * @param name
 * @param document
 * @returns
 */
export async function createSharedProject(name: string, document: string) {
  return supabase
    .from("projects")
    .insert([{ name, document: JSON.parse(document) }])
}

/**
 * Get a shared project from the database using the document id.
 * @param url
 * @returns
 */
export async function fetchSharedProjectById(id: string) {
  return supabase
    .from("projects")
    .select("*")
    .eq("document->>id", id)
}

/**
 * Get a shared project from the database.
 * @param url
 * @returns
 */
export async function fetchSharedProjectByUuid(uuid: string) {
  return supabase
    .from("projects")
    .select("*")
    .eq("uuid", uuid)
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
  document: string
) {
  return supabase
    .from("projects")
    .update({ name, document: JSON.parse(document) })
    .eq("document->>id", id)
}

/**
 * Delete (unshare) a shared project. Visits to the project URL will no longer return the project.
 * @param url
 * @returns
 */
export async function deleteSharedProject(uuid: string) {
  return supabase
    .from("projects")
    .delete()
    .eq("uuid", uuid)
}

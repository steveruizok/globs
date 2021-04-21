import { createClient } from "@supabase/supabase-js"
import { IData, IProject } from "./types"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Get a shared project from the database.
 * @param url
 * @returns
 */
export async function fetchSharedProject(url: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .select("*")
    .eq("uuid", url)

  if (error) throw error

  return data
}

/**
 * Create a new shared project. Visits to the project URL will display the project.
 * @param name
 * @param document
 * @returns
 */
export async function createSharedProject(name: string, document: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .insert([{ document, name }])

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
export async function updateSharedProject(d: IData) {
  const { id, name, nodes, globs, groups, pages, code, version } = d

  const project: IProject = {
    id,
    name,
    nodes,
    globs,
    groups,
    pages,
    code,
    version,
  }

  const document = JSON.stringify(project)

  const { data, error } = await supabase
    .from("shared-projects")
    .update([{ document, name }])
    .eq("id", d.id)

  if (error) throw error

  return data
}

/**
 * Delete (unshare) a shared project. Visits to the project URL will no longer return the project.
 * @param url
 * @returns
 */
export async function deleteSharedProject(url: string) {
  const { data, error } = await supabase
    .from("shared-projects")
    .delete()
    .eq("uuid", url)

  if (error) throw error

  return data
}

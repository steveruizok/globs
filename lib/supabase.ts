import { createClient } from "@supabase/supabase-js"
import { IData, IProject } from "./types"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

function getDocumentFromData(data: IData): IProject {
  const { id, name, nodes, globs, groups, pages, code, version } = data

  return {
    id,
    name,
    nodes,
    globs,
    groups,
    pages,
    version,
    code,
  }
}

/**
 * Create a new shared project. Visits to the project URL will display the project.
 * @param name
 * @param document
 * @returns
 */
export async function createSharedProject(data: IData) {
  const document = getDocumentFromData(data)
  return supabase.from("projects").insert([{ name: data.name, document }])
}

/**
 * Get a shared project from the database using the document id.
 * @param url
 * @returns
 */
export async function fetchSharedProject(data: IData) {
  return supabase
    .from("projects")
    .select("*")
    .eq("document->>id", data.id)
}

/**
 * Update a shared project.
 * @param id
 * @param name
 * @param json
 * @returns
 */
export async function updateSharedProject(data: IData) {
  const { shareUrl, name } = data
  const document = getDocumentFromData(data)
  return supabase
    .from("projects")
    .update({ name, document })
    .eq("uuid", shareUrl)
}

/**
 * Delete (unshare) a shared project. Visits to the project URL will no longer return the project.
 * @param url
 * @returns
 */
export async function deleteSharedProject(data: IData) {
  const { shareUrl } = data
  console.log(shareUrl)
  return supabase
    .from("projects")
    .delete()
    .eq("uuid", shareUrl)
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

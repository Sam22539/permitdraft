import { backend } from "./backend";

/** The signed-in person's own display name (null when none saved yet). Row rules let each read and write only their own. */
export async function readDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await backend.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data?.display_name as string | undefined) ?? null;
}

export async function saveDisplayName(userId: string, name: string): Promise<void> {
  const { data, error } = await backend.from("profiles").update({ display_name: name }).eq("user_id", userId).select("user_id");
  if (error) throw error;
  if (data && data.length > 0) return;
  const { error: ie } = await backend.from("profiles").insert({ user_id: userId, display_name: name });
  if (ie) throw ie;
}

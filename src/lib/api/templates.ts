import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type TemplateInsert = Database["public"]["Tables"]["email_templates"]["Insert"];
type TemplateUpdate = Database["public"]["Tables"]["email_templates"]["Update"];

export async function getTemplates(companyId: string) {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("company_id", companyId)
    .order("template_type", { ascending: true });
  if (error) throw error;
  return data;
}

export async function upsertTemplate(template: TemplateInsert) {
  // Check if a template of this type already exists for this company
  const { data: existing } = await supabase
    .from("email_templates")
    .select("id")
    .eq("company_id", template.company_id)
    .eq("template_type", template.template_type)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("email_templates")
      .update({
        name: template.name,
        subject: template.subject,
        body: template.body,
        updated_at: new Date().toISOString(),
      } satisfies TemplateUpdate)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data;
}

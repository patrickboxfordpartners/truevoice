// TODO: Phase 3 - migrate to Convex (Joan already has email_templates table)
// For now, keeping Supabase for email templates

import { supabase } from "@/lib/supabase";

export async function getTemplates(companyId: string) {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("company_id", companyId)
    .order("template_type", { ascending: true });
  if (error) throw error;
  return data;
}

export async function upsertTemplate(template: {
  company_id: string;
  template_type: string;
  name: string;
  subject: string;
  body: string;
}) {
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
      })
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

// Email templates via Convex (Joan already has email_templates table)
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export async function getTemplates(companyId: string) {
  return client.query(api.queries.getEmailTemplates, { companyId });
}

export async function upsertTemplate(template: {
  company_id: string;
  template_type: string;
  name: string;
  subject: string;
  body: string;
}) {
  return client.mutation(api.mutations.saveEmailTemplate, {
    companyId: template.company_id,
    templateType: template.template_type,
    name: template.name,
    subject: template.subject,
    body: template.body,
  });
}

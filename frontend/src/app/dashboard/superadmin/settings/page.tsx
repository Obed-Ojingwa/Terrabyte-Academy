"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Award, ListChecks, Activity, PlusCircle, Trash2, Save, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_by?: string;
  updated_by_user?: { first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  body?: string;
  issuer_left?: string;
  issuer_right?: string;
  company_name?: string;
  company_registration?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  description?: string;
  created_at: string;
}

type CertificateTemplateForm = Omit<CertificateTemplate, "id" | "created_at" | "updated_at">;

const initialTemplateForm: CertificateTemplateForm = {
  name: "",
  title: "",
  subtitle: "",
  body: "",
  issuer_left: "Training Coordinator",
  issuer_right: "CEO",
  company_name: "Terrabyte Academy",
  company_registration: "",
  logo_url: "",
};

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<CertificateTemplateForm>(initialTemplateForm);

  const statsQuery = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => (await api.get("/analytics/admin")).data,
  });

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get("/admin/settings")).data as PlatformSetting[],
  });

  const templatesQuery = useQuery({
    queryKey: ["admin-certificate-templates"],
    queryFn: async () => (await api.get("/admin/certificate-templates")).data as CertificateTemplate[],
  });

  const activityQuery = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => (await api.get("/admin/activity-logs")).data as ActivityLog[],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (payload: { key: string; value: string; description?: string }) =>
      api.put(`/admin/settings/${encodeURIComponent(payload.key)}`, payload),
    onSuccess: () => {
      toast.success("Setting updated");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: () => toast.error("Unable to update setting"),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (payload: CertificateTemplateForm) => api.post("/admin/certificate-templates", payload),
    onSuccess: () => {
      toast.success("Certificate template created");
      setTemplateForm(initialTemplateForm);
      setSelectedTemplateId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-templates"] });
    },
    onError: () => toast.error("Unable to create template"),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<CertificateTemplateForm> }) =>
      api.put(`/admin/certificate-templates/${payload.id}`, payload.data),
    onSuccess: () => {
      toast.success("Template updated");
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-templates"] });
    },
    onError: () => toast.error("Unable to update template"),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/certificate-templates/${id}`),
    onSuccess: () => {
      toast.success("Template deleted");
      setSelectedTemplateId(null);
      setTemplateForm(initialTemplateForm);
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-templates"] });
    },
    onError: () => toast.error("Unable to delete template"),
  });

  const templates = templatesQuery.data ?? [];
  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    if (activeTemplate) {
      setTemplateForm({
        name: activeTemplate.name,
        title: activeTemplate.title,
        subtitle: activeTemplate.subtitle ?? "",
        body: activeTemplate.body ?? "",
        issuer_left: activeTemplate.issuer_left ?? "",
        issuer_right: activeTemplate.issuer_right ?? "",
        company_name: activeTemplate.company_name ?? "",
        company_registration: activeTemplate.company_registration ?? "",
        logo_url: activeTemplate.logo_url ?? "",
      });
    } else {
      setTemplateForm(initialTemplateForm);
    }
  }, [activeTemplate]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Super Admin Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage platform settings, certificate templates, and activity logs.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total admins", value: statsQuery.data?.admin_users ?? 0, icon: ShieldCheck },
          { label: "Pending certificates", value: statsQuery.data?.pending_reviews ?? 0, icon: Award },
          { label: "Active enrollments", value: statsQuery.data?.active_enrollments ?? 0, icon: ListChecks },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="page-surface rounded-2xl p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-slate-950">{statsQuery.isLoading ? "—" : value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="page-surface rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
                <SettingsIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Platform settings</h2>
                <p className="text-sm text-slate-500">Update values that control how the platform behaves.</p>
              </div>
            </div>
            <div className="space-y-4">
              {settingsQuery.data?.map((setting) => (
                <div key={setting.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{setting.key}</p>
                      <p className="text-xs text-slate-500">{setting.description ?? "No description"}</p>
                    </div>
                    <span className="text-xs text-slate-400">Updated {new Date(setting.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                    <input
                      type="text"
                      defaultValue={setting.value}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950"
                      onBlur={(event) => {
                        const value = event.target.value;
                        if (value !== setting.value) {
                          updateSettingMutation.mutate({ key: setting.key, value, description: setting.description });
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updateSettingMutation.mutate({ key: setting.key, value: setting.value, description: setting.description })}
                      className="inline-flex h-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {settingsQuery.isLoading && <p className="text-sm text-slate-500">Loading settings…</p>}
            </div>
          </section>

          <section className="page-surface rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
                <Award size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Certificate templates</h2>
                <p className="text-sm text-slate-500">Create and edit certificate templates for issued awards.</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.7fr_0.9fr]">
              <div className="space-y-4">
                {(templatesQuery.data ?? []).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedTemplateId === template.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{template.name}</p>
                        <p className="text-sm text-slate-500">{template.title}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
                {templatesQuery.isLoading && <p className="text-sm text-slate-500">Loading templates…</p>}
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold text-slate-950">{activeTemplate ? "Edit template" : "New template"}</h3>
                <div className="grid gap-3">
                  <input
                    value={templateForm.title}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Title"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                  <input
                    value={templateForm.name}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Template name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                    disabled={!!selectedTemplateId}
                  />
                  <textarea
                    value={templateForm.body}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, body: event.target.value }))}
                    placeholder="Body template"
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={templateForm.issuer_left}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, issuer_left: event.target.value }))}
                    placeholder="Issuer left"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                  <input
                    value={templateForm.issuer_right}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, issuer_right: event.target.value }))}
                    placeholder="Issuer right"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={templateForm.company_name}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, company_name: event.target.value }))}
                    placeholder="Company name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                  <input
                    value={templateForm.company_registration}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, company_registration: event.target.value }))}
                    placeholder="Registration number"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                  />
                </div>
                <input
                  value={templateForm.logo_url}
                  onChange={(event) => setTemplateForm((prev) => ({ ...prev, logo_url: event.target.value }))}
                  placeholder="Logo URL"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTemplateId) {
                        updateTemplateMutation.mutate({ id: selectedTemplateId, data: templateForm });
                      } else {
                        createTemplateMutation.mutate(templateForm);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    <PlusCircle size={16} /> {selectedTemplateId ? "Save changes" : "Create template"}
                  </button>
                  {selectedTemplateId && (
                    <button
                      type="button"
                      onClick={() => selectedTemplateId && deleteTemplateMutation.mutate(selectedTemplateId)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="page-surface rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Activity logs</h2>
                <p className="text-sm text-slate-500">Recent administrative actions and changes.</p>
              </div>
            </div>
            <div className="space-y-3">
              {(activityQuery.data ?? []).slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{log.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm text-slate-500">{log.description ?? "No details"}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{log.resource_type ?? "General"} · {new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))}
              {activityQuery.isLoading && <p className="text-sm text-slate-500">Loading activity…</p>}
              {!activityQuery.isLoading && !(activityQuery.data ?? []).length && <p className="text-sm text-slate-500">No activity logged yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

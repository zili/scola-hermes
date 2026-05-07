"use client";

import { useState } from "react";
import { Settings, Save, School, User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("school");
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: "school", label: "École", icon: School },
    { id: "users", label: "Utilisateurs", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Shield },
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500">Configurez les paramètres de l'application</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64">
          <div className="card p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "school" && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-900">Informations de l'école</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nom de l'école</label>
                    <input type="text" className="input" defaultValue="École Scuila" />
                  </div>
                  <div>
                    <label className="label">Code établissement</label>
                    <input type="text" className="input" defaultValue="SCU001" />
                  </div>
                </div>
                <div>
                  <label className="label">Adresse</label>
                  <input type="text" className="input" defaultValue="123 Rue Mohammed V, Tanger, Maroc" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Téléphone</label>
                    <input type="text" className="input" defaultValue="+212 539 XX XX XX" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" defaultValue="contact@scuila.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Année scolaire actuelle</label>
                    <input type="text" className="input" defaultValue="2025-2026" />
                  </div>
                  <div>
                    <label className="label">Frais d'inscription (DH)</label>
                    <input type="number" className="input" defaultValue="1500" />
                  </div>
                </div>
              </div>
              <div className="card-footer px-6 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={handleSave} className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-900">Gestion des utilisateurs</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Administrateur</p>
                        <p className="text-sm text-slate-500">Accès complet à toutes les fonctionnalités</p>
                      </div>
                      <span className="badge badge-info">1 utilisateur</span>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Secrétaire</p>
                        <p className="text-sm text-slate-500">Gestion des inscriptions et absences</p>
                      </div>
                      <span className="badge badge-info">0 utilisateur</span>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Enseignants</p>
                        <p className="text-sm text-slate-500">Saisie des notes et absences</p>
                      </div>
                      <span className="badge badge-info">5 utilisateurs</span>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Étudiants</p>
                        <p className="text-sm text-slate-500">Consultation des bulletins</p>
                      </div>
                      <span className="badge badge-info">33 utilisateurs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-900">Notifications</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Inscriptions en attente</p>
                    <p className="text-sm text-slate-500">Notifier pour les nouvelles inscriptions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Absences excessives</p>
                    <p className="text-sm text-slate-500">Alerter quand un élève dépasse 5 absences</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">Résultats faibles</p>
                    <p className="text-sm text-slate-500">Notifier quand la moyenne est inférieure à 10</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-900">Sécurité</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Mot de passe administrateur</label>
                  <input type="password" className="input" defaultValue="••••••••" />
                </div>
                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <input type="password" className="input" defaultValue="••••••••" />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-medium text-slate-900 mb-3">Sessions actives</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Session actuelle</p>
                        <p className="text-sm text-slate-500">Chrome sur Windows • Tanger, MA</p>
                      </div>
                      <span className="badge badge-success">Active</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer px-6 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={handleSave} className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement..." : "Mettre à jour"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
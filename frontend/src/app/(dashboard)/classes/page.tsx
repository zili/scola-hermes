"use client";

import { useEffect, useState } from "react";
import { classes } from "@/lib/api";
import { Plus, Search, Edit, Trash2, X, Loader2, BookOpen, Users } from "lucide-react";

export default function ClassesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: "6e",
    capacity: 30,
    room_number: "",
    academic_year: "2025-2026",
  });
  const [submitting, setSubmitting] = useState(false);

  const levels = ["cp", "ce1", "ce2", "cm1", "cm2", "6e", "5e", "4e", "3e", "2nde", "1ere", "terminale"];

  useEffect(() => {
    loadClasses();
  }, [search, levelFilter]);

  async function loadClasses() {
    setLoading(true);
    try {
      const params: any = { page_size: 50 };
      if (search) params.search = search;
      if (levelFilter) params.level = levelFilter;
      
      const response = await classes.list(params);
      setData(response.items || []);
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await classes.create(formData);
      setShowModal(false);
      setFormData({
        name: "",
        level: "6e",
        capacity: 30,
        room_number: "",
        academic_year: "2025-2026",
      });
      loadClasses();
    } catch (error) {
      console.error("Failed to create class:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getLevelBadge = (level: string) => {
    const primary = ["cp", "ce1", "ce2", "cm1", "cm2"];
    const college = ["6e", "5e", "4e", "3e"];
    const lycee = ["2nde", "1ere", "terminale"];
    
    if (primary.includes(level)) return "bg-emerald-50 text-emerald-700";
    if (college.includes(level)) return "bg-blue-50 text-blue-700";
    return "bg-purple-50 text-purple-700";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500">Gérez les classes et niveaux</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nouvelle classe
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-full md:w-48"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">Tous les niveaux</option>
              {levels.map((level) => (
                <option key={level} value={level}>{level.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Aucune classe trouvée
          </div>
        ) : (
          data.map((cls) => (
            <div key={cls.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                    <span className={`badge ${getLevelBadge(cls.level)} mt-2`}>
                      {cls.level.toUpperCase()}
                    </span>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg">
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">Salle</span>
                    </div>
                    <span className="font-medium">{cls.room_number || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Effectif</span>
                    </div>
                    <span className="font-medium">{cls.student_count || 0} / {cls.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-sm">Professeur</span>
                    </div>
                    <span className="font-medium text-sm truncate">{cls.class_teacher || "—"}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((cls.student_count || 0) / cls.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">Nouvelle classe</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Nom de la classe *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ex: 6e Année A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Niveau *</label>
                    <select
                      className="input"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      {levels.map((level) => (
                        <option key={level} value={level}>{level.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Capacité</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Numéro de salle</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="ex: A101"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Année scolaire</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
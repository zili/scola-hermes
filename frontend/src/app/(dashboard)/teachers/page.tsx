"use client";

import { useEffect, useState } from "react";
import { teachers } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Eye, X, Loader2, UserCheck } from "lucide-react";

export default function TeachersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    cin: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "M",
    address: "",
    hire_date: "",
    specialization: "",
    salary: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, [search, statusFilter, page]);

  async function loadTeachers() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 12 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const response = await teachers.list(params);
      setData(response.items || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await teachers.create({
        ...formData,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
        hire_date: formData.hire_date ? new Date(formData.hire_date).toISOString() : null,
      });
      setShowModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        cin: "",
        email: "",
        phone: "",
        date_of_birth: "",
        gender: "M",
        address: "",
        hire_date: "",
        specialization: "",
        salary: 0,
      });
      loadTeachers();
    } catch (error) {
      console.error("Failed to create teacher:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "badge-success";
      case "inactive": return "badge-neutral";
      case "on_leave": return "badge-warning";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enseignants</h1>
          <p className="text-slate-500">Gérez les enseignants de l'établissement</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <UserCheck className="w-5 h-5" />
          Nouvel enseignant
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
                placeholder="Rechercher par nom ou CIN..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-full md:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="on_leave">En congé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Aucun enseignant trouvé
          </div>
        ) : (
          data.map((teacher) => (
            <div key={teacher.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xl font-bold">
                      {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {teacher.first_name} {teacher.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">{teacher.specialization}</p>
                    <span className={`badge ${getStatusBadge(teacher.status)} mt-2`}>
                      {teacher.status === "active" ? "Actif" : teacher.status === "on_leave" ? "En congé" : "Inactif"}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">CIN</span>
                    <span className="font-mono">{teacher.cin || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="truncate">{teacher.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Téléphone</span>
                    <span>{teacher.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Matières</span>
                    <span className="font-medium">{teacher.subjects_count || 0}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-secondary flex-1 py-2">
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button className="btn btn-ghost py-2 px-3">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary py-2"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </button>
            <button
              className="btn btn-secondary py-2"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">Nouvel enseignant</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Prénom *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Nom *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">CIN</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.cin}
                      onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Genre</label>
                    <select
                      className="input"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Spécialisation</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date d'embauche</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Salaire</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
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
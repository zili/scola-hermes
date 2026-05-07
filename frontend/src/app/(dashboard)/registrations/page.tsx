"use client";

import { useEffect, useState } from "react";
import { registrations, students, classes } from "@/lib/api";
import { Plus, Search, Check, X, Loader2, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default function RegistrationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [studentList, setStudentList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    academic_year: "2025-2026",
    amount: 1500,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = { page_size: 50 };
      if (statusFilter) params.status = statusFilter;
      
      const [regsResponse, studentsResponse, classesResponse] = await Promise.all([
        registrations.list(params),
        students.list({ page_size: 100, status: "active" }),
        classes.list({ page_size: 100 }),
      ]);
      
      setData(regsResponse.items || []);
      setStudentList(studentsResponse.items || []);
      setClassList(classesResponse.items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await registrations.approve(id);
      loadData();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  }

  async function handleReject(id: string) {
    try {
      await registrations.reject(id);
      loadData();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registrations.create(formData);
      setShowModal(false);
      setFormData({
        student_id: "",
        class_id: "",
        academic_year: "2025-2026",
        amount: 1500,
      });
      loadData();
    } catch (error) {
      console.error("Failed to create registration:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return "badge-success";
      case "pending": return "badge-warning";
      case "rejected": return "badge-danger";
      default: return "badge-neutral";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return "badge-success";
      case "partial": return "badge-warning";
      case "unpaid": return "badge-danger";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inscriptions</h1>
          <p className="text-slate-500">Gérez les inscriptions des étudiants</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nouvelle inscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="stat-value">{data.length}</div>
              <div className="stat-label">Total inscriptions</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="stat-value">{data.filter(d => d.status === "pending").length}</div>
              <div className="stat-label">En attente</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="stat-value">{data.filter(d => d.status === "approved").length}</div>
              <div className="stat-label">Approuvées</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="stat-value">{data.filter(d => d.status === "rejected").length}</div>
              <div className="stat-label">Rejetées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <select
            className="input w-full md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvée</option>
            <option value="rejected">Rejetée</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Classe</th>
                <th>Année</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Paiement</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Aucune inscription trouvée
                  </td>
                </tr>
              ) : (
                data.map((reg) => (
                  <tr key={reg.id}>
                    <td className="font-medium">{reg.student_name}</td>
                    <td>{reg.class_name}</td>
                    <td>{reg.academic_year}</td>
                    <td>{new Date(reg.registration_date).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(reg.status)}`}>
                        {reg.status === "approved" ? "Approuvé" : reg.status === "pending" ? "En attente" : "Rejeté"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPaymentBadge(reg.payment_status)}`}>
                        {reg.payment_status === "paid" ? "Payé" : reg.payment_status === "partial" ? "Partiel" : "Non payé"}
                      </span>
                    </td>
                    <td className="font-medium">{reg.amount ? `${reg.amount} DH` : "—"}</td>
                    <td>
                      {reg.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(reg.id)}
                            className="p-2 hover:bg-emerald-50 rounded-lg"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => handleReject(reg.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Rejeter"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">Nouvelle inscription</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Étudiant *</label>
                  <select
                    className="input"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un étudiant</option>
                    {studentList.map((s) => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Classe *</label>
                  <select
                    className="input"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une classe</option>
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Année scolaire</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Montant</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
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
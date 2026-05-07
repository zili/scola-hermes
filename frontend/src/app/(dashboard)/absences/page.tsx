"use client";

import { useEffect, useState } from "react";
import { absences, students, classes } from "@/lib/api";
import { Plus, Search, Loader2, Calendar, Check, X, AlertTriangle } from "lucide-react";

export default function AbsencesPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [justifiedFilter, setJustifiedFilter] = useState("");
  const [studentList, setStudentList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    date: new Date().toISOString().split("T")[0],
    start_period: 1,
    end_period: 1,
    justified: false,
    justification: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [justifiedFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = { page_size: 50 };
      if (justifiedFilter !== "") params.justified = justifiedFilter === "true";
      
      const [absencesResponse, statsResponse, studentsResponse, classesResponse] = await Promise.all([
        absences.list(params),
        absences.stats(),
        students.list({ page_size: 100 }),
        classes.list({ page_size: 100 }),
      ]);
      
      setData(absencesResponse.items || []);
      setStats(statsResponse);
      setStudentList(studentsResponse.items || []);
      setClassList(classesResponse.items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await absences.create({
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      setShowModal(false);
      setFormData({
        student_id: "",
        class_id: "",
        date: new Date().toISOString().split("T")[0],
        start_period: 1,
        end_period: 1,
        justified: false,
        justification: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create absence:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Absences</h1>
          <p className="text-slate-500">Gérez les absences des étudiants</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nouvelle absence
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.total || 0}</div>
              <div className="stat-label">Total absences</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.justified || 0}</div>
              <div className="stat-label">Justifiées</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.unjustified || 0}</div>
              <div className="stat-label">Non justifiées</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <span className="text-amber-600 text-xl font-bold">%</span>
            </div>
            <div>
              <div className="stat-value">{stats?.rate || 0}%</div>
              <div className="stat-label">Taux non justifiées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <select
            className="input w-full md:w-48"
            value={justifiedFilter}
            onChange={(e) => setJustifiedFilter(e.target.value)}
          >
            <option value="">Toutes les absences</option>
            <option value="true">Justifiées</option>
            <option value="false">Non justifiées</option>
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
                <th>Date</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Aucune absence trouvée
                  </td>
                </tr>
              ) : (
                data.map((absence) => (
                  <tr key={absence.id}>
                    <td className="font-medium">{absence.student_name}</td>
                    <td>{absence.class_name}</td>
                    <td>{new Date(absence.date).toLocaleDateString("fr-FR")}</td>
                    <td>{absence.start_period}{absence.end_period > absence.start_period ? ` - ${absence.end_period}` : ""}</td>
                    <td>
                      <span className={`badge ${absence.justified ? "badge-success" : "badge-danger"}`}>
                        {absence.justified ? "Justifiée" : "Non justifiée"}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">
                      {absence.justification || "—"}
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
              <h2 className="text-lg font-semibold">Nouvelle absence</h2>
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
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Période</label>
                    <div className="flex gap-2">
                      <select
                        className="input"
                        value={formData.start_period}
                        onChange={(e) => setFormData({ ...formData, start_period: parseInt(e.target.value) })}
                      >
                        {[1,2,3,4,5,6].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <span className="self-center text-slate-400">à</span>
                      <select
                        className="input"
                        value={formData.end_period}
                        onChange={(e) => setFormData({ ...formData, end_period: parseInt(e.target.value) })}
                      >
                        {[1,2,3,4,5,6].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="justified"
                    checked={formData.justified}
                    onChange={(e) => setFormData({ ...formData, justified: e.target.checked })}
                    className="w-4 h-4 text-primary"
                  />
                  <label htmlFor="justified" className="text-sm text-slate-700">Justifiée</label>
                </div>
                {formData.justified && (
                  <div>
                    <label className="label">Motif</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="ex: Maladie, raison familiale..."
                      value={formData.justification}
                      onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
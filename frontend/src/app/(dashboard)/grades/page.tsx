"use client";

import { useEffect, useState } from "react";
import { grades, students, subjects, classes } from "@/lib/api";
import { Plus, Search, Loader2, Award, FileText, Download, TrendingUp, User, X } from "lucide-react";

export default function GradesPage() {
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulletin, setShowBulletin] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [bulletinData, setBulletinData] = useState<any>(null);
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    subject_id: "",
    exam_type: "test",
    value: 0,
    coefficient: 1,
    period: "semester1",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [period, setPeriod] = useState("semester1");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [gradesResponse, statsResponse, studentsResponse, classesResponse, subjectsResponse] = await Promise.all([
        grades.list({ page_size: 50 }),
        grades.stats({ period }),
        students.list({ page_size: 100 }),
        classes.list({ page_size: 100 }),
        subjects.list({ page_size: 100 }),
      ]);
      
      setGradesData(gradesResponse.items || []);
      setStats(statsResponse);
      setStudentList(studentsResponse.items || []);
      setClassList(classesResponse.items || []);
      setSubjectList(subjectsResponse.items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBulletin(studentId: string) {
    try {
      const data = await grades.bulletin(studentId, period);
      setBulletinData(data);
    } catch (error) {
      console.error("Failed to load bulletin:", error);
    }
  }

  function openBulletin(student: any) {
    setSelectedStudent(student);
    loadBulletin(student.id);
    setShowBulletin(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grades.create({
        ...formData,
        date: new Date().toISOString(),
      });
      setShowModal(false);
      setFormData({
        student_id: "",
        class_id: "",
        subject_id: "",
        exam_type: "test",
        value: 0,
        coefficient: 1,
        period: "semester1",
        remarks: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create grade:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getGradeColor = (value: number) => {
    if (value >= 16) return "text-emerald-600 bg-emerald-50";
    if (value >= 12) return "text-blue-600 bg-blue-50";
    if (value >= 10) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeLabel = (type: string) => {
    switch (type) {
      case "test": return "Devoir";
      case "exam": return "Examen";
      case "project": return "Projet";
      case "participation": return "Participation";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes & Bulletins</h1>
          <p className="text-slate-500">Gérez les notes et consultez les bulletins</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nouvelle note
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.average || 0}/20</div>
              <div className="stat-label">Moyenne générale</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.highest || 0}/20</div>
              <div className="stat-label">Plus haute</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-red-600 rotate-180" />
            </div>
            <div>
              <div className="stat-value">{stats?.lowest || 0}/20</div>
              <div className="stat-label">Plus basse</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="stat-value">{stats?.count || 0}</div>
              <div className="stat-label">Notes enregistrées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access to bulletins */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900">Bulletins des élèves</h3>
          <select
            className="input w-40"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="semester1">Semestre 1</option>
            <option value="semester2">Semestre 2</option>
          </select>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {studentList.slice(0, 12).map((student) => (
              <button
                key={student.id}
                onClick={() => openBulletin(student)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-medium">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {student.first_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {student.class_name || "Non classé"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900">Notes récentes</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matière</th>
                <th>Type</th>
                <th>Note</th>
                <th>Coeff.</th>
                <th>Période</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : gradesData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Aucune note trouvée
                  </td>
                </tr>
              ) : (
                gradesData.map((grade) => (
                  <tr key={grade.id}>
                    <td className="font-medium">{grade.student_name}</td>
                    <td>{grade.subject}</td>
                    <td>
                      <span className="badge badge-info">{getGradeLabel(grade.exam_type)}</span>
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full font-semibold ${getGradeColor(grade.value)}`}>
                        {grade.value}/20
                      </span>
                    </td>
                    <td>{grade.coefficient}</td>
                    <td>{grade.period === "semester1" ? "S1" : "S2"}</td>
                    <td>{new Date(grade.date).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Grade Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">Nouvelle note</h2>
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
                <div>
                  <label className="label">Matière *</label>
                  <select
                    className="input"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjectList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type d'évaluation</label>
                    <select
                      className="input"
                      value={formData.exam_type}
                      onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                    >
                      <option value="test">Devoir</option>
                      <option value="exam">Examen</option>
                      <option value="project">Projet</option>
                      <option value="participation">Participation</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Période</label>
                    <select
                      className="input"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    >
                      <option value="semester1">Semestre 1</option>
                      <option value="semester2">Semestre 2</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Note *</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      className="input"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Coefficient</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="input"
                      value={formData.coefficient}
                      onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Remarques</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
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

      {/* Bulletin Modal */}
      {showBulletin && bulletinData && (
        <div className="modal-overlay" onClick={() => setShowBulletin(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-primary text-white">
              <div>
                <h2 className="text-lg font-semibold">Bulletin de notes</h2>
                <p className="text-sm text-white/80">{bulletinData.student?.first_name} {bulletinData.student?.last_name}</p>
              </div>
              <button onClick={() => setShowBulletin(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="modal-body">
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Classe</p>
                  <p className="font-semibold">{bulletinData.class}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Année scolaire</p>
                  <p className="font-semibold">{bulletinData.academic_year}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Période</p>
                  <p className="font-semibold">{bulletinData.period === "semester1" ? "Semestre 1" : "Semestre 2"}</p>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                {bulletinData.subjects?.map((subject: any, index: number) => (
                  <div key={index} className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{subject.name}</h4>
                      <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(subject.average)}`}>
                        {subject.average}/20
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Coefficient: {subject.coefficient} | Notes: {subject.grades?.length || 0}
                    </div>
                  </div>
                ))}
              </div>

              {/* Average */}
              <div className="mt-6 p-4 bg-primary text-white rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8" />
                  <div>
                    <p className="text-sm text-white/80">Moyenne générale</p>
                    <p className="text-2xl font-bold">{bulletinData.average}/20</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Rang</p>
                  <p className="text-xl font-bold">{bulletinData.rank} / {bulletinData.total_students}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
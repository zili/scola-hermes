"use client";

import { useEffect, useState } from "react";
import { dashboard } from "@/lib/api";
import { 
  Users, UserCheck, BookOpen, Calendar, Award, 
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle, XCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

interface KPIs {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  pending_registrations: number;
  absence_rate: number;
  average_grade: number;
}

interface ChartsData {
  absence_chart: { labels: string[]; data: number[] };
  grade_chart: { labels: string[]; data: number[] };
  recent_registrations: any[];
  recent_absences: any[];
  top_students: any[];
  alerts: any[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [kpisData, chartsData] = await Promise.all([
          dashboard.kpis(),
          dashboard.charts(),
        ]);
        setKpis(kpisData);
        setCharts(chartsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const absenceData = charts?.absence_chart?.labels?.map((label, i) => ({
    month: label,
    absences: charts.absence_chart.data[i],
  })) || [];

  const gradeData = charts?.grade_chart?.labels?.map((label, i) => ({
    class: label,
    average: charts.grade_chart.data[i],
  })) || [];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "danger": return <XCircle className="w-5 h-5 text-red-500" />;
      case "info": return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-value">{kpis?.total_students || 0}</div>
              <div className="stat-label">Étudiants</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-medium">+12%</span>
            <span className="text-slate-500 ml-1">ce mois</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-value">{kpis?.total_teachers || 0}</div>
              <div className="stat-label">Enseignants</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <span className="text-slate-500">Actifs cette année</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-value">{kpis?.total_classes || 0}</div>
              <div className="stat-label">Classes</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <span className="text-slate-500">6e à 3e année</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-value">{kpis?.average_grade || 0}/20</div>
              <div className="stat-label">Moyenne générale</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-medium">+0.5</span>
            <span className="text-slate-500 ml-1">ce semestre</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absence Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Absences par mois</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={absenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="absences" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Moyenne par classe</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="class" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#E07B2A" 
                  strokeWidth={3}
                  dot={{ fill: "#E07B2A", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Inscriptions récentes</h3>
            <Link href="./registrations" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {charts?.recent_registrations?.map((reg: any) => (
              <div key={reg.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{reg.student}</p>
                  <p className="text-sm text-slate-500">{reg.class}</p>
                </div>
                <span className={`badge ${reg.status === 'approved' ? 'badge-success' : reg.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                  {reg.status === 'approved' ? 'Approuvé' : reg.status === 'pending' ? 'En attente' : 'Rejeté'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Absences */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Absences récentes</h3>
            <Link href="./absences" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {charts?.recent_absences?.map((absence: any) => (
              <div key={absence.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{absence.student}</p>
                  <p className="text-sm text-slate-500">{new Date(absence.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`badge ${absence.justified ? 'badge-success' : 'badge-danger'}`}>
                  {absence.justified ? 'Justifiée' : 'Non justifiée'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Students */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900">Meilleurs élèves</h3>
            <Link href="./grades" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {charts?.top_students?.slice(0, 5).map((student: any, index: number) => (
              <div key={student.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-slate-100 text-slate-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.class}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{student.average}/20</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {charts?.alerts && charts.alerts.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="card-header bg-amber-100/50">
            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes
            </h3>
          </div>
          <div className="divide-y divide-amber-100">
            {charts.alerts.map((alert: any, index: number) => (
              <div key={index} className="px-6 py-4 flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div>
                  <p className="font-medium text-amber-900">{alert.title}</p>
                  <p className="text-sm text-amber-700">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
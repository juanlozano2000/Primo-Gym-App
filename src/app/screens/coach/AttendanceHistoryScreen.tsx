import { AppBar } from "../../components/AppBar";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardService } from "../../services/dashboardService";

interface AttendanceHistoryScreenProps {
  clientId: string;
  onBack: () => void;
}

export function AttendanceHistoryScreen({
  clientId,
  onBack,
}: AttendanceHistoryScreenProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await dashboardService.getClientAttendanceHistory(clientId);
      setData(result);
      setIsLoading(false);
    };
    fetchData();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Historial de asistencia" onBack={onBack} />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Historial de asistencia" onBack={onBack} />
        <div className="p-8 text-center text-gray-500">
          No hay datos de asistencia disponibles.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Historial de asistencia" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Nombre del cliente */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-[18px] font-bold">
              {data.clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold">{data.clientName}</h3>
            <p className="text-[13px] text-gray-600">
              Adherencia: <span className="font-semibold text-success">{data.adherence}%</span>
            </p>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-[11px] text-gray-600 mb-1">Total asistido</p>
            <p className="text-[22px] font-bold text-success">
              {data.totalDaysAttended}
            </p>
            <p className="text-[12px] text-gray-500">
              de {data.totalDaysScheduled}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-[11px] text-gray-600 mb-1">Promedio</p>
            <p className="text-[22px] font-bold text-primary">
              {data.adherence}%
            </p>
            <p className="text-[12px] text-gray-500">adherencia</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border text-center">
            <p className="text-[11px] text-gray-600 mb-1">Racha actual</p>
            <p className="text-[22px] font-bold text-accent">
              {data.currentStreak}
            </p>
            <p className="text-[12px] text-gray-500">días</p>
          </div>
        </div>

        {/* Info adicional */}
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
          <p className="text-[13px] text-gray-700">
            <span className="font-semibold text-primary">Racha más larga:</span>{" "}
            {data.longestStreak} días consecutivos
          </p>
        </div>

        {/* Info del plan */}
        <div className="bg-white rounded-xl p-3 border border-border">
          <p className="text-[13px] text-gray-700">
            <span className="font-semibold">{data.planName}</span> · {data.durationWeeks} semanas · {data.daysPerWeek} días/semana
          </p>
        </div>

        {/* Historial por semanas */}
        <div>
          <h3 className="mb-3">Historial semanal</h3>
          <div className="space-y-4">
            {data.weeks.map((weekData: any, weekIndex: number) => {
              const weekPercentage = weekData.daysPerWeek > 0
                ? Math.round((weekData.completedDays / weekData.daysPerWeek) * 100)
                : 0;
              
              return (
                <div key={weekIndex} className="bg-white rounded-2xl p-4 border border-border">
                  {/* Header de la semana */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[15px] font-semibold text-gray-900">{weekData.weekLabel}</p>
                      <p className="text-[12px] text-gray-600">{weekData.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] text-gray-600">
                        {weekData.completedDays}/{weekData.daysPerWeek} días
                      </p>
                      <p className={`text-[16px] font-bold ${
                        weekPercentage >= 80 ? "text-success" : 
                        weekPercentage >= 60 ? "text-warning" : "text-error"
                      }`}>
                        {weekPercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Calendario de la semana */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekData.days.map((dayData: any, dayIndex: number) => (
                      <div key={dayIndex} className="flex flex-col items-center gap-2">
                        <span className="text-[11px] text-gray-600 font-medium">{dayData.day}</span>
                        <div 
                          className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                            dayData.status === 'attended'
                              ? "bg-success text-white" 
                              : dayData.status === 'missed'
                              ? "bg-error text-white"
                              : dayData.status === 'future'
                              ? "bg-primary/10 text-primary/40"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {dayData.status === 'attended' && <CheckCircle className="w-4 h-4" />}
                          {dayData.status === 'missed' && <span className="text-[16px] font-bold">✕</span>}
                          {dayData.status === 'rest' && <span className="text-[12px]">-</span>}
                          {dayData.status === 'future' && <span className="text-[12px]">·</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

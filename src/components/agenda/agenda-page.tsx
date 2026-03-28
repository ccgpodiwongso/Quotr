'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/loading'
import { cn } from '@/lib/utils'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Video,
  User,
} from 'lucide-react'
import {
  AppointmentModal,
  type AppointmentWithClient,
  type AppointmentType,
} from './appointment-modal'
import type { Client } from '@/types/database'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = 'month' | 'week' | 'list'

const TYPE_COLORS: Record<AppointmentType, { dot: string; bg: string; text: string; badge: string }> = {
  meeting:  { dot: 'bg-blue-500',  bg: 'bg-blue-50 border-blue-200',  text: 'text-blue-700',  badge: 'info' },
  call:     { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'success' },
  deadline: { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'warning' },
  followup: { dot: 'bg-red-500',   bg: 'bg-red-50 border-red-200',   text: 'text-red-700',   badge: 'danger' },
  other:    { dot: 'bg-zinc-400',  bg: 'bg-zinc-50 border-zinc-200',  text: 'text-zinc-600',  badge: 'default' },
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  meeting: 'Vergadering',
  call: 'Belafspraak',
  deadline: 'Deadline',
  followup: 'Follow-up',
  other: 'Overig',
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20
const DAY_NAMES_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgendaPageClientProps {
  initialAppointments: AppointmentWithClient[]
  clients: Pick<Client, 'id' | 'name' | 'email'>[]
  quotes: { id: string; quote_number: string; title: string }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgendaPageClient({
  initialAppointments,
  clients,
  quotes,
}: AgendaPageClientProps) {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>(initialAppointments)
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithClient | null>(null)
  const [loading, setLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAppointments = useCallback(async (start: string, end: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      const data = await res.json()
      if (res.ok) {
        setAppointments(data.appointments ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let start: string
    let end: string

    if (view === 'month') {
      const ms = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const me = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      start = format(ms, "yyyy-MM-dd'T'00:00:00")
      end = format(me, "yyyy-MM-dd'T'23:59:59")
    } else if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      start = format(ws, "yyyy-MM-dd'T'00:00:00")
      end = format(we, "yyyy-MM-dd'T'23:59:59")
    } else {
      // list: show current month range
      start = format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00")
      end = format(endOfMonth(currentDate), "yyyy-MM-dd'T'23:59:59")
    }

    fetchAppointments(start, end)
  }, [currentDate, view, fetchAppointments])

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const navigateBack = () => {
    if (view === 'week') setCurrentDate((d) => subWeeks(d, 1))
    else setCurrentDate((d) => subMonths(d, 1))
  }

  const navigateForward = () => {
    if (view === 'week') setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addMonths(d, 1))
  }

  const navigateToday = () => setCurrentDate(new Date())

  const getNavLabel = () => {
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(ws, 'd MMM', { locale: nl })} - ${format(we, 'd MMM yyyy', { locale: nl })}`
    }
    return format(currentDate, 'MMMM yyyy', { locale: nl })
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const appointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.start_time), day))

  const openCreate = (day?: Date) => {
    setEditingAppointment(null)
    setSelectedDay(day ?? null)
    setModalOpen(true)
  }

  const openEdit = (a: AppointmentWithClient) => {
    setEditingAppointment(a)
    setSelectedDay(null)
    setModalOpen(true)
  }

  const handleSaved = (saved: AppointmentWithClient) => {
    setAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })
  }

  const handleDeleted = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  // ---------------------------------------------------------------------------
  // Render: Month View
  // ---------------------------------------------------------------------------

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 border-t border-l border-zinc-200">
          {days.map((day) => {
            const dayAppts = appointmentsForDay(day)
            const inMonth = isSameMonth(day, currentDate)
            const today = isToday(day)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                onDoubleClick={() => openCreate(day)}
                className={cn(
                  'relative min-h-[80px] sm:min-h-[100px] border-r border-b border-zinc-200 p-1.5 text-left transition-colors hover:bg-zinc-50',
                  !inMonth && 'bg-zinc-50/50',
                  isSelected && 'bg-blue-50/50 ring-1 ring-inset ring-blue-300'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    today && 'bg-blue-600 text-white',
                    !today && inMonth && 'text-zinc-900',
                    !today && !inMonth && 'text-zinc-400'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {/* Appointment dots */}
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayAppts.slice(0, 4).map((a) => {
                    const t = getAppointmentType(a)
                    return (
                      <span
                        key={a.id}
                        className={cn('h-1.5 w-1.5 rounded-full', TYPE_COLORS[t].dot)}
                        title={a.title}
                      />
                    )
                  })}
                  {dayAppts.length > 4 && (
                    <span className="text-[10px] text-zinc-400">+{dayAppts.length - 4}</span>
                  )}
                </div>

                {/* Small labels on larger screens */}
                <div className="hidden sm:block mt-0.5 space-y-0.5">
                  {dayAppts.slice(0, 3).map((a) => {
                    const t = getAppointmentType(a)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(a)
                        }}
                        className={cn(
                          'block w-full truncate rounded px-1 py-0.5 text-[11px] font-medium text-left border',
                          TYPE_COLORS[t].bg,
                          TYPE_COLORS[t].text
                        )}
                      >
                        {format(parseISO(a.start_time), 'HH:mm')} {a.title}
                      </button>
                    )
                  })}
                  {dayAppts.length > 3 && (
                    <span className="text-[10px] text-zinc-400 pl-1">
                      +{dayAppts.length - 3} meer
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                {format(selectedDay, 'EEEE d MMMM yyyy', { locale: nl })}
              </h3>
              <Button size="sm" onClick={() => openCreate(selectedDay)}>
                <Plus className="h-3.5 w-3.5" />
                Toevoegen
              </Button>
            </div>
            {appointmentsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-zinc-500">Geen afspraken op deze dag.</p>
            ) : (
              <div className="space-y-2">
                {appointmentsForDay(selectedDay).map((a) => (
                  <AppointmentListItem
                    key={a.id}
                    appointment={a}
                    onClick={() => openEdit(a)}
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Week View
  // ---------------------------------------------------------------------------

  const renderWeekView = () => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
    const we = endOfWeek(currentDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: ws, end: we })

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header row with day names */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-200">
            <div className="p-2" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-2 text-center text-xs font-medium border-l border-zinc-200',
                  isToday(day) ? 'text-blue-600 bg-blue-50' : 'text-zinc-600'
                )}
              >
                <div>{format(day, 'EEE', { locale: nl })}</div>
                <div
                  className={cn(
                    'mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold',
                    isToday(day) && 'bg-blue-600 text-white'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-100"
                style={{ height: 60 }}
              >
                <div className="text-[11px] text-zinc-400 pr-2 text-right pt-0.5">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border-l border-zinc-100 relative cursor-pointer hover:bg-zinc-50/50"
                    onClick={() => {
                      const clickDate = new Date(day)
                      clickDate.setHours(hour, 0, 0, 0)
                      openCreate(clickDate)
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Appointment blocks overlay */}
            {days.map((day, dayIdx) => {
              const dayAppts = appointmentsForDay(day)
              return dayAppts.map((a) => {
                const t = getAppointmentType(a)
                const start = parseISO(a.start_time)
                const end = parseISO(a.end_time)
                const startHour = start.getHours() + start.getMinutes() / 60
                const endHour = end.getHours() + end.getMinutes() / 60
                const top = Math.max(0, (startHour - 8) * 60)
                const height = Math.max(20, (endHour - startHour) * 60)

                // Calculate left position: 60px gutter + dayIdx * (1/7 of remaining)
                const colWidth = `calc((100% - 60px) / 7)`
                const left = `calc(60px + ${dayIdx} * ${colWidth} + 2px)`
                const width = `calc(${colWidth} - 4px)`

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(a)
                    }}
                    className={cn(
                      'absolute rounded px-1.5 py-0.5 text-[11px] font-medium overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity',
                      TYPE_COLORS[t].bg,
                      TYPE_COLORS[t].text
                    )}
                    style={{
                      top,
                      left,
                      width,
                      height: Math.min(height, (20 - 8) * 60 - top),
                    }}
                    title={`${a.title} (${format(start, 'HH:mm')} - ${format(end, 'HH:mm')})`}
                  >
                    <div className="truncate">{a.title}</div>
                    <div className="truncate opacity-75">
                      {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                    </div>
                  </button>
                )
              })
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: List View
  // ---------------------------------------------------------------------------

  const renderListView = () => {
    // Group appointments by day
    const grouped: Record<string, AppointmentWithClient[]> = {}
    for (const a of appointments) {
      const dayKey = format(parseISO(a.start_time), 'yyyy-MM-dd')
      if (!grouped[dayKey]) grouped[dayKey] = []
      grouped[dayKey].push(a)
    }
    const sortedDays = Object.keys(grouped).sort()

    if (sortedDays.length === 0) {
      return (
        <EmptyState
          icon={CalendarDays}
          title="Geen afspraken"
          description="Er zijn geen afspraken in deze periode."
          actionLabel="Nieuwe afspraak"
          onAction={() => openCreate()}
        />
      )
    }

    return (
      <div className="space-y-6">
        {sortedDays.map((dayKey) => {
          const day = parseISO(dayKey)
          const dayAppts = grouped[dayKey]
          return (
            <div key={dayKey}>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {format(day, 'EEEE d MMMM', { locale: nl })}
              </h3>
              <div className="space-y-2">
                {dayAppts.map((a) => (
                  <AppointmentListItem
                    key={a.id}
                    appointment={a}
                    onClick={() => openEdit(a)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Agenda"
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4" />
            Nieuwe afspraak
          </Button>
        }
      />

      {/* View tabs & navigation */}
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* View tabs */}
          <div className="flex rounded-md border border-zinc-200 overflow-hidden">
            {([
              { key: 'month' as const, label: 'Maand' },
              { key: 'week' as const, label: 'Week' },
              { key: 'list' as const, label: 'Lijst' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  view === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" iconOnly onClick={navigateBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={navigateToday}
              className="text-sm font-medium text-zinc-900 hover:text-blue-600 transition-colors min-w-[160px] text-center"
            >
              {getNavLabel()}
            </button>
            <Button variant="secondary" size="sm" iconOnly onClick={navigateForward}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'list' && renderListView()}
          </>
        )}
      </Card>

      {/* Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingAppointment(null)
        }}
        appointment={editingAppointment}
        clients={clients}
        quotes={quotes}
        selectedDate={selectedDay}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared sub-component: list item
// ---------------------------------------------------------------------------

function AppointmentListItem({
  appointment,
  onClick,
}: {
  appointment: AppointmentWithClient
  onClick: () => void
}) {
  const t = getAppointmentType(appointment)
  const colors = TYPE_COLORS[t]
  const start = parseISO(appointment.start_time)
  const end = parseISO(appointment.end_time)
  const meetingUrl = appointment.metadata?.meeting_url as string | undefined

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:shadow-sm',
        colors.bg
      )}
    >
      <div className={cn('mt-0.5 h-2.5 w-2.5 rounded-full shrink-0', colors.dot)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 truncate">
            {appointment.title}
          </span>
          <Badge variant={colors.badge as 'info' | 'success' | 'warning' | 'danger' | 'default'}>
            {TYPE_LABELS[t]}
          </Badge>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
          </span>

          {appointment.clients?.name && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {appointment.clients.name}
            </span>
          )}

          {appointment.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {appointment.location}
            </span>
          )}

          {meetingUrl && (
            <span className="inline-flex items-center gap-1">
              <Video className="h-3 w-3" />
              Online
            </span>
          )}
        </div>

        {appointment.description && (
          <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
            {appointment.description}
          </p>
        )}
      </div>
    </button>
  )
}

function getAppointmentType(a: AppointmentWithClient): AppointmentType {
  return (a.metadata?.type as AppointmentType) ?? 'other'
}

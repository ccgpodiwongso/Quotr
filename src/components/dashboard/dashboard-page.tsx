'use client'

import Link from 'next/link'
import {
  FileText,
  Receipt,
  Calendar,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardData, RecentEvent, UpcomingAppointment } from '@/app/app/page'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} uur geleden`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  return formatDate(dateStr)
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
  }
}

const eventTypeConfig: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  created: { label: 'aangemaakt', icon: FileText, color: 'text-zinc-500' },
  sent: { label: 'verstuurd', icon: ArrowRight, color: 'text-blue-500' },
  viewed: { label: 'bekeken', icon: Clock, color: 'text-amber-500' },
  accepted: { label: 'geaccepteerd', icon: CheckCircle, color: 'text-green-500' },
  rejected: { label: 'afgewezen', icon: AlertCircle, color: 'text-red-500' },
  updated: { label: 'bijgewerkt', icon: FileText, color: 'text-zinc-500' },
}

const appointmentTypeVariant: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  consultation: 'info',
  meeting: 'success',
  site_visit: 'warning',
  follow_up: 'default',
}

function getAppointmentTypeLabel(status: string): string {
  const labels: Record<string, string> = {
    consultation: 'Consult',
    meeting: 'Vergadering',
    site_visit: 'Locatiebezoek',
    follow_up: 'Opvolging',
    scheduled: 'Gepland',
    confirmed: 'Bevestigd',
    cancelled: 'Geannuleerd',
  }
  return labels[status] ?? status
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: typeof TrendingUp
  iconBgColor: string
  iconColor: string
}

function StatCard({ label, value, subtitle, icon: Icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold font-mono text-zinc-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Activity Item
// ---------------------------------------------------------------------------

function ActivityItem({ event }: { event: RecentEvent }) {
  const config = eventTypeConfig[event.event_type] ?? eventTypeConfig.updated
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5">
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-700">
          <span className="font-medium">Offerte {event.quote.quote_number}</span>{' '}
          {config.label}
        </p>
        {event.description && (
          <p className="mt-0.5 text-xs text-zinc-400 truncate">{event.description}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-zinc-400 whitespace-nowrap">
        {relativeTime(event.created_at)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appointment Item
// ---------------------------------------------------------------------------

function AppointmentItem({ appointment }: { appointment: UpcomingAppointment }) {
  const { date, time } = formatDateTime(appointment.start_time)
  const variant = appointmentTypeVariant[appointment.status] ?? 'default'

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex flex-col items-center text-center shrink-0 w-14">
        <span className="text-xs font-medium text-zinc-500">{date}</span>
        <span className="text-sm font-mono font-semibold text-zinc-900">{time}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-700 truncate">{appointment.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={variant}>
            {getAppointmentTypeLabel(appointment.status)}
          </Badge>
          {appointment.client?.name && (
            <span className="text-xs text-zinc-400 truncate">{appointment.client.name}</span>
          )}
          {!appointment.client?.name && appointment.client_name && (
            <span className="text-xs text-zinc-400 truncate">{appointment.client_name}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Client
// ---------------------------------------------------------------------------

export function DashboardClient({ data }: { data: DashboardData }) {
  const today = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welkom terug, {data.userName}!
        </h1>
        <p className="mt-1 text-sm text-zinc-500 capitalize">{today}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Omzet deze maand"
          value={formatCurrency(data.revenueThisMonth)}
          icon={TrendingUp}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Offertes verstuurd"
          value={String(data.quotesSentThisMonth)}
          icon={FileText}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Acceptatiegraad"
          value={`${data.acceptanceRate}%`}
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Openstaande facturen"
          value={formatCurrency(data.outstandingTotal)}
          subtitle={`${data.outstandingCount} ${data.outstandingCount === 1 ? 'factuur' : 'facturen'}`}
          icon={AlertCircle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Recent activity */}
        <Card
          title="Recente activiteit"
          footer={
            <Link
              href="/app/quotes"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Bekijk alle offertes
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              Nog geen activiteit
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.recentActivity.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <Card
            title="Aankomende afspraken"
            footer={
              <Link
                href="/app/agenda"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Bekijk agenda
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            {data.upcomingAppointments.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Geen aankomende afspraken
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {data.upcomingAppointments.map((apt) => (
                  <AppointmentItem key={apt.id} appointment={apt} />
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card title="Snelle acties">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/app/quotes/new">
                <Button variant="secondary" className="w-full justify-start">
                  <Plus className="h-4 w-4" />
                  Nieuwe offerte
                </Button>
              </Link>
              <Link href="/app/invoices/new">
                <Button variant="secondary" className="w-full justify-start">
                  <Receipt className="h-4 w-4" />
                  Nieuwe factuur
                </Button>
              </Link>
              <Link href="/app/agenda">
                <Button variant="secondary" className="w-full justify-start">
                  <Calendar className="h-4 w-4" />
                  Plan afspraak
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

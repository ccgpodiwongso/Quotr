'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import type { Appointment, Client } from '@/types/database'

export type AppointmentType = 'meeting' | 'call' | 'deadline' | 'followup' | 'other'

export interface AppointmentWithClient extends Appointment {
  clients: Pick<Client, 'id' | 'name' | 'email'> | null
}

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: AppointmentWithClient | null
  clients: Pick<Client, 'id' | 'name' | 'email'>[]
  quotes: { id: string; quote_number: string; title: string }[]
  selectedDate?: Date | null
  onSaved: (appointment: AppointmentWithClient) => void
  onDeleted?: (id: string) => void
}

const TYPE_OPTIONS: { value: AppointmentType; label: string }[] = [
  { value: 'meeting', label: 'Vergadering' },
  { value: 'call', label: 'Belafspraak' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'other', label: 'Overig' },
]

export function AppointmentModal({
  open,
  onClose,
  appointment,
  clients,
  quotes,
  selectedDate,
  onSaved,
  onDeleted,
}: AppointmentModalProps) {
  const isEditing = !!appointment

  const getInitialDate = () => {
    if (appointment) return format(new Date(appointment.start_time), 'yyyy-MM-dd')
    if (selectedDate) return format(selectedDate, 'yyyy-MM-dd')
    return format(new Date(), 'yyyy-MM-dd')
  }

  const getInitialStartTime = () => {
    if (appointment) return format(new Date(appointment.start_time), 'HH:mm')
    return '09:00'
  }

  const getInitialEndTime = () => {
    if (appointment) return format(new Date(appointment.end_time), 'HH:mm')
    return '10:00'
  }

  const [title, setTitle] = useState(appointment?.title ?? '')
  const [type, setType] = useState<AppointmentType>(
    (appointment?.metadata?.type as AppointmentType) ?? 'meeting'
  )
  const [date, setDate] = useState(getInitialDate())
  const [startTime, setStartTime] = useState(getInitialStartTime())
  const [endTime, setEndTime] = useState(getInitialEndTime())
  const [clientId, setClientId] = useState(appointment?.client_id ?? '')
  const [quoteId, setQuoteId] = useState(appointment?.quote_id ?? '')
  const [location, setLocation] = useState(appointment?.location ?? '')
  const [meetingUrl, setMeetingUrl] = useState(
    (appointment?.metadata?.meeting_url as string) ?? ''
  )
  const [description, setDescription] = useState(appointment?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Titel is verplicht.')
      return
    }
    if (!date || !startTime || !endTime) {
      setError('Datum en tijden zijn verplicht.')
      return
    }

    setSaving(true)
    setError('')

    const startDateTime = `${date}T${startTime}:00`
    const endDateTime = `${date}T${endTime}:00`

    const payload = {
      title: title.trim(),
      type,
      start_time: startDateTime,
      end_time: endDateTime,
      client_id: clientId || null,
      quote_id: quoteId || null,
      location: location.trim() || null,
      meeting_url: meetingUrl.trim() || null,
      description: description.trim() || null,
    }

    try {
      const url = isEditing
        ? `/api/appointments/${appointment.id}`
        : '/api/appointments'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er is een fout opgetreden.')
        return
      }

      onSaved(data.appointment)
      onClose()
    } catch {
      setError('Er is een onverwachte fout opgetreden.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !onDeleted) return
    if (!confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) return

    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Verwijderen mislukt.')
        return
      }

      onDeleted(appointment.id)
      onClose()
    } catch {
      setError('Er is een onverwachte fout opgetreden.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {isEditing && onDeleted && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" />
                Verwijderen
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving || deleting}>
              Annuleren
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={deleting}>
              {isEditing ? 'Opslaan' : 'Aanmaken'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Input
          label="Titel *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bijv. Intake gesprek"
        />

        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as AppointmentType)}
          options={TYPE_OPTIONS}
        />

        <Input
          label="Datum *"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Starttijd *"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="Eindtijd *"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <Select
          label="Klant"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">-- Geen klant --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          label="Gerelateerde offerte"
          value={quoteId}
          onChange={(e) => setQuoteId(e.target.value)}
        >
          <option value="">-- Geen offerte --</option>
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.quote_number} - {q.title}
            </option>
          ))}
        </Select>

        <Input
          label="Locatie"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Bijv. Kantoor Amsterdam"
        />

        <Input
          label="Meeting URL"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="https://meet.google.com/..."
        />

        <Textarea
          label="Omschrijving"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Eventuele notities..."
          rows={3}
        />
      </div>
    </Modal>
  )
}

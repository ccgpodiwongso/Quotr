'use client'

import { useState, useEffect, useCallback } from 'react'
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
  isBefore,
  startOfDay,
  getDay,
  isToday,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/loading'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import type { Company } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeSlot {
  start: string
  end: string
}

interface BookingPageClientProps {
  company: Pick<Company, 'id' | 'name' | 'slug' | 'email' | 'logo_url'>
  availableDays: number[] // day_of_week numbers that have slots
  slug: string
}

type Step = 'date' | 'time' | 'form' | 'success'

const DAY_NAMES_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingPageClient({ company, availableDays, slug }: BookingPageClientProps) {
  const [step, setStep] = useState<Step>('date')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bookedSlot, setBookedSlot] = useState<TimeSlot | null>(null)
  const [bookedDate, setBookedDate] = useState<Date | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch slots for selected date
  // ---------------------------------------------------------------------------

  const fetchSlots = useCallback(
    async (date: Date) => {
      setLoadingSlots(true)
      setSlots([])
      setSelectedSlot(null)
      setError('')

      try {
        const dateStr = format(date, 'yyyy-MM-dd')
        const res = await fetch(`/api/bookings/${slug}/slots?date=${dateStr}`)
        const data = await res.json()

        if (res.ok) {
          // Filter out past slots if the date is today
          const now = new Date()
          const availableSlots = (data.available_slots ?? []).filter((s: TimeSlot) => {
            if (!isToday(date)) return true
            return new Date(s.start) > now
          })
          setSlots(availableSlots)
        } else {
          setError(data.error || 'Kon tijdsloten niet laden.')
        }
      } catch {
        setError('Er is een onverwachte fout opgetreden.')
      } finally {
        setLoadingSlots(false)
      }
    },
    [slug]
  )

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, fetchSlots])

  // ---------------------------------------------------------------------------
  // Calendar helpers
  // ---------------------------------------------------------------------------

  const isDayAvailable = (day: Date) => {
    const dayOfWeek = getDay(day) // 0=Sun, 6=Sat
    return availableDays.includes(dayOfWeek)
  }

  const isDayDisabled = (day: Date) => {
    const today = startOfDay(new Date())
    if (isBefore(day, today)) return true
    return !isDayAvailable(day)
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleDateSelect = (day: Date) => {
    if (isDayDisabled(day)) return
    setSelectedDate(day)
    setStep('time')
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('form')
  }

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Naam en e-mailadres zijn verplicht.')
      return
    }
    if (!selectedSlot) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/bookings/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          note: note.trim() || null,
          start: selectedSlot.start,
          end: selectedSlot.end,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Boeking mislukt.')
        if (res.status === 409) {
          // Slot taken, go back to time selection
          setStep('time')
          if (selectedDate) fetchSlots(selectedDate)
        }
        return
      }

      setBookedSlot(selectedSlot)
      setBookedDate(selectedDate)
      setStep('success')
    } catch {
      setError('Er is een onverwachte fout opgetreden.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Calendar
  // ---------------------------------------------------------------------------

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calStart, end: calEnd })
    const today = startOfDay(new Date())

    return (
      <div>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            disabled={isSameMonth(currentMonth, new Date())}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth)
            const disabled = isDayDisabled(day)
            const selected = selectedDate ? isSameDay(day, selectedDate) : false
            const today_ = isToday(day)

            if (!inMonth) {
              return <div key={day.toISOString()} className="h-10" />
            }

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateSelect(day)}
                disabled={disabled}
                className={cn(
                  'h-10 rounded-lg text-sm font-medium transition-all',
                  disabled && 'text-zinc-300 cursor-not-allowed',
                  !disabled && !selected && 'text-zinc-900 hover:bg-blue-50 hover:text-blue-700',
                  selected && 'bg-blue-600 text-white shadow-sm',
                  today_ && !selected && !disabled && 'ring-1 ring-blue-600'
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Time slots
  // ---------------------------------------------------------------------------

  const renderTimeSlots = () => {
    if (loadingSlots) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )
    }

    if (slots.length === 0) {
      return (
        <div className="text-center py-8">
          <Clock className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
          <p className="text-sm text-zinc-500">Geen beschikbare tijden op deze dag.</p>
          <button
            type="button"
            onClick={() => setStep('date')}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Kies een andere datum
          </button>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setStep('date')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            &larr; Terug
          </button>
          <span className="text-sm text-zinc-500">|</span>
          <span className="text-sm font-medium text-zinc-900 capitalize">
            {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: nl })}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.start === slot.start
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => handleSlotSelect(slot)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-zinc-900 border-zinc-200 hover:border-blue-300 hover:bg-blue-50'
                )}
              >
                {format(new Date(slot.start), 'HH:mm')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Form
  // ---------------------------------------------------------------------------

  const renderForm = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStep('time')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          &larr; Terug
        </button>
        <span className="text-sm text-zinc-500">|</span>
        <span className="text-sm font-medium text-zinc-900">
          {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: nl })},{' '}
          {selectedSlot && format(new Date(selectedSlot.start), 'HH:mm')} -{' '}
          {selectedSlot && format(new Date(selectedSlot.end), 'HH:mm')}
        </span>
      </div>

      <div className="space-y-4">
        <Input
          label="Naam *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Je volledige naam"
        />
        <Input
          label="E-mailadres *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="je@email.nl"
        />
        <Textarea
          label="Opmerking (optioneel)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Laat ons weten waar de afspraak over gaat..."
          rows={3}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
        >
          Bevestigen
        </Button>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Render: Success
  // ---------------------------------------------------------------------------

  const renderSuccess = () => (
    <div className="text-center py-6">
      <div className="flex items-center justify-center mb-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-2">
        Je afspraak is bevestigd!
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        We hebben een bevestiging gestuurd naar je e-mailadres.
      </p>

      {bookedDate && bookedSlot && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 inline-block text-left mx-auto">
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-zinc-900 capitalize">
                {format(bookedDate, 'EEEE d MMMM yyyy', { locale: nl })}
              </p>
              <p className="text-zinc-500">
                {format(new Date(bookedSlot.start), 'HH:mm')} -{' '}
                {format(new Date(bookedSlot.end), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f5f5f6] flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-md">
          {/* Company header */}
          <div className="text-center mb-6">
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt={company.name}
                className="mx-auto h-12 w-12 rounded-lg object-cover mb-3"
              />
            )}
            <h1 className="text-lg font-semibold text-zinc-900">{company.name}</h1>
          </div>

          {/* Card */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 sm:p-6">
            {step !== 'success' && (
              <h2 className="text-base font-semibold text-zinc-900 mb-5">
                Boek een afspraak
              </h2>
            )}

            {/* Step indicators */}
            {step !== 'success' && (
              <div className="flex items-center gap-2 mb-5">
                {(['date', 'time', 'form'] as const).map((s, i) => {
                  const stepLabels = ['Datum', 'Tijd', 'Gegevens']
                  const stepIdx = ['date', 'time', 'form'].indexOf(step)
                  const isActive = s === step
                  const isDone = i < stepIdx

                  return (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium shrink-0',
                          isActive && 'bg-blue-600 text-white',
                          isDone && 'bg-blue-100 text-blue-700',
                          !isActive && !isDone && 'bg-zinc-100 text-zinc-400'
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium hidden sm:inline',
                          isActive && 'text-zinc-900',
                          !isActive && 'text-zinc-400'
                        )}
                      >
                        {stepLabels[i]}
                      </span>
                      {i < 2 && (
                        <div
                          className={cn(
                            'flex-1 h-px',
                            isDone ? 'bg-blue-300' : 'bg-zinc-200'
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {step === 'date' && renderCalendar()}
            {step === 'time' && renderTimeSlots()}
            {step === 'form' && renderForm()}
            {step === 'success' && renderSuccess()}
          </div>

          {/* Powered by footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-zinc-400">
              Powered by{' '}
              <a
                href="https://quotr.nl?utm_source=booking_page&utm_medium=referral&utm_campaign=powered_by"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-500 hover:text-blue-600 transition-colors"
              >
                Quotr
              </a>
              {' '}&mdash;{' '}
              <a
                href="https://quotr.nl?utm_source=booking_page&utm_medium=referral&utm_campaign=free_trial"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Gratis proberen
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

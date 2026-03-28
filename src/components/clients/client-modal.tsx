'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Client } from '@/types/database'

interface ClientModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  client?: Client | null
}

export function ClientModal({ open, onClose, onSaved, client }: ClientModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!client

  useEffect(() => {
    if (client) {
      setName(client.name)
      setEmail(client.email || '')
      setPhone(client.phone || '')
      setContactPerson(client.contact_person || '')
      setAddressLine1(client.address_line1 || '')
      setPostalCode(client.postal_code || '')
      setCity(client.city || '')
      setNotes(client.notes || '')
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setContactPerson('')
      setAddressLine1('')
      setPostalCode('')
      setCity('')
      setNotes('')
    }
    setError('')
  }, [client, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Naam is verplicht.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        contact_person: contactPerson.trim(),
        address_line1: addressLine1.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        notes: notes.trim(),
      }

      const url = isEditing ? `/api/clients/${client.id}` : '/api/clients'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan.')
        return
      }

      onSaved()
    } catch {
      setError('Er is een onverwachte fout opgetreden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Klant bewerken' : 'Nieuwe klant'}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Opslaan' : 'Toevoegen'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Naam / Bedrijfsnaam *"
          placeholder="Bijv. Acme B.V."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Contactpersoon"
          placeholder="Bijv. Jan de Vries"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="info@voorbeeld.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Telefoon"
            type="tel"
            placeholder="+31 6 12345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Adres"
          placeholder="Straat en huisnummer"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Postcode"
            placeholder="1234 AB"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
          <Input
            label="Stad"
            placeholder="Amsterdam"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <Textarea
          label="Notities"
          placeholder="Interne notities over deze klant..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  )
}

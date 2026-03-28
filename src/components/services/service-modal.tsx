"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { Service } from "@/types/database";

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service?: Service | null;
}

export function ServiceModal({ open, onClose, onSaved, service }: ServiceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unit, setUnit] = useState("fixed");
  const [taxRate, setTaxRate] = useState("21");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || "");
      setUnitPrice(String(service.unit_price));
      setUnit(service.unit);
      setTaxRate(String(service.tax_rate));
    } else {
      setName("");
      setDescription("");
      setUnitPrice("");
      setUnit("fixed");
      setTaxRate("21");
    }
    setError("");
  }, [service, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Naam is verplicht.");
      return;
    }

    if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      setError("Voer een geldige prijs in.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        unit_price: Number(unitPrice),
        unit,
        tax_rate: Number(taxRate),
      };

      const url = isEditing ? `/api/services/${service.id}` : "/api/services";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Er is iets misgegaan.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Dienst bewerken" : "Nieuwe dienst"}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditing ? "Opslaan" : "Toevoegen"}
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
          label="Naam *"
          placeholder="Bijv. Websiteontwerp"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Beschrijving"
          placeholder="Beschrijving van de dienst..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prijs *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />

          <Select
            label="Prijstype"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: "fixed", label: "Vast bedrag" },
              { value: "hourly", label: "Per uur" },
            ]}
          />
        </div>

        <Select
          label="BTW-tarief"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          options={[
            { value: "21", label: "21% (standaard)" },
            { value: "9", label: "9% (laag)" },
            { value: "0", label: "0% (vrijgesteld)" },
          ]}
        />
      </form>
    </Modal>
  );
}

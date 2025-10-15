// app/fm/requests/new/AddVehicleButton.tsx
'use client'

import { useState } from 'react'

type Props = {
  onCreated: (v: { id: string; label: string }) => void
  fmcOptions: string[] // pass the enum labels you support e.g. ['Other','Holman','Element',...]
}

export default function AddVehicleButton({ onCreated, fmcOptions }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [year, setYear] = useState<number | ''>('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [vin, setVin] = useState('')
  const [unit, setUnit] = useState('')
  const [plate, setPlate] = useState('')
  const [fmc, setFmc] = useState('Other')

  async function handleSave() {
    if (!vin && !unit) {
      alert('Please provide at least a VIN or a Unit Number.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: year === '' ? null : Number(year),
          make: make || null,
          model: model || null,
          vin: vin || null,
          unit_number: unit || null,
          plate: plate || null,
          fmc, // must match enum label (e.g. 'Other')
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to create vehicle')
      }
      onCreated(json.vehicle) // { id, label }
      setOpen(false)
      // reset minimal fields
      setVin('')
      setUnit('')
    } catch (e: any) {
      alert(e?.message ?? 'Failed to create vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="text-sm px-2 py-1 border rounded"
        onClick={() => setOpen(true)}
      >
        + Add new vehicle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Add Vehicle</h3>
              <button onClick={() => setOpen(false)} className="text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col text-sm">
                Year
                <input
                  className="border rounded px-2 py-1"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col text-sm">
                Make
                <input className="border rounded px-2 py-1" value={make} onChange={(e) => setMake(e.target.value)} />
              </label>
              <label className="flex flex-col text-sm">
                Model
                <input className="border rounded px-2 py-1" value={model} onChange={(e) => setModel(e.target.value)} />
              </label>
              <label className="flex flex-col text-sm">
                Plate
                <input className="border rounded px-2 py-1" value={plate} onChange={(e) => setPlate(e.target.value)} />
              </label>
              <label className="flex flex-col text-sm col-span-2">
                VIN
                <input className="border rounded px-2 py-1" value={vin} onChange={(e) => setVin(e.target.value)} />
              </label>
              <label className="flex flex-col text-sm col-span-2">
                Unit #
                <input className="border rounded px-2 py-1" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </label>
              <label className="flex flex-col text-sm col-span-2">
                FMC
                <select
                  className="border rounded px-2 py-1"
                  value={fmc}
                  onChange={(e) => setFmc(e.target.value)}
                >
                  {fmcOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="px-3 py-1 border rounded" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

"use client";

function Row({ label, value }: { label: string; value: any }) {
  const v = value ?? null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm font-mono text-gray-900 text-right">
        {v ? String(v) : "—"}
      </div>
    </div>
  );
}

export default function LifecycleModal({
  open,
  loading,
  lifecycle,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  lifecycle: any | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <div className="text-lg font-black text-gray-900">Lifecycle</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Read-only
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-bold"
          >
            Close
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-sm text-gray-500 animate-pulse">
              Loading lifecycle…
            </div>
          ) : !lifecycle ? (
            <div className="text-sm text-gray-500">No lifecycle data.</div>
          ) : (
            <div className="space-y-2">
              <Row label="Status" value={lifecycle.status} />
              <Row label="Created" value={lifecycle.created_at} />
              <Row label="Scheduled Start" value={lifecycle.scheduled_start_at} />
              <Row label="Started" value={lifecycle.started_at} />
              <Row label="Waiting for Parts" value={lifecycle.waiting_for_parts_at} />
              <Row
                label="Waiting for Approval"
                value={lifecycle.waiting_for_approval_at}
              />
              <Row label="Completed" value={lifecycle.completed_at} />
              <Row label="Completed By" value={lifecycle.completed_by_role} />

              <div className="pt-4">
                <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Notes
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-gray-50 border">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Tech
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {lifecycle.technician_notes || "—"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Dispatch
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {lifecycle.dispatch_notes || "—"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Office
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {lifecycle.office_notes || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { FeeInvoice, FeePayment } from "@/types";
import { getStudentById } from "@/data";
import { useFees } from "@/hooks/useFees";
import { useDataTable } from "@/hooks/useDataTable";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/store/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { RecordPaymentForm } from "./Recordpaymentform";
import { DiscountForm, ReceiptView } from "./Discountform";

// =============================================================================
// FEES MODULE
// Staff: searchable/filterable invoice table, record payments, apply
// discounts/scholarships, view receipts. Students/Parents: read-only view of
// their own (or their child's) invoices with the same receipt view.
// =============================================================================

const STATUS_BADGE: Record<FeeInvoice["status"], "success" | "warning" | "error" | "info"> = {
  paid: "success",
  pending: "warning",
  overdue: "error",
  partial: "info",
};

type ModalState = { type: "pay"; invoice: FeeInvoice } | { type: "discount"; invoice: FeeInvoice } | { type: "receipt"; invoice: FeeInvoice } | null;

export function FeesModule() {
  const { session } = useAuth();
  const { invoices, isSaving, recordPayment, applyDiscount } = useFees();
  const toast = useToast();
  const [modal, setModal] = useState<ModalState>(null);

  if (!session) return null;
  const isStaff = session.user.role === "admin" || session.user.role === "principal";
  const studentId = session.user.linkedEntityId ?? session.user.id;

  const scopedInvoices = isStaff ? invoices : invoices.filter((i) => i.studentId === studentId);

  const table = useDataTable<FeeInvoice>({
    data: scopedInvoices,
    searchFields: ["invoiceNumber", "title"],
    initialSortField: "dueDate",
    pageSize: 10,
  });

  async function handleRecordPayment(amount: number, method: FeePayment["method"]) {
    if (modal?.type !== "pay") return;
    await recordPayment(modal.invoice.id, { amount, method });
    setModal(null);
    toast.success("Payment recorded", `${formatCurrency(amount)} logged for ${modal.invoice.invoiceNumber}.`);
  }

  async function handleApplyDiscount(discount: number, scholarshipAmount: number) {
    if (modal?.type !== "discount") return;
    await applyDiscount(modal.invoice.id, discount, scholarshipAmount);
    setModal(null);
    toast.success("Adjustment applied", `Discount/scholarship updated for ${modal.invoice.invoiceNumber}.`);
  }

  const totals = {
    collected: scopedInvoices.reduce((sum, i) => sum + i.amountPaid, 0),
    pending: scopedInvoices
      .filter((i) => i.status === "pending" || i.status === "partial")
      .reduce((sum, i) => sum + (i.amount - i.discount - i.scholarshipAmount - i.amountPaid), 0),
    overdue: scopedInvoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Fee Management</h2>
        <p className="text-sm text-slate-400 mt-0.5">{scopedInvoices.length} {isStaff ? "invoices across all students" : "invoices"}</p>
      </div>

      {isStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Total Collected" value={formatCurrency(totals.collected)} icon="dollarSign" accent="emerald" />
          <StatTile label="Pending Balance" value={formatCurrency(totals.pending)} icon="clock" accent="amber" />
          <StatTile label="Overdue Invoices" value={String(totals.overdue)} icon="alertCircle" accent="rose" />
        </div>
      )}

      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice number or title..."
              value={table.searchQuery}
              onChange={(e) => table.setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <Select
            value={table.filters.status ?? ""}
            onChange={(v) => table.setFilter("status", v)}
            placeholder="All statuses"
            options={[
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "overdue", label: "Overdue" },
              { value: "partial", label: "Partial" },
            ]}
            className="lg:w-40"
          />
          {(table.searchQuery || Object.values(table.filters).some(Boolean)) && (
            <Button variant="ghost" size="md" icon="x" onClick={table.clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                {isStaff && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.items.map((invoice) => {
                const student = getStudentById(invoice.studentId);
                const netPayable = invoice.amount - invoice.discount - invoice.scholarshipAmount;
                return (
                  <tr key={invoice.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{invoice.title}</p>
                    </td>
                    {isStaff && <td className="px-4 py-3 text-slate-300">{student ? `${student.firstName} ${student.lastName}` : "—"}</td>}
                    <td className="px-4 py-3 text-slate-300">
                      {formatCurrency(netPayable)}
                      {(invoice.discount > 0 || invoice.scholarshipAmount > 0) && <p className="text-[11px] text-emerald-400">Adjusted</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[invoice.status]}>{capitalize(invoice.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction icon="fileText" label="Receipt" onClick={() => setModal({ type: "receipt", invoice })} />
                        {isStaff && invoice.status !== "paid" && (
                          <RowAction icon="creditCard" label="Record payment" onClick={() => setModal({ type: "pay", invoice })} />
                        )}
                        {isStaff && <RowAction icon="edit" label="Discount" onClick={() => setModal({ type: "discount", invoice })} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {table.items.length === 0 && (
                <tr>
                  <td colSpan={isStaff ? 6 : 5} className="px-4 py-16 text-center">
                    <Icon name="creditCard" size={28} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No invoices match your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} pageSize={10} onPageChange={table.setPage} />
        </div>
      </Card>

      <Modal open={modal?.type === "pay"} onClose={() => setModal(null)} title="Record Payment" size="md">
        {modal?.type === "pay" && (
          <RecordPaymentForm invoice={modal.invoice} onSubmit={handleRecordPayment} onCancel={() => setModal(null)} submitting={isSaving} />
        )}
      </Modal>

      <Modal open={modal?.type === "discount"} onClose={() => setModal(null)} title="Discount & Scholarship" size="md">
        {modal?.type === "discount" && (
          <DiscountForm invoice={modal.invoice} onSubmit={handleApplyDiscount} onCancel={() => setModal(null)} submitting={isSaving} />
        )}
      </Modal>

      <Modal
        open={modal?.type === "receipt"}
        onClose={() => setModal(null)}
        title="Receipt"
        size="md"
        footer={
          <Button variant="secondary" icon="printer" onClick={() => window.print()}>
            Print
          </Button>
        }
      >
        {modal?.type === "receipt" && <ReceiptView invoice={modal.invoice} />}
      </Modal>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: "dollarSign" | "clock" | "alertCircle";
  accent: "emerald" | "amber" | "rose";
}) {
  const styles = { emerald: "text-emerald-300 bg-emerald-500/15", amber: "text-amber-300 bg-amber-500/15", rose: "text-rose-300 bg-rose-500/15" }[accent];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <p className="text-lg font-semibold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function RowAction({ icon, label, onClick }: { icon: "fileText" | "creditCard" | "edit"; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
    >
      <Icon name={icon} size={14} />
    </button>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
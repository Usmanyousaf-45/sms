"use client";

import { useState } from "react";
import type { FeeInvoice } from "@/types";
import { getStudentById } from "@/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

// =============================================================================
// DISCOUNT FORM
// =============================================================================

interface DiscountFormProps {
  invoice: FeeInvoice;
  onSubmit: (discount: number, scholarshipAmount: number) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function DiscountForm({ invoice, onSubmit, onCancel, submitting }: DiscountFormProps) {
  const [discount, setDiscount] = useState(String(invoice.discount));
  const [scholarshipAmount, setScholarshipAmount] = useState(String(invoice.scholarshipAmount));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(Number(discount) || 0, Number(scholarshipAmount) || 0);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">Original invoice amount: {formatCurrency(invoice.amount)}</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Discount (PKR)" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <Input label="Scholarship (PKR)" type="number" min={0} value={scholarshipAmount} onChange={(e) => setScholarshipAmount(e.target.value)} />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Net payable after adjustments</span>
          <span className="text-white font-semibold">
            {formatCurrency(Math.max(0, invoice.amount - (Number(discount) || 0) - (Number(scholarshipAmount) || 0)))}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Apply adjustment
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// RECEIPT VIEW
// =============================================================================

export function ReceiptView({ invoice }: { invoice: FeeInvoice }) {
  const student = getStudentById(invoice.studentId);
  const netPayable = invoice.amount - invoice.discount - invoice.scholarshipAmount;

  return (
    <div className="space-y-5">
      <div className="text-center pb-4 border-b border-white/[0.07]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3">
          <Icon name="graduationCap" size={22} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-white">Brightfield School</p>
        <p className="text-xs text-slate-500">Official Fee Receipt</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Invoice</span>
        <span className="text-white font-medium">{invoice.invoiceNumber}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Student</span>
        <span className="text-white font-medium">{student ? `${student.firstName} ${student.lastName}` : "—"}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Student ID</span>
        <span className="text-white">{student?.studentCode ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Fee Title</span>
        <span className="text-white">{invoice.title}</span>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-2">
        <RowLine label="Original amount" value={formatCurrency(invoice.amount)} />
        {invoice.discount > 0 && <RowLine label="Discount" value={`- ${formatCurrency(invoice.discount)}`} />}
        {invoice.scholarshipAmount > 0 && <RowLine label="Scholarship" value={`- ${formatCurrency(invoice.scholarshipAmount)}`} />}
        <RowLine label="Net payable" value={formatCurrency(netPayable)} bold />
        <RowLine label="Amount paid" value={formatCurrency(invoice.amountPaid)} />
        <RowLine label="Balance" value={formatCurrency(Math.max(0, netPayable - invoice.amountPaid))} bold />
      </div>

      {invoice.paymentHistory.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment History</p>
          <div className="space-y-2">
            {invoice.paymentHistory.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                <div>
                  <p className="text-slate-300">{p.receiptNumber}</p>
                  <p className="text-slate-500">{formatDate(p.paidOn)} · {capitalize(p.method.replace("-", " "))}</p>
                </div>
                <span className="text-white font-medium">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RowLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={bold ? "text-white font-semibold" : "text-slate-300"}>{value}</span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
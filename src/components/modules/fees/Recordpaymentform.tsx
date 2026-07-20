"use client";

import { useState } from "react";
import type { FeeInvoice, FeePayment } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// RECORD PAYMENT FORM
// =============================================================================

interface RecordPaymentFormProps {
  invoice: FeeInvoice;
  onSubmit: (amount: number, method: FeePayment["method"]) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const METHODS: { value: FeePayment["method"]; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "online", label: "Online" },
];

export function RecordPaymentForm({ invoice, onSubmit, onCancel, submitting }: RecordPaymentFormProps) {
  const netPayable = invoice.amount - invoice.discount - invoice.scholarshipAmount;
  const remaining = netPayable - invoice.amountPaid;

  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState<FeePayment["method"]>("cash");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (num > remaining) {
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }
    setError("");
    await onSubmit(num, method);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Net payable</span>
          <span className="text-white font-medium">{formatCurrency(netPayable)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Already paid</span>
          <span className="text-white font-medium">{formatCurrency(invoice.amountPaid)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-1.5 border-t border-white/[0.06]">
          <span className="text-slate-400">Remaining balance</span>
          <span className="text-emerald-300 font-semibold">{formatCurrency(remaining)}</span>
        </div>
      </div>
      <Input label="Payment amount" type="number" min={1} max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} error={error} />
      <Select label="Payment method" value={method} onChange={(v) => setMethod(v as FeePayment["method"])} options={METHODS} />
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Record payment
        </Button>
      </div>
    </form>
  );
}
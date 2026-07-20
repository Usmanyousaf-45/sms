"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeeInvoice, FeePayment, FeeStatus } from "@/types";
import { FEE_INVOICES as INITIAL_INVOICES } from "@/data";
import { generateId, sleep } from "@/lib/utils";
import { loadFromStorage, saveToStorage } from "@/lib/persistence";

const STORAGE_KEY = "fee_invoices";

// =============================================================================
// useFees
// Invoices own a nested paymentHistory (same nested-collection pattern used
// throughout). Recording a payment recomputes amountPaid and status
// automatically — status is always derived from amounts, never set directly,
// so it can't drift out of sync with the payment history.
// =============================================================================

export interface RecordPaymentInput {
  amount: number;
  method: FeePayment["method"];
}

function computeStatus(invoice: FeeInvoice): FeeStatus {
  const netPayable = invoice.amount - invoice.discount - invoice.scholarshipAmount;
  if (invoice.amountPaid >= netPayable) return "paid";
  if (invoice.amountPaid > 0) return "partial";
  const isOverdue = new Date(invoice.dueDate) < new Date("2026-07-19");
  return isOverdue ? "overdue" : "pending";
}

export function useFees() {
  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => loadFromStorage<FeeInvoice[]>(STORAGE_KEY, INITIAL_INVOICES));
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInvoices(loadFromStorage<FeeInvoice[]>(STORAGE_KEY, INITIAL_INVOICES));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY, invoices);
  }, [invoices, hydrated]);

  const recordPayment = useCallback(async (invoiceId: string, input: RecordPaymentInput): Promise<FeePayment> => {
    setIsSaving(true);
    await sleep(500);
    const receiptNumber = `RCPT-${Math.floor(20000 + Math.random() * 9999)}`;
    const payment: FeePayment = {
      id: generateId("pay"),
      invoiceId,
      amount: input.amount,
      paidOn: new Date().toISOString(),
      method: input.method,
      receiptNumber,
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated: FeeInvoice = {
          ...inv,
          amountPaid: inv.amountPaid + input.amount,
          paymentHistory: [payment, ...inv.paymentHistory],
        };
        return { ...updated, status: computeStatus(updated) };
      })
    );
    setIsSaving(false);
    return payment;
  }, []);

  const applyDiscount = useCallback(async (invoiceId: string, discount: number, scholarshipAmount: number): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated = { ...inv, discount, scholarshipAmount };
        return { ...updated, status: computeStatus(updated) };
      })
    );
    setIsSaving(false);
  }, []);

  const createInvoice = useCallback(
    async (params: { studentId: string; title: string; amount: number; dueDate: string }): Promise<FeeInvoice> => {
      setIsSaving(true);
      await sleep(450);
      const id = generateId("inv");
      const newInvoice: FeeInvoice = {
        id,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 8999)}`,
        studentId: params.studentId,
        title: params.title,
        amount: params.amount,
        discount: 0,
        scholarshipAmount: 0,
        amountPaid: 0,
        dueDate: params.dueDate,
        status: "pending",
        issuedDate: new Date().toISOString().slice(0, 10),
        paymentHistory: [],
      };
      setInvoices((prev) => [newInvoice, ...prev]);
      setIsSaving(false);
      return newInvoice;
    },
    []
  );

  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    await sleep(400);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    setIsSaving(false);
  }, []);

  return { invoices, isSaving, recordPayment, applyDiscount, createInvoice, deleteInvoice };
}
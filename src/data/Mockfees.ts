import type { FeeInvoice, FeeStatus, FeePayment } from "@/types";
import { STUDENTS } from "./mockCore";
import { makeRng, pick, randomInt, isoDate, isoDateTime, daysAgoDateOnly, daysFromNowDateOnly } from "./seedHelpers";
import { generateId } from "@/lib/utils";

// =============================================================================
// MOCK DATA — Fee Invoices
// One "Term 1 Tuition Fee" invoice per active student, with a realistic mix
// of paid/pending/overdue/partial states and payment history for the paid
// ones, so the Fee Management module has real data to filter/search/report on.
// =============================================================================

const rng = makeRng(707);

const FEE_TITLES = ["Term 1 Tuition Fee", "Admission Fee", "Examination Fee", "Transport Fee"];
const PAYMENT_METHODS: FeePayment["method"][] = ["cash", "card", "bank-transfer", "online"];

function buildInvoiceForStudent(studentId: string, index: number): FeeInvoice {
  const id = `inv_${index + 1}`;
  const amount = pick(rng, [45000, 52000, 60000, 38000, 75000]);
  const discount = rng() > 0.85 ? Math.round(amount * 0.1) : 0;
  const scholarshipAmount = rng() > 0.92 ? Math.round(amount * 0.25) : 0;
  const netPayable = amount - discount - scholarshipAmount;

  const status: FeeStatus = pick(rng, ["paid", "paid", "paid", "pending", "pending", "overdue", "partial"]);
  const dueDate = status === "overdue" ? daysAgoDateOnly(randomInt(rng, 5, 25), 2026, 7, 19) : daysFromNowDateOnly(randomInt(rng, 3, 30), 2026, 7, 19);

  let amountPaid = 0;
  const paymentHistory: FeePayment[] = [];

  if (status === "paid") {
    amountPaid = netPayable;
    paymentHistory.push({
      id: generateId("pay"),
      invoiceId: id,
      amount: netPayable,
      paidOn: isoDateTime(2026, randomInt(rng, 5, 7), randomInt(rng, 1, 28)),
      method: pick(rng, PAYMENT_METHODS),
      receiptNumber: `RCPT-${10000 + index}`,
    });
  } else if (status === "partial") {
    amountPaid = Math.round(netPayable * randomInt(rng, 30, 70) / 100);
    paymentHistory.push({
      id: generateId("pay"),
      invoiceId: id,
      amount: amountPaid,
      paidOn: isoDateTime(2026, 7, randomInt(rng, 1, 15)),
      method: pick(rng, PAYMENT_METHODS),
      receiptNumber: `RCPT-${10000 + index}`,
    });
  }

  return {
    id,
    invoiceNumber: `INV-2026-${String(index + 1).padStart(4, "0")}`,
    studentId,
    title: pick(rng, FEE_TITLES),
    amount,
    discount,
    scholarshipAmount,
    amountPaid,
    dueDate,
    status,
    issuedDate: isoDate(2026, 6, randomInt(rng, 1, 28)),
    paymentHistory,
  };
}

export const FEE_INVOICES: FeeInvoice[] = STUDENTS.filter((s) => s.status === "active")
  .slice(0, 400) // cap volume for a snappy demo table while keeping it substantial
  .map((student, i) => buildInvoiceForStudent(student.id, i));

export function getInvoiceById(id: string): FeeInvoice | undefined {
  return FEE_INVOICES.find((i) => i.id === id);
}

export function getInvoicesForStudent(studentId: string): FeeInvoice[] {
  return FEE_INVOICES.filter((i) => i.studentId === studentId);
}
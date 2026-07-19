"use client";

import { useState } from "react";
import type { Parent } from "@/types";
import type { ParentFormInput } from "@/hooks/useParents";
import { STUDENTS } from "@/data";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";

// =============================================================================
// PARENT FORM
// Shared by "Add Parent" and "Edit Parent" modals. Links to one or more
// students via the same MultiSelect chip picker used for teacher subjects.
// =============================================================================

interface ParentFormProps {
  initialValue?: Parent;
  onSubmit: (input: ParentFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export function ParentForm({ initialValue, onSubmit, onCancel, submitting }: ParentFormProps) {
  const [firstName, setFirstName] = useState(initialValue?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValue?.lastName ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [phone, setPhone] = useState(initialValue?.phone ?? "");
  const [addressLine1, setAddressLine1] = useState(initialValue?.address.line1 ?? "");
  const [city, setCity] = useState(initialValue?.address.city ?? "");
  const [occupation, setOccupation] = useState(initialValue?.occupation ?? "");
  const [childStudentIds, setChildStudentIds] = useState<string[]>(initialValue?.childStudentIds ?? []);
  const [childSearch, setChildSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const studentOptions = STUDENTS.filter(
    (s) =>
      !childSearch.trim() ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(childSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(childSearch.toLowerCase())
  ).slice(0, 30);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!email.trim() || !isValidEmail(email)) next.email = "Enter a valid email.";
    if (!phone.trim() || !isValidPhone(phone)) next.phone = "Enter a valid phone number.";
    if (childStudentIds.length === 0) next.childStudentIds = "Link at least one child.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      occupation: occupation.trim(),
      childStudentIds,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormSection title="Personal Information">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <Input label="Occupation (optional)" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
      </FormSection>

      <FormSection title="Linked Children">
        <Input
          icon="search"
          placeholder="Search students by name or ID to filter the list below..."
          value={childSearch}
          onChange={(e) => setChildSearch(e.target.value)}
        />
        <MultiSelect
          options={studentOptions.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.studentCode})` }))}
          selected={childStudentIds}
          onChange={setChildStudentIds}
          error={errors.childStudentIds}
        />
        {childStudentIds.length > 0 && (
          <p className="text-xs text-slate-500">{childStudentIds.length} {childStudentIds.length === 1 ? "child" : "children"} linked.</p>
        )}
      </FormSection>

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Add parent"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  );
}
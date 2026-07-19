"use client";

import { useState } from "react";
import type { Teacher } from "@/types";
import type { TeacherFormInput } from "@/hooks/UseTeachers";
import { SUBJECTS } from "@/data";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import { Input, Select } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";

// =============================================================================
// TEACHER FORM
// Shared by "Add Teacher" and "Edit Teacher" modals.
// =============================================================================

interface TeacherFormProps {
  initialValue?: Teacher;
  onSubmit: (input: TeacherFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const QUALIFICATIONS = ["M.Ed", "M.Phil", "M.Sc", "B.Ed", "MA Education", "Ph.D"];

export function TeacherForm({ initialValue, onSubmit, onCancel, submitting }: TeacherFormProps) {
  const [firstName, setFirstName] = useState(initialValue?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValue?.lastName ?? "");
  const [gender, setGender] = useState(initialValue?.gender ?? "male");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [phone, setPhone] = useState(initialValue?.phone ?? "");
  const [addressLine1, setAddressLine1] = useState(initialValue?.address.line1 ?? "");
  const [city, setCity] = useState(initialValue?.address.city ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(initialValue?.subjectIds ?? []);
  const [qualification, setQualification] = useState(initialValue?.qualification ?? QUALIFICATIONS[0]);
  const [experienceYears, setExperienceYears] = useState(String(initialValue?.experienceYears ?? 1));
  const [salary, setSalary] = useState(String(initialValue?.salary ?? 60000));
  const [employmentType, setEmploymentType] = useState(initialValue?.employmentType ?? "full-time");
  const [status, setStatus] = useState(initialValue?.status ?? "active");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!email.trim() || !isValidEmail(email)) next.email = "Enter a valid email.";
    if (!phone.trim() || !isValidPhone(phone)) next.phone = "Enter a valid phone number.";
    if (subjectIds.length === 0) next.subjectIds = "Select at least one subject.";
    if (Number(experienceYears) < 0) next.experienceYears = "Must be 0 or more.";
    if (Number(salary) <= 0) next.salary = "Enter a valid salary.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      email: email.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      subjectIds,
      qualification,
      experienceYears: Number(experienceYears),
      salary: Number(salary),
      employmentType,
      status,
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
          <Select
            label="Gender"
            value={gender}
            onChange={(v) => setGender(v as typeof gender)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input label="Phone" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        </div>
        <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Professional Details">
        <MultiSelect
          label="Subjects taught"
          options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))}
          selected={subjectIds}
          onChange={setSubjectIds}
          error={errors.subjectIds}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Qualification" value={qualification} onChange={setQualification} options={QUALIFICATIONS.map((q) => ({ value: q, label: q }))} />
          <Input
            label="Experience (years)"
            type="number"
            min={0}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            error={errors.experienceYears}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Employment type"
            value={employmentType}
            onChange={(v) => setEmploymentType(v as typeof employmentType)}
            options={[
              { value: "full-time", label: "Full-time" },
              { value: "part-time", label: "Part-time" },
              { value: "contract", label: "Contract" },
            ]}
          />
          <Input
            label="Monthly salary (PKR)"
            type="number"
            min={0}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            error={errors.salary}
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            { value: "active", label: "Active" },
            { value: "on-leave", label: "On Leave" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FormSection>

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Add teacher"}
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

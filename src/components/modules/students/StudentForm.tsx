"use client";

import { useState } from "react";
import type { Student } from "@/types";
import type { StudentFormInput } from "@/hooks/useStudents";
import { CLASSES, ALL_SECTIONS } from "@/data";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// =============================================================================
// STUDENT FORM
// Shared by "Add Student" and "Edit Student" modals. Validates client-side;
// the validation shape mirrors what a Zod schema would enforce server-side.
// =============================================================================

interface StudentFormProps {
  initialValue?: Student;
  onSubmit: (input: StudentFormInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const GUARDIAN_RELATIONS = ["Father", "Mother", "Guardian", "Grandfather", "Grandmother"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export function StudentForm({ initialValue, onSubmit, onCancel, submitting }: StudentFormProps) {
  const [firstName, setFirstName] = useState(initialValue?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValue?.lastName ?? "");
  const [gender, setGender] = useState(initialValue?.gender ?? "male");
  const [dob, setDob] = useState(initialValue?.dob ?? "");
  const [classId, setClassId] = useState(initialValue?.classId ?? CLASSES[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(initialValue?.sectionId ?? "");
  const [rollNumber, setRollNumber] = useState(initialValue?.rollNumber ?? "");
  const [guardianName, setGuardianName] = useState(initialValue?.guardianName ?? "");
  const [guardianRelation, setGuardianRelation] = useState(initialValue?.guardianRelation ?? "Father");
  const [phone, setPhone] = useState(initialValue?.phone ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [addressLine1, setAddressLine1] = useState(initialValue?.address.line1 ?? "");
  const [city, setCity] = useState(initialValue?.address.city ?? "");
  const [status, setStatus] = useState(initialValue?.status ?? "active");
  const [bloodGroup, setBloodGroup] = useState(initialValue?.bloodGroup ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSections = ALL_SECTIONS.filter((s) => s.classId === classId);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!dob) next.dob = "Date of birth is required.";
    if (!sectionId) next.sectionId = "Select a section.";
    if (!rollNumber.trim()) next.rollNumber = "Roll number is required.";
    if (!guardianName.trim()) next.guardianName = "Guardian name is required.";
    if (!email.trim() || !isValidEmail(email)) next.email = "Enter a valid email.";
    if (!phone.trim() || !isValidPhone(phone)) next.phone = "Enter a valid phone number.";
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
      dob,
      classId,
      sectionId,
      rollNumber: rollNumber.trim(),
      guardianName: guardianName.trim(),
      guardianRelation,
      phone: phone.trim(),
      email: email.trim(),
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      status,
      bloodGroup: bloodGroup || undefined,
    });
  }

  return (
    <form id="student-form" onSubmit={handleSubmit} className="space-y-5">
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
          <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} error={errors.dob} />
        </div>
        <Select
          label="Blood group"
          value={bloodGroup}
          onChange={setBloodGroup}
          placeholder="Select blood group"
          options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
        />
      </FormSection>

      <FormSection title="Academic Details">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Class"
            value={classId}
            onChange={(v) => {
              setClassId(v);
              setSectionId("");
            }}
            options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Section"
            value={sectionId}
            onChange={setSectionId}
            placeholder="Select section"
            options={availableSections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
            error={errors.sectionId}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} error={errors.rollNumber} />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "graduated", label: "Graduated" },
              { value: "suspended", label: "Suspended" },
              { value: "transferred", label: "Transferred" },
            ]}
          />
        </div>
      </FormSection>

      <FormSection title="Guardian & Contact">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Guardian name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} error={errors.guardianName} />
          <Select
            label="Relation"
            value={guardianRelation}
            onChange={setGuardianRelation}
            options={GUARDIAN_RELATIONS.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initialValue ? "Save changes" : "Add student"}
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
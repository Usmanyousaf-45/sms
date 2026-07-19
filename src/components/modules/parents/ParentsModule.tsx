"use client";

import { useState } from "react";
import type { Parent } from "@/types";
import { getStudentById } from "@/data";
import { useParents } from "@/hooks/useParents";
import { useDataTable } from "@/hooks/useDataTable";
import { useToast } from "@/store/ToastContext";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { ParentForm } from "./ParentForm";
import { ParentProfile } from "./ParentProfile";
import type { ParentFormInput } from "@/hooks/useParents";

// =============================================================================
// PARENTS MODULE
// Same CRUD pattern as Students/Teachers: search, sortable columns,
// pagination, add/edit modal, profile view, delete confirmation. Filter set
// is intentionally smaller than Students/Teachers — parents don't have a
// class/status axis, so the toolbar is just search + clear.
// =============================================================================

type ModalState =
  | { type: "add" }
  | { type: "edit"; parent: Parent }
  | { type: "view"; parent: Parent }
  | { type: "delete"; parent: Parent }
  | null;

export function ParentsModule() {
  const { parents, isSaving, createParent, updateParent, deleteParent } = useParents();
  const toast = useToast();
  const [modal, setModal] = useState<ModalState>(null);

  const table = useDataTable<Parent>({
    data: parents,
    searchFields: ["firstName", "lastName", "email", "phone"],
    initialSortField: "firstName",
    pageSize: 8,
  });

  async function handleCreate(input: ParentFormInput) {
    await createParent(input);
    setModal(null);
    toast.success("Parent added", `${input.firstName} ${input.lastName} has been registered.`);
  }

  async function handleUpdate(id: string, input: ParentFormInput) {
    await updateParent(id, input);
    setModal(null);
    toast.success("Changes saved", `${input.firstName} ${input.lastName}'s profile was updated.`);
  }

  async function handleDelete(parent: Parent) {
    await deleteParent(parent.id);
    setModal(null);
    toast.success("Parent removed", `${parent.firstName} ${parent.lastName} has been removed.`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Parents</h2>
          <p className="text-sm text-slate-400 mt-0.5">{parents.length} registered parent accounts</p>
        </div>
        <Button icon="userPlus" onClick={() => setModal({ type: "add" })}>
          Add Parent
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={table.searchQuery}
              onChange={(e) => table.setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/[0.07] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          {table.searchQuery && (
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
                <SortableHeader label="Parent" field="firstName" table={table} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Children</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupation</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.items.map((parent) => {
                const children = parent.childStudentIds.map((id) => getStudentById(id)).filter(Boolean);
                return (
                  <tr key={parent.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <button onClick={() => setModal({ type: "view", parent })} className="flex items-center gap-3 text-left">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${parent.avatarColor} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                          {parent.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                            {parent.firstName} {parent.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{parent.email}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{parent.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {children.slice(0, 2).map((c) => (
                          <Badge key={c!.id} variant="indigo">
                            {c!.firstName}
                          </Badge>
                        ))}
                        {children.length > 2 && <Badge variant="neutral">+{children.length - 2}</Badge>}
                        {children.length === 0 && <span className="text-xs text-slate-600">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{parent.occupation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction icon="eye" label="View" onClick={() => setModal({ type: "view", parent })} />
                        <RowAction icon="edit" label="Edit" onClick={() => setModal({ type: "edit", parent })} />
                        <RowAction icon="trash" label="Delete" onClick={() => setModal({ type: "delete", parent })} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {table.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Icon name="userGroup" size={28} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No parents match your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} pageSize={8} onPageChange={table.setPage} />
        </div>
      </Card>

      <Modal open={modal?.type === "add"} onClose={() => setModal(null)} title="Add Parent" description="Register a new parent/guardian account." size="lg">
        <ParentForm onSubmit={handleCreate} onCancel={() => setModal(null)} submitting={isSaving} />
      </Modal>

      <Modal
        open={modal?.type === "edit"}
        onClose={() => setModal(null)}
        title="Edit Parent"
        description={modal?.type === "edit" ? `Updating ${modal.parent.firstName} ${modal.parent.lastName}` : undefined}
        size="lg"
      >
        {modal?.type === "edit" && (
          <ParentForm
            initialValue={modal.parent}
            onSubmit={(input) => handleUpdate(modal.parent.id, input)}
            onCancel={() => setModal(null)}
            submitting={isSaving}
          />
        )}
      </Modal>

      <Modal
        open={modal?.type === "view"}
        onClose={() => setModal(null)}
        title="Parent Profile"
        size="lg"
        footer={
          modal?.type === "view" ? (
            <Button icon="edit" onClick={() => setModal({ type: "edit", parent: modal.parent })}>
              Edit Profile
            </Button>
          ) : undefined
        }
      >
        {modal?.type === "view" && <ParentProfile parent={modal.parent} />}
      </Modal>

      <ConfirmDialog
        open={modal?.type === "delete"}
        onClose={() => setModal(null)}
        onConfirm={() => modal?.type === "delete" && handleDelete(modal.parent)}
        title="Remove parent?"
        description={
          modal?.type === "delete"
            ? `This will permanently remove ${modal.parent.firstName} ${modal.parent.lastName} from the system. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove parent"
        loading={isSaving}
      />
    </div>
  );
}

function SortableHeader({
  label,
  field,
  table,
}: {
  label: string;
  field: keyof Parent;
  table: ReturnType<typeof useDataTable<Parent>>;
}) {
  const active = table.sortField === field;
  return (
    <th className="text-left px-4 py-3">
      <button
        onClick={() => table.toggleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        {label}
        <Icon
          name={active && table.sortDirection === "desc" ? "chevronDown" : "chevronUp"}
          size={12}
          className={active ? "text-indigo-400" : "text-slate-700"}
        />
      </button>
    </th>
  );
}

function RowAction({ icon, label, onClick, danger }: { icon: "eye" | "edit" | "trash"; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
        danger ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10"
      }`}
    >
      <Icon name={icon} size={14} />
    </button>
  );
}
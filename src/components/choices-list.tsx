'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateId, type Choice } from '@/lib/wheel-types';

type Props = {
  choices: Choice[];
  onChange: (choices: Choice[]) => void;
  removedCount: number;
};

const BONE = '#E4E0D6';
const MUTED = '#5A5E66';
const ORANGE = '#FF5C1F';
const INK = '#0A0B0E';

function SortableRow({
  choice,
  index,
  onUpdate,
  onRemove,
}: {
  choice: Choice;
  index: number;
  onUpdate: (next: Choice) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: choice.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(choice.label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? ORANGE : undefined,
    color: isDragging ? INK : undefined,
  };

  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 border-b py-2 transition-colors"
      // border color set via style for the rgba
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab font-mono text-xs tabular-nums active:cursor-grabbing"
        style={{ color: isDragging ? INK : MUTED }}
        aria-label="Drag to reorder"
      >
        {num}
      </button>

      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onUpdate({ ...choice, label: draft.trim() || choice.label });
              setEditing(false);
            } else if (e.key === 'Escape') {
              setDraft(choice.label);
              setEditing(false);
            }
          }}
          onBlur={() => {
            onUpdate({ ...choice, label: draft.trim() || choice.label });
            setEditing(false);
          }}
          className="h-6 flex-1 border-none bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
          style={{ color: isDragging ? INK : BONE }}
        />
      ) : (
        <button
          type="button"
          onClick={() => { setDraft(choice.label); setEditing(true); }}
          className="flex-1 truncate text-left font-mono text-sm transition-colors"
          style={{ color: isDragging ? INK : BONE }}
          onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.color = ORANGE; }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.color = BONE; }}
        >
          {choice.label || `Choice ${index + 1}`}
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: MUTED }}
        onMouseEnter={(e) => { e.currentTarget.style.color = ORANGE; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function ChoicesList({ choices, onChange, removedCount }: Props) {
  const [newLabel, setNewLabel] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function addChoice() {
    const label = newLabel.trim();
    if (!label) return;
    const next: Choice = { id: generateId(), label };
    onChange([...choices, next]);
    setNewLabel('');
  }

  function updateChoice(id: string, next: Choice) {
    onChange(choices.map((c) => (c.id === id ? next : c)));
  }

  function removeChoice(id: string) {
    onChange(choices.filter((c) => c.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = choices.findIndex((c) => c.id === active.id);
    const newIndex = choices.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(choices, oldIndex, newIndex));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header — terminal style with count + removed counter */}
      <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(228, 224, 214, 0.1)' }}>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: MUTED }}>
          <span style={{ color: ORANGE }}>+</span>
          OPTIONS.LIST
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] tabular-nums" style={{ color: MUTED }}>
          <span>{String(choices.length).padStart(2, '0')} active</span>
          {removedCount > 0 && (
            <span style={{ color: ORANGE }}>{String(removedCount).padStart(2, '0')} removed</span>
          )}
        </div>
      </div>

      {/* Add field */}
      <div className="mb-3 flex items-center gap-2 border-b pb-2" style={{ borderColor: 'rgba(228, 224, 214, 0.1)' }}>
        <span className="font-mono text-xs" style={{ color: MUTED }}>›</span>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="add option..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') addChoice();
          }}
          className="h-6 flex-1 border-none bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
          style={{ color: BONE }}
        />
        {newLabel.trim() && (
          <button
            onClick={addChoice}
            className="font-mono text-xs uppercase tracking-wider hover:underline"
            style={{ color: ORANGE }}
          >
            +add
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1">
        {choices.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs" style={{ color: MUTED }}>
            <div>{'// empty'}</div>
            <div className="mt-1">{'// add at least 2 options'}</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={choices.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div>
                {choices.map((c, i) => (
                  <SortableRow
                    key={c.id}
                    choice={c}
                    index={i}
                    onUpdate={(next) => updateChoice(c.id, next)}
                    onRemove={() => removeChoice(c.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

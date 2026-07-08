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
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateId, type Choice } from '@/lib/wheel-types';

type Props = {
  choices: Choice[];
  onChange: (choices: Choice[]) => void;
};

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
  };

  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 border-b border-[#0A0A0A]/10 py-2.5 transition-colors',
        isDragging && 'bg-[#0A0A0A] text-[#F2EEE5]'
      )}
    >
      {/* Drag handle — just the index, becomes a cursor on hover */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab font-mono text-xs text-[#0A0A0A]/40 tabular-nums active:cursor-grabbing"
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
          className="h-7 flex-1 border-none bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => { setDraft(choice.label); setEditing(true); }}
          className="flex-1 truncate text-left font-mono text-sm text-[#0A0A0A] hover:text-[#E63329]"
        >
          {choice.label || `Choice ${index + 1}`}
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="text-[#0A0A0A]/30 opacity-0 transition-opacity hover:text-[#E63329] group-hover:opacity-100"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ChoicesList({ choices, onChange }: Props) {
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
      <div className="mb-4 flex items-baseline justify-between border-b border-[#0A0A0A] pb-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]">
          Choices
        </h2>
        <span className="font-mono text-xs tabular-nums text-[#0A0A0A]/50">
          {String(choices.length).padStart(2, '0')}
        </span>
      </div>

      {/* Add field — minimal, monospace */}
      <div className="mb-4 flex items-center gap-2 border-b border-[#0A0A0A]/10 pb-2">
        <span className="font-mono text-xs text-[#0A0A0A]/30">+</span>
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add a choice…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addChoice();
          }}
          className="h-6 flex-1 border-none bg-transparent p-0 font-mono text-sm shadow-none placeholder:text-[#0A0A0A]/30 focus-visible:ring-0"
        />
        {newLabel.trim() && (
          <button
            onClick={addChoice}
            className="font-mono text-xs uppercase tracking-wider text-[#E63329] hover:underline"
          >
            Add
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {choices.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs text-[#0A0A0A]/40">
            Empty. Add at least two.
          </p>
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

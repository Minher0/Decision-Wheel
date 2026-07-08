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
import { GripVertical, Trash2, Plus, X, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateId, randomColor, type Choice } from '@/lib/wheel-types';

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10',
        isDragging && 'shadow-2xl ring-2 ring-amber-400/60'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-white/30 hover:text-white/70"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <label className="relative cursor-pointer">
        <input
          type="color"
          value={choice.color}
          onChange={(e) => onUpdate({ ...choice, color: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pick color"
        />
        <div
          className="h-7 w-7 rounded-lg ring-2 ring-white/20"
          style={{ backgroundColor: choice.color, boxShadow: `0 0 12px ${choice.color}80` }}
        />
      </label>

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
          className="h-8 flex-1 border-white/20 bg-black/30 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => { setDraft(choice.label); setEditing(true); }}
          className="flex-1 truncate text-left text-sm text-white/90 hover:text-white"
        >
          {choice.label || `Choice ${index + 1}`}
        </button>
      )}

      {editing ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-emerald-400"
          onClick={() => {
            onUpdate({ ...choice, label: draft.trim() || choice.label });
            setEditing(false);
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white/50 hover:text-amber-300"
          onClick={() => { setDraft(choice.label); setEditing(true); }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-white/50 hover:text-rose-400"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function ChoicesList({ choices, onChange }: Props) {
  const [newLabel, setNewLabel] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function addChoice() {
    const label = newLabel.trim();
    if (!label) return;
    const next: Choice = {
      id: generateId(),
      label,
      color: randomColor(choices.length),
      weight: 1,
    };
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
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Choices
          </h2>
          <p className="text-xs text-white/50">
            Drag to reorder · Click color to edit · Click label to rename
          </p>
        </div>
        <Badge variant="secondary" className="bg-white/10 text-white">
          {choices.length} {choices.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add a choice…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addChoice();
          }}
          className="border-white/15 bg-black/40 text-white placeholder:text-white/30"
        />
        <Button
          onClick={addChoice}
          className="bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black hover:from-fuchsia-400 hover:to-amber-300"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {choices.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-center">
            <p className="text-sm text-white/40">No choices yet</p>
            <p className="text-xs text-white/30">Add at least 2 to start spinning</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={choices.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
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

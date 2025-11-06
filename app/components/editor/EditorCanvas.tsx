'use client';

import { ComponentData } from '@/lib/editor/types';
import { COMPONENT_LIBRARY } from '@/lib/editor/component-library';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMove, FiEye } from 'react-icons/fi';

interface EditorCanvasProps {
  components: ComponentData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (components: ComponentData[]) => void;
}

function SortableComponent({
  component,
  isSelected,
  onSelect,
}: {
  component: ComponentData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const componentDef = COMPONENT_LIBRARY.find((c) => c.type === component.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-700 hover:bg-purple-600 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <FiMove className="w-4 h-4 text-white" />
      </div>

      {/* Component Preview */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{componentDef?.icon || '📦'}</span>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{componentDef?.name || component.type}</h4>
          <p className="text-gray-400 text-xs">{componentDef?.category}</p>
        </div>
      </div>

      {/* Simple data preview */}
      <div className="text-xs text-gray-500 space-y-1">
        {Object.entries(component.data).slice(0, 3).map(([key, value]) => (
          <div key={key} className="truncate">
            <span className="text-gray-400">{key}:</span>{' '}
            <span className="text-gray-300">
              {typeof value === 'string' ? value.substring(0, 50) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditorCanvas({
  components,
  selectedId,
  onSelect,
  onReorder,
}: EditorCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);

      onReorder(arrayMove(components, oldIndex, newIndex));
    }
  };

  if (components.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👈</div>
          <h3 className="text-xl font-semibold text-white mb-2">Start Building!</h3>
          <p className="text-gray-400 mb-4">
            Click on a component from the left panel to add it to your character page
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 text-sm">
            <FiEye className="w-4 h-4" />
            Components will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={components.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 max-w-4xl mx-auto">
            {components.map((component) => (
              <SortableComponent
                key={component.id}
                component={component}
                isSelected={selectedId === component.id}
                onSelect={() => onSelect(component.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

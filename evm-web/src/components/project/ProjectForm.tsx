import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CreateProjectPayload } from '../../types';

interface ProjectFormProps {
  onSubmit: (values: CreateProjectPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del proyecto es requerido');
      return;
    }
    if (trimmedName.length > 255) {
      setError('El nombre no puede exceder 255 caracteres');
      return;
    }

    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Nombre del proyecto"
        placeholder="Ej: Proyecto Alpha"
        value={name}
        onChange={(e) => { setName(e.target.value); setError(''); }}
        error={error}
        maxLength={255}
        autoFocus
        required
      />

      <div className="w-full">
        <label
          htmlFor="project-description"
          className="block text-sm font-medium text-evm-text-primary mb-1.5"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="project-description"
          placeholder="Breve descripción del proyecto..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-evm-border rounded-lg text-sm
            bg-evm-card text-evm-text-primary placeholder:text-evm-text-muted
            focus:outline-none focus:border-evm-primary focus:ring-2 focus:ring-evm-primary/20
            transition-all duration-150 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          Crear Proyecto
        </Button>
      </div>
    </form>
  );
}

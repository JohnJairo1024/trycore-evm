import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CreateActivityPayload } from '../../types';

interface ActivityFormProps {
  onSubmit: (values: CreateActivityPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialValues?: CreateActivityPayload;
}

export function ActivityForm({
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
}: ActivityFormProps) {
  const isEditing = !!initialValues;
  const [name, setName] = useState(initialValues?.name ?? '');
  const [bac, setBac] = useState(initialValues?.bac?.toString() ?? '');
  const [plannedPercentage, setPlannedPercentage] = useState(
    initialValues?.plannedPercentage?.toString() ?? '',
  );
  const [actualPercentage, setActualPercentage] = useState(
    initialValues?.actualPercentage?.toString() ?? '',
  );
  const [ac, setAc] = useState(initialValues?.ac?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'El nombre es requerido';
    else if (name.trim().length > 255) newErrors.name = 'Máximo 255 caracteres';

    const bacNum = parseFloat(bac);
    if (!bac || isNaN(bacNum)) newErrors.bac = 'El BAC es requerido';
    else if (bacNum <= 0) newErrors.bac = 'Debe ser mayor a 0';

    const plannedNum = parseFloat(plannedPercentage);
    if (!plannedPercentage || isNaN(plannedNum))
      newErrors.plannedPercentage = 'Requerido';
    else if (plannedNum < 0 || plannedNum > 100)
      newErrors.plannedPercentage = 'Debe estar entre 0 y 100';

    const actualNum = parseFloat(actualPercentage);
    if (!actualPercentage || isNaN(actualNum))
      newErrors.actualPercentage = 'Requerido';
    else if (actualNum < 0 || actualNum > 100)
      newErrors.actualPercentage = 'Debe estar entre 0 y 100';

    const acNum = parseFloat(ac);
    if (!ac || isNaN(acNum)) newErrors.ac = 'El costo real es requerido';
    else if (acNum < 0) newErrors.ac = 'No puede ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      bac: parseFloat(bac),
      plannedPercentage: parseFloat(plannedPercentage),
      actualPercentage: parseFloat(actualPercentage),
      ac: parseFloat(ac),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Nombre de la actividad"
        placeholder="Ej: Diseño de UI"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={255}
        autoFocus
        required
      />

      <Input
        label="BAC (Presupuesto total)"
        placeholder="50000"
        type="number"
        prefix="$"
        value={bac}
        onChange={(e) => setBac(e.target.value)}
        error={errors.bac}
        min={0}
        step="any"
        required
      />

      <Input
        label="% Avance Planificado"
        placeholder="50"
        type="number"
        suffix="%"
        value={plannedPercentage}
        onChange={(e) => setPlannedPercentage(e.target.value)}
        error={errors.plannedPercentage}
        min={0}
        max={100}
        step="any"
        required
      />

      <Input
        label="% Avance Real"
        placeholder="30"
        type="number"
        suffix="%"
        value={actualPercentage}
        onChange={(e) => setActualPercentage(e.target.value)}
        error={errors.actualPercentage}
        min={0}
        max={100}
        step="any"
        required
      />

      <Input
        label="Costo Real (AC)"
        placeholder="25000"
        type="number"
        prefix="$"
        value={ac}
        onChange={(e) => setAc(e.target.value)}
        error={errors.ac}
        min={0}
        step="any"
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Guardar Cambios' : 'Agregar Actividad'}
        </Button>
      </div>
    </form>
  );
}

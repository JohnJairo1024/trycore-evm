import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useProject,
  useProjectEVM,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '../hooks/useProjects';
import { AppLayout } from '../components/layout/AppLayout';
import { ProjectSummaryCards } from '../components/project/ProjectSummaryCards';
import { ActivityTable } from '../components/project/ActivityTable';
import { ActivityForm } from '../components/project/ActivityForm';
import { EVMChart } from '../components/project/EVMChart';
import { SkeletonProjectDetail } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { CreateActivityPayload, ActivityWithEVM, ChartDataPoint } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ?? '';

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorObj,
    refetch: refetchProject,
  } = useProject(projectId);

  const {
    data: projectEVM,
    isLoading: evmLoading,
    isError: evmError,
    error: evmErrorObj,
    refetch: refetchEVM,
  } = useProjectEVM(projectId);

  const createActivity = useCreateActivity(projectId);
  const updateActivity = useUpdateActivity(projectId);
  const deleteActivity = useDeleteActivity(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityWithEVM | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLoading = projectLoading || evmLoading;
  const isError = projectError || evmError;
  const errorMessage =
    projectErrorObj?.message ??
    evmErrorObj?.message ??
    'Error al cargar el proyecto';

  const handleRefresh = () => {
    refetchProject();
    refetchEVM();
  };

  const handleCreateActivity = (values: CreateActivityPayload) => {
    createActivity.mutate(values, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleEditActivity = (activityId: string) => {
    const activity = projectEVM?.activities.find((a) => a.id === activityId);
    if (activity) {
      setEditingActivity(activity);
    }
  };

  const handleUpdateActivity = (values: CreateActivityPayload) => {
    if (!editingActivity) return;
    updateActivity.mutate(
      { activityId: editingActivity.id, payload: values },
      {
        onSuccess: () => setEditingActivity(null),
      },
    );
  };

  const handleDeleteClick = (activityId: string) => {
    setDeletingId(activityId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteActivity.mutate(deletingId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeletingId(null);
      },
    });
  };

  // Preparar datos para la gráfica
  const chartData: ChartDataPoint[] =
    projectEVM?.activities.map((a) => ({
      name: a.name,
      pv: a.pv,
      ev: a.ev,
      ac: a.ac,
    })) ?? [];

  if (isLoading) {
    return (
      <AppLayout>
        <SkeletonProjectDetail />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <ErrorState
          title="Error al cargar el proyecto"
          message={errorMessage}
          onRetry={handleRefresh}
        />
      </AppLayout>
    );
  }

  if (!project || !projectEVM) {
    return (
      <AppLayout>
        <ErrorState
          title="Proyecto no encontrado"
          message="El proyecto que buscas no existe o ha sido eliminado"
          onRetry={() => navigate('/')}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout onRefresh={handleRefresh} isRefreshing={isLoading}>
      <div className="space-y-8 animate-slideUp">
        {/* Navegación y título */}
        <div className="space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-evm-text-secondary hover:text-evm-text-primary transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Volver
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-evm-text-primary">
              {project.name}
            </h2>
            {projectEVM.activities.length > 0 && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                {'\u002B'} Agregar Actividad
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <ProjectSummaryCards
          bac={projectEVM.totalBAC}
          ac={projectEVM.totalAC}
          ev={projectEVM.totalEV}
          cpi={projectEVM.cpi}
          spi={projectEVM.spi}
        />

        {/* Tabla de Actividades */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-evm-text-primary">
              Actividades
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              {'\u002B'} Agregar
            </Button>
          </div>
          <ActivityTable
            activities={projectEVM.activities}
            onEdit={handleEditActivity}
            onDelete={handleDeleteClick}
          />
        </section>

        {/* Gráfica EVM */}
        <section>
          <h3 className="text-lg font-semibold text-evm-text-primary mb-4">
            PV vs EV vs AC
          </h3>
          <EVMChart data={chartData} />
        </section>
      </div>

      {/* Modal: Crear Actividad */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Agregar Actividad"
      >
        <ActivityForm
          onSubmit={handleCreateActivity}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createActivity.isPending}
        />
      </Modal>

      {/* Modal: Editar Actividad */}
      <Modal
        open={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        title="Editar Actividad"
      >
        {editingActivity && (
          <ActivityForm
            onSubmit={handleUpdateActivity}
            onCancel={() => setEditingActivity(null)}
            isSubmitting={updateActivity.isPending}
            initialValues={{
              name: editingActivity.name,
              bac: editingActivity.bac,
              plannedPercentage: editingActivity.plannedPercentage,
              actualPercentage: editingActivity.actualPercentage,
              ac: editingActivity.ac,
            }}
          />
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
        title="Eliminar Actividad"
      >
        <div className="space-y-4">
          <p className="text-sm text-evm-text-secondary">
            ¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
              disabled={deleteActivity.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={deleteActivity.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { AppLayout } from '../components/layout/AppLayout';
import { ProjectCard } from '../components/project/ProjectCard';
import { ProjectForm } from '../components/project/ProjectForm';
import { SkeletonProjectGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { CreateProjectPayload } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const createProject = useCreateProject();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleProjectClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const handleCreateProject = (values: CreateProjectPayload) => {
    createProject.mutate(values, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <AppLayout onRefresh={handleRefresh} isRefreshing={isLoading}>
      <div className="space-y-6">
        {/* Header de la página */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-evm-text-primary">
              Proyectos
            </h2>
            <p className="text-sm text-evm-text-secondary mt-0.5">
              {projects && projects.length > 0
                ? `${projects.length} ${projects.length === 1 ? 'proyecto' : 'proyectos'} registrados`
                : 'Gestiona tus proyectos con EVM'}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            {'\u002B'} Nuevo Proyecto
          </Button>
        </div>

        {/* Contenido */}
        {isLoading && <SkeletonProjectGrid count={6} />}

        {isError && (
          <ErrorState
            title="Error al cargar proyectos"
            message={
              error?.message ?? 'No pudimos conectar con el servidor.'
            }
            onRetry={handleRefresh}
          />
        )}

        {!isLoading && !isError && projects && projects.length === 0 && (
          <EmptyState
            icon={'\uD83D\uDCED'}
            title="No hay proyectos aún"
            description="Crea tu primer proyecto para empezar a usar EVM Dashboard"
            action={{
              label: '+ Crear Proyecto',
              onClick: () => setShowCreateModal(true),
            }}
          />
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                activityCount={project.activityCount}
                cpi={project.cpi}
                spi={project.spi}
                createdAt={project.createdAt}
                onClick={handleProjectClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de creación */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Proyecto"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createProject.isPending}
        />
      </Modal>
    </AppLayout>
  );
}

"""
Base service — shared CRUD logic for all entity services.

Eliminates duplication of update/delete patterns across services.
"""

import uuid
from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import declarative_base

ModelT = TypeVar("ModelT", bound=declarative_base())
UpdateSchemaT = TypeVar("UpdateSchemaT", bound=BaseModel)


class BaseService(Generic[ModelT, UpdateSchemaT]):
    """Generic base with shared update/delete logic.

    Subclasses must set _model and implement get_by_id.
    """

    _model: type[ModelT]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def update(
        self, entity_id: uuid.UUID, data: UpdateSchemaT
    ) -> ModelT | None:
        """Update an existing entity. Returns None if not found."""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(entity, field, value)

        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, entity_id: uuid.UUID) -> bool:
        """Delete an entity. Returns True if deleted, False if not found."""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False

        await self.db.delete(entity)
        await self.db.flush()
        return True

    async def get_by_id(self, entity_id: uuid.UUID) -> ModelT | None:
        """Must be implemented by subclasses."""
        raise NotImplementedError

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../../db.ts';
import type { Category } from '../../../../src/types/index.ts';

@Injectable()
export class CategoriesService {
  findAllPublic(): Category[] {
    return db.getCategories();
  }

  findAllAdmin(): Category[] {
    return db.getAllCategoriesAdmin();
  }

  findById(id: string): Category {
    const category = db.getAllCategoriesAdmin().find((c) => c.id === id || c.slug === id);
    if (!category) {
      throw new NotFoundException(`Category with ID or slug '${id}' not found.`);
    }
    return category;
  }

  create(data: {
    name: string;
    slug?: string;
    description?: string;
    iconName?: string;
    color?: string;
    order?: number;
    isActive?: boolean;
  }): Category {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Category name is required.');
    }

    const rawSlug = data.slug && data.slug.trim() ? data.slug : data.name;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return db.createCategory({
      name: data.name.trim(),
      slug: slug || `category-${Date.now()}`,
      description: data.description ? data.description.trim() : '',
      iconName: data.iconName || 'Film',
      color: data.color || '#1769FF',
      order: data.order !== undefined ? Number(data.order) : 99,
      isActive: data.isActive !== false,
    });
  }

  update(id: string, updates: Partial<Category>): Category {
    if (updates.name && !updates.name.trim()) {
      throw new BadRequestException('Category name cannot be empty.');
    }

    const payload: Partial<Category> = { ...updates };
    if (payload.slug) {
      payload.slug = payload.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const updated = db.updateCategory(id, payload);
    if (!updated) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }
    return updated;
  }

  toggleStatus(id: string, isActive?: boolean): Category {
    const existing = this.findById(id);
    const newStatus = isActive !== undefined ? Boolean(isActive) : !existing.isActive;
    const updated = db.updateCategory(id, { isActive: newStatus });
    if (!updated) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }
    return updated;
  }

  delete(id: string): { success: boolean; message: string } {
    const deleted = db.deleteCategory(id);
    if (!deleted) {
      throw new NotFoundException(`Category with ID '${id}' not found.`);
    }
    return { success: true, message: `Category '${id}' deleted successfully.` };
  }

  reorder(categoryIds: string[]): Category[] {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new BadRequestException('categoryIds array is required for reordering.');
    }
    return db.reorderCategories(categoryIds);
  }
}

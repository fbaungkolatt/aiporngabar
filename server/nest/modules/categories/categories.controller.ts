import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service.ts';
import type { Category } from '../../../../src/types/index.ts';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getCategories(): Category[] {
    return this.categoriesService.findAllPublic();
  }

  @Get('all')
  getAllCategories(): Category[] {
    return this.categoriesService.findAllAdmin();
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string): Category {
    return this.categoriesService.findById(id);
  }

  @Post()
  createCategory(@Body() body: any): Category {
    return this.categoriesService.create(body);
  }

  @Put('reorder')
  reorderCategoriesPut(@Body('categoryIds') categoryIds: string[]): Category[] {
    return this.categoriesService.reorder(categoryIds);
  }

  @Post('reorder')
  reorderCategoriesPost(@Body('categoryIds') categoryIds: string[]): Category[] {
    return this.categoriesService.reorder(categoryIds);
  }

  @Put(':id')
  updateCategory(@Param('id') id: string, @Body() body: any): Category {
    return this.categoriesService.update(id, body);
  }

  @Put(':id/status')
  toggleStatusPut(@Param('id') id: string, @Body('isActive') isActive?: boolean): Category {
    return this.categoriesService.toggleStatus(id, isActive);
  }

  @Patch(':id/status')
  toggleStatusPatch(@Param('id') id: string, @Body('isActive') isActive?: boolean): Category {
    return this.categoriesService.toggleStatus(id, isActive);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string): { success: boolean; message: string } {
    return this.categoriesService.delete(id);
  }
}

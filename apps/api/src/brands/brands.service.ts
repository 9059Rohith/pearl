import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Brand } from '@publication/shared';
import { createBrand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { PrismaService } from '../prisma/prisma.service';

type BrandDbRecord = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  settings: Prisma.JsonValue;
};

@Injectable()
export class BrandsService {
  private brands: Map<string, Brand> = new Map();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private shouldUseDatabase(): boolean {
    return !!this.prisma && !!process.env.DATABASE_URL;
  }

  private toBrandRecord(raw: BrandDbRecord): Brand {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      logoUrl: raw.logoUrl || undefined,
      primaryColor: raw.primaryColor,
      secondaryColor: raw.secondaryColor,
      contactEmail: raw.contactEmail,
      settings:
        raw.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings)
          ? (raw.settings as Record<string, unknown>)
          : {},
    };
  }

  async findAll(): Promise<Brand[]> {
    if (this.shouldUseDatabase()) {
      const brands: BrandDbRecord[] = await this.prisma!.brand.findMany({ orderBy: { name: 'asc' } });
      return brands.map((brand) => this.toBrandRecord(brand));
    }

    return Array.from(this.brands.values());
  }

  async findById(id: string): Promise<Brand> {
    if (this.shouldUseDatabase()) {
      const brand = await this.prisma!.brand.findUnique({ where: { id } });
      if (!brand) {
        throw new NotFoundException(`Brand ${id} not found`);
      }
      return this.toBrandRecord(brand);
    }

    const brand = this.brands.get(id);
    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const brand = createBrand(
      dto.name,
      dto.contactEmail,
      dto.primaryColor,
      dto.secondaryColor,
    );
    if (dto.logoUrl) brand.logoUrl = dto.logoUrl;

    if (this.shouldUseDatabase()) {
      const created = await this.prisma!.brand.create({
        data: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logoUrl: brand.logoUrl,
          primaryColor: brand.primaryColor,
          secondaryColor: brand.secondaryColor,
          contactEmail: brand.contactEmail,
          settings: brand.settings,
        },
      });
      return this.toBrandRecord(created);
    }

    this.brands.set(brand.id, brand);
    return brand;
  }

  async update(id: string, updates: Partial<Brand>): Promise<Brand> {
    if (this.shouldUseDatabase()) {
      const existing = await this.prisma!.brand.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Brand ${id} not found`);
      }

      const updated = await this.prisma!.brand.update({
        where: { id },
        data: {
          name: updates.name,
          slug: updates.slug,
          logoUrl: updates.logoUrl,
          primaryColor: updates.primaryColor,
          secondaryColor: updates.secondaryColor,
          contactEmail: updates.contactEmail,
          settings: updates.settings,
        },
      });
      return this.toBrandRecord(updated);
    }

    const brand = await this.findById(id);
    Object.assign(brand, updates, { id: brand.id });
    return brand;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldUseDatabase()) {
      const existing = await this.prisma!.brand.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Brand ${id} not found`);
      }
      await this.prisma!.brand.delete({ where: { id } });
      return;
    }

    if (!this.brands.has(id)) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    this.brands.delete(id);
  }
}

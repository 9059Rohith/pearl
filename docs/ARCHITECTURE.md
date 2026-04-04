# Architecture Guide

## System Overview

The platform consists of three applications and a shared types package, arranged as a pnpm monorepo managed by Turborepo.

```mermaid
flowchart LR
    subgraph clients["Client Applications"]
        admin["apps/admin\nNext.js Admin Portal"]
        site["apps/site\nNext.js Public Site"]
    end

    subgraph backend["Backend"]
        api["apps/api\nNestJS API"]
    end

    subgraph shared["Shared"]
        pkg["packages/shared\nTypes & Utilities"]
    end

    admin <-->|"Pages CRUD\nLeads read\nBrands config"| api
    site <-->|"Pages read\nLead submission"| api
    admin -.->|"imports"| pkg
    site -.->|"imports"| pkg
    api -.->|"imports"| pkg
```

- **apps/admin** — Internal admin portal built with Next.js. Brand managers use it to create and edit landing pages, manage leads, and configure brand settings.
- **apps/site** — Public-facing site built with Next.js. Renders landing pages and deep dives for visitors. Hosts contact forms that capture leads.
- **apps/api** — NestJS backend providing REST endpoints for all data operations. Handles page storage, lead capture, brand management, email dispatch, and analytics.
- **packages/shared** — TypeScript type definitions and utility functions shared across all three apps. Provides the contract between frontend and backend.

## Data Flow

```mermaid
sequenceDiagram
    participant Admin as apps/admin
    participant API as apps/api
    participant DB as Database
    participant Site as apps/site
    participant Visitor as Site Visitor
    participant Email as Email Service

    Admin->>API: POST /pages (create page)
    API->>DB: Store page data
    API-->>Admin: Page created

    Visitor->>Site: GET /brand-slug/page-slug
    Site->>API: GET /pages/:id
    API->>DB: Fetch page
    API-->>Site: Page data
    Site-->>Visitor: Rendered landing page

    Visitor->>Site: Submit contact form
    Site->>API: POST /leads
    API->>DB: Store lead record
    API->>Email: Send notification to brand manager
    Email-->>API: Delivery confirmation
    API-->>Site: Lead captured
```

## Module Dependency

The NestJS API is organized into five modules. Each module encapsulates a domain concern.

```mermaid
flowchart TD
    AppModule["AppModule\n(Root)"]

    AppModule --> PagesModule
    AppModule --> LeadsModule
    AppModule --> BrandsModule
    AppModule --> EmailModule
    AppModule --> AnalyticsModule

    LeadsModule -->|"uses"| EmailModule
    LeadsModule -->|"uses"| AnalyticsModule
    PagesModule -->|"uses"| BrandsModule

    style AppModule fill:#f9f,stroke:#333,stroke-width:2px
```

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| **PagesModule** | CRUD operations for landing pages. Manages page content, templates, and brand associations. Depends on BrandsModule for brand validation. |
| **LeadsModule** | Lead capture and management. Processes contact form submissions, stores lead records, triggers email notifications and analytics events. |
| **BrandsModule** | Brand configuration and management. Stores brand settings, slugs, and metadata. Provides brand lookup used by other modules. |
| **EmailModule** | Email dispatch service. Sends notification emails to brand managers when new leads arrive. Consumed by LeadsModule. |
| **AnalyticsModule** | Event tracking and analytics. Records page views, form submissions, and other user interactions. Consumed by LeadsModule. |

## Shared Types Package

The `packages/shared` package (`index.ts`, `types.ts`) defines the TypeScript interfaces and DTOs shared between all three applications. This ensures that API request/response shapes, entity types, and utility functions stay consistent across the frontend and backend without manual synchronization.

Changes to shared types propagate to all consumers at build time via Turborepo's dependency graph.

## Key Data Entities

```mermaid
erDiagram
    Brand ||--o{ Page : "owns"
    Page ||--o{ Section : "contains"
    Page ||--o{ Lead : "captures"
    Page }o--o| Page : "cloned from (template)"

    Brand {
        string id PK
        string name
        string slug
        string primaryColor
        string contactEmail
    }

    Page {
        string id PK
        string title
        string slug UK
        string brandId FK
        string status
        object theme
    }

    Section {
        string id PK
        string type
        string title
        object content
        int order
    }

    Lead {
        string id PK
        string pageId FK
        string brandId FK
        string name
        string email
        object metadata
        string notes
    }
```

## Template Cloning Flow

When a page is created from a template, the system copies the template page's properties into a new page. The sections and theme are carried over to give the new page the same structure as the template.

```mermaid
flowchart TD
    A[Admin clicks Clone] --> B[POST /pages with templateId]
    B --> C{Template found?}
    C -->|No| D[404 Not Found]
    C -->|Yes| E[Copy page fields]
    E --> F[Generate new slug]
    F --> G{Slug available?}
    G -->|No| H[409 Conflict]
    G -->|Yes| I[Assign sections from template]
    I --> J[Spread-copy theme]
    J --> K[Save new page]
    K --> L[Return new page]
```

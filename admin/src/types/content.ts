export interface SeoInput {
  title?: string
  description?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImageKey?: string
  robots?: string
}

export interface SectionInput {
  id?: string
  type: string
  props: Record<string, any>
}

export interface PageListItem {
  id: string
  title: string
  slug: string
  status: string
  lastModifiedAt: number
  lastModifiedBy: string
  publishedVersionId: string | null
  seo?: SeoInput
}

export interface PageVersion {
  id: string
  createdAt: number
  createdBy: string
  reason?: string
  published: boolean
}

export interface PageDetail {
  id: string
  title: string
  slug: string
  description: string
  seo: SeoInput
  sections: SectionInput[]
  status: string
  publishedVersionId: string | null
  lastModifiedAt: number
  lastModifiedBy: string
  createdAt: number
  createdBy: string
  versions: PageVersion[]
}

export interface MediaItem {
  filename?: string
  id: string
  url: string
  contentType: string
  width: number
  height: number
  size: number
  altText?: string
  uploadedAt: number
  uploadedBy: string
}

export interface PreviewPayload {
  pageId: string
  slug?: string
  title: string
  versionId: string
  payload: {
    title?: string
    slug?: string
    description?: string
    seo?: SeoInput
    sections?: SectionInput[]
    breadcrumb?: any
  }
  createdAt: number
  createdBy: string
  reason: string
}

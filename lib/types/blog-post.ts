export interface BlogPostFrontmatter {
  title: string;
  tags: string[];
  category: string;
  date: string;
  updated?: string;
  excerpt: string;
  draft?: boolean;
  hero_image?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
  og_image?: string;
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  tags: string[];
  category: string;
  date: string;
  updated?: string;
  excerpt: string;
  hero_image?: string;
  og_image?: string;
}

export interface BlogFilterOption {
  name: string;
  count: number;
}

export interface BlogPostsResponse {
  success: boolean;
  posts: BlogPostSummary[];
  categories: BlogFilterOption[];
  tags: BlogFilterOption[];
  stats: {
    totalPosts: number;
    totalCategories: number;
    totalTags: number;
  };
}

export interface BlogPostResponse {
  success: boolean;
  post?: BlogPost;
  error?: string;
}

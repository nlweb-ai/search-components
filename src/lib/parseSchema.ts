import {Thing} from 'schema-dts';
import {z} from 'zod';
import { filterTruthy } from './util';


// === SUPPORTING SCHEMAS ===

// Zod validator for ImageObject
const ImageObjectSchema = z.object({
  "@type": z.literal("ImageObject").optional(),
  "@id": z.string(),
  url: z.string().optional(),
  contentUrl: z.string().optional(),
}).passthrough();

// Zod validator for Image - can be string, ImageObject, or array of either
const ImageSchema = z.union([
  z.string(),
  ImageObjectSchema,
  z.array(z.union([z.string(), ImageObjectSchema]))
]);

export type ImageType = z.infer<typeof ImageSchema>;

// Person schema for director/actor
const PersonSchema = z.object({
  "@type": z.literal("Person").optional(),
  name: z.string(),
  url: z.string().optional(),
}).passthrough();
export type PersonType = z.infer<typeof PersonSchema>;

// Organization schema for productionCompany, publisher
const OrganizationSchema = z.object({
  "@type": z.literal("Organization").optional(),
  name: z.string(),
  url: z.string().optional(),
}).passthrough();
export type OrganizationType = z.infer<typeof OrganizationSchema>;

// Rating schema for review ratings
const RatingSchema = z.object({
  "@type": z.literal("Rating").optional(),
  ratingValue: z.union([z.string(), z.number()]),
  bestRating: z.union([z.string(), z.number()]).optional(),
  worstRating: z.union([z.string(), z.number()]).optional(),
}).passthrough();
export type RatingType = z.infer<typeof RatingSchema>;  

// AggregateRating schema
const AggregateRatingSchema = z.object({
  "@type": z.literal("AggregateRating").optional(),
  ratingValue: z.union([z.string(), z.number()]),
  bestRating: z.union([z.string(), z.number()]).optional(),
  worstRating: z.union([z.string(), z.number()]).optional(),
  ratingCount: z.union([z.string(), z.number()]).optional(),
  reviewCount: z.union([z.string(), z.number()]).optional(),
}).passthrough();
export type AggregateRatingType = z.infer<typeof AggregateRatingSchema>;

// Review schema
const ReviewSchema = z.object({
  "@type": z.literal("Review").optional(),
  datePublished: z.string().optional(),
  reviewBody: z.string().optional(),
  reviewRating: RatingSchema.optional(),
  author: z.union([PersonSchema, OrganizationSchema, z.string()]).optional(),
}).passthrough();
export type ReviewType = z.infer<typeof ReviewSchema>;

// VideoObject schema for trailer
const VideoObjectSchema = z.object({
  "@type": z.literal("VideoObject").optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  uploadDate: z.string().optional(),
  contentUrl: z.string().optional(),
  embedUrl: z.string().optional(),
  duration: z.string().optional(),
}).passthrough();
export type VideoObjectType = z.infer<typeof VideoObjectSchema>;


// === NLWEB RESULT SCHEMAS ===

export interface Summary {
  "@type" : "Summary";
  text: string;
}

function resultTypeIs(result: NlwebResult, type: string) {
  if (Array.isArray(result["@type"])) {
    return result["@type"].includes(type);
  } return result["@type"] == type;
}

/**
 * Based on the result `@type`, extract possible thumbnail URLs. Different types
 * have different candidates to try; the rules here are based on what works empirically.
 * The `Thumbnail` component uses this to try each candidate in order until one works.
 */
export function getThumbnailCandidates(result: NlwebResult): string[] {
  function filter<T>(candidates: (T | null | undefined)[]): T[] {
    return deduplicate(filterTruthy(candidates));
  }

  if (isArticleResult(result) && typeof result.thumbnailUrl === 'string') {
    const thumbnailUrl = result.thumbnailUrl ? (
      result.thumbnailUrl.startsWith('http') ? result.thumbnailUrl : `https://${result.site}${result.thumbnailUrl}`
    ) : null;
    return filter([ thumbnailUrl, getImageUrl(result.image) ]);
  }
  if (isMovieResult(result)) {
    return filter([ getImageUrl(result.image), result.trailer?.thumbnailUrl ]);
  }
  return filter([getImageUrl(result.image)]);
}

function deduplicate<T>(array: T[]): T[] {
  const seen = new Set<T>();
  return array.filter(item => {
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

// Helper function to extract image URL from various image formats
export function getImageUrl(image: ImageType | undefined): string | null {
  if (!image) {
    return null;
  }

  // If it's a string, return it directly
  if (typeof image === 'string') {
    return image;
  }

  // If it's an array, get the first item
  if (Array.isArray(image)) {
    if (image.length === 0) {
      return null;
    }
    const firstImage = image[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    // It's an ImageObject
    return firstImage.contentUrl || firstImage.url || null;
  }

  // It's an ImageObject
  return image.contentUrl || image.url || image["@id"];
}

// Zod validator for Recipe
const RecipeSchema = z.object({
  "@type": z.union([
    z.literal("Recipe"),
    z.array(z.string()).refine((arr) => arr.includes("Recipe"), {
      message: "Array must contain 'Recipe'"
    })
  ]),
  "@id": z.string(),
  score: z.number(),
  site: z.string(),
  name: z.string().optional(),
  recipeIngredient: z.union([z.array(z.string()), z.string()]).optional(),
  recipeInstructions: z.any().optional(),
  recipeYield: z.any().optional(),
  cookTime: z.string().optional(),
  prepTime: z.string().optional(),
  totalTime: z.string().optional(),
  description: z.string().optional(),
  image: ImageSchema.optional(),
}).passthrough(); // Allow additional properties
export type RecipeResult = z.infer<typeof RecipeSchema>;

export function isRecipeResult(result: NlwebResult): result is RecipeResult {
  return resultTypeIs(result, "Recipe");
}

// Zod validator for Article
const ArticleSchema = z.object({
  "@type": z.union([
    z.literal("Article"),
    z.literal("NewsArticle"),
    z.literal("BlogPosting"),
    z.array(z.string()).refine((arr) =>
      arr.includes("Article") || arr.includes("NewsArticle") || arr.includes("BlogPosting"), {
      message: "Array must contain 'Article', 'NewsArticle', or 'BlogPosting'"
    })
  ]),
  "@id": z.string(),
  score: z.number(),
  site: z.string(),
  headline: z.string().optional(),
  description: z.string().optional(),
  image: ImageSchema.optional(),
  author: z.any().optional(),
  publisher: z.any().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  thumbnailUrl: z.string().optional()
}).passthrough(); // Allow additional properties
export type ArticleResult = z.infer<typeof ArticleSchema>

export function isArticleResult(result: NlwebResult): result is ArticleResult {
  return resultTypeIs(result, "Article") ||
         resultTypeIs(result, "NewsArticle") ||
         resultTypeIs(result, "BlogPosting");
}

const MovieSchema = z.object({
  "@type": z.union([
    z.literal("Movie"),
    z.array(z.string()).refine((arr) => arr.includes("Movie"), {
      message: "Array must contain 'Movie'"
    })
  ]),
  "@id": z.string(),
  score: z.number(),
  site: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  image: ImageSchema.optional(),
  url: z.string().optional(),
  genre: z.array(z.string()).optional(),
  datePublished: z.string().optional(),
  director: z.union([PersonSchema, z.array(PersonSchema)]).optional(),
  actor: z.union([PersonSchema, z.array(PersonSchema)]).optional(),
  aggregateRating: AggregateRatingSchema.optional(),
  duration: z.string().optional(),
  contentRating: z.string().optional(),
  productionCompany: z.union([OrganizationSchema, z.array(OrganizationSchema)]).optional(),
  trailer: VideoObjectSchema.optional(),
  review: z.union([ReviewSchema, z.array(ReviewSchema)]).optional(),
  sameAs: z.array(z.string()).optional(),
  // Additional schema.org/Movie properties
  countryOfOrigin: z.any().optional(),
  musicBy: z.union([PersonSchema, z.array(PersonSchema)]).optional(),
  producer: z.union([PersonSchema, OrganizationSchema, z.array(z.union([PersonSchema, OrganizationSchema]))]).optional(),
}).passthrough(); // Allow additional properties
export type MovieResult = z.infer<typeof MovieSchema>;

export function isMovieResult(result: NlwebResult): result is MovieResult {
  return resultTypeIs(result, "Movie");
}

// Zod validator for Summary
const SummarySchema = z.object({
  "@type": z.literal("Summary"),
  text: z.string(),
}).passthrough(); // Allow additional properties


export type NlwebResult = RecipeResult | ArticleResult | MovieResult;

export function parseSchema(data: Thing): NlwebResult | Summary | null {
  // Try to parse as Recipe
  const recipeResult = RecipeSchema.safeParse(data);
  if (recipeResult.success) {
    return recipeResult.data as RecipeResult;
  }

  const movieResult = MovieSchema.safeParse(data);
  if (movieResult.success) {
    return movieResult.data as MovieResult;
  }

  // Try to parse as Article
  const articleResult = ArticleSchema.safeParse(data);
  if (articleResult.success) {
    return articleResult.data as ArticleResult;
  }

  // Try to parse as Summary
  const summaryResult = SummarySchema.safeParse(data);
  if (summaryResult.success) {
    return summaryResult.data as Summary;
  } else {
    console.log('failed to parse', data);
  }

  // If none match, return null
  return null;
}

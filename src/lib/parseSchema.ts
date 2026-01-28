import {Thing} from 'schema-dts';
import {z} from 'zod';

export interface Summary {
  "@type" : "Summary";
  text: string;
}

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


function resultTypeIs(result: NlwebResult, type: string) {
  if (Array.isArray(result["@type"])) {
    return result["@type"].includes(type);
  } return result["@type"] == type;
}

export function getThumbnailUrl(result: NlwebResult) {
  if (resultTypeIs(result, "Article") && typeof result.thumbnailUrl == 'string') {
    if (result.thumbnailUrl.startsWith('http')) {
      return result.thumbnailUrl;
    }
    return `https://${result.site}${result.thumbnailUrl}`;
  } return getImageUrl(result.image);
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

// Zod validator for Summary
const SummarySchema = z.object({
  "@type": z.literal("Summary"),
  text: z.string(),
}).passthrough(); // Allow additional properties


export type NlwebResult = RecipeResult | ArticleResult;

export function parseSchema(data: Thing): NlwebResult | Summary | null {
  // Try to parse as Recipe
  const recipeResult = RecipeSchema.safeParse(data);
  if (recipeResult.success) {
    return recipeResult.data as RecipeResult;
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
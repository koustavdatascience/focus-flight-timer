import { supabase } from "@/lib/supabase";

export const feedbackCategories = ["bug", "idea", "map_route", "account", "other"] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];

export function validateFeedbackMessage(message: string) {
  const value = message.trim();
  if (value.length < 10) return "Please add a little more detail (at least 10 characters).";
  if (value.length > 5000) return "Please keep feedback under 5,000 characters.";
  return null;
}

export async function submitFocusflightFeedback(category: FeedbackCategory, message: string, contextPath: string) {
  const validationError = validateFeedbackMessage(message);
  if (validationError) throw new Error(validationError);
  const { error } = await supabase.rpc("submit_focusflight_feedback", {
    p_category: category,
    p_message: message.trim(),
    p_context_path: contextPath || null,
  });
  if (error) throw error;
}

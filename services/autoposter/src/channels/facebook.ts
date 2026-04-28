import { env } from "../env.ts";

const GRAPH_VERSION = "v19.0";

export interface FacebookPostInput {
  message: string;
  link?: string | null;
}

export interface FacebookPostResult {
  id?: string;
  error?: { message: string; code?: number; type?: string };
}

export async function postToFacebookPage(
  input: FacebookPostInput
): Promise<FacebookPostResult> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${env.facebook.pageId}/feed`;
  const params = new URLSearchParams();
  params.set("message", input.message);
  if (input.link) params.set("link", input.link);
  params.set("access_token", env.facebook.pageToken);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return (await res.json()) as FacebookPostResult;
}

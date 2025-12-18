// Mock Unsplash API call for demo purposes
export async function unsplash_tool(query: string): Promise<string> {
  // In a real application, this would call the actual Unsplash API
  // For demo purposes, we'll return a placeholder URL
  const encodedQuery = encodeURIComponent(query);
  return `https://source.unsplash.com/400x600/?${encodedQuery}&${Math.random()}`;
}

// Prints API requests (as curl) sent from the browser to the dev server terminal
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  console.log(await request.text());
  return new Response(null, { status: 204 });
}

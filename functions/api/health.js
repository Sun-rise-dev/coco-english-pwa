// Simple health check - test function routing
export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, time: Date.now() }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

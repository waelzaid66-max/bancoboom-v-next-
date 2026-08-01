/**
 * Cloudflare Workers stub for GitHub "Workers Builds" status checks.
 *
 * Coolify SoT: waelzaid66-max/banco-with-wael + docker-compose.coolify.yml.
 * Sister repo name "bancoo" in the service string is CI historical only.
 *
 * Production API traffic is Coolify/Docker, not this worker. Do NOT attach
 * custom domains without an explicit owner decision.
 */
export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({
        ok: true,
        service: "banco-workers-ci-stub",
        sot: "waelzaid66-max/banco-with-wael",
        message:
          "BANCO production API is Coolify-hosted. This Cloudflare Worker is a CI stub only.",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  },
};

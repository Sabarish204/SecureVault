/**
 * SecureVault Feedback & Suggestion Cloudflare Worker
 *
 * This lightweight serverless function allows the SecureVault Android APK and Web app
 * to submit user suggestions and bug reports directly as GitHub Issues in Sabarish204/SecureVault
 * WITHOUT exposing your GitHub Personal Access Token in the frontend app!
 *
 * HOW TO DEPLOY (Takes 2 minutes on free Cloudflare account):
 * 1. Go to https://dash.cloudflare.com/ -> Workers & Pages -> Create Worker
 * 2. Name it "securevault-feedback" and paste this code.
 * 3. In Worker Settings -> Variables -> Add Secret:
 *    Name: GITHUB_TOKEN
 *    Value: <Your GitHub Personal Access Token with 'issues:write' or 'repo' permission>
 * 4. Deploy and copy the worker URL (e.g. https://securevault-feedback.yourname.workers.dev).
 * 5. Set that URL in FeedbackService.proxyEndpoint!
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const data = await request.json();
      const { title, body, labels } = data;

      if (!title || !body) {
        return new Response(JSON.stringify({ error: 'Title and body are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!env.GITHUB_TOKEN) {
        return new Response(JSON.stringify({ error: 'GITHUB_TOKEN secret not configured on worker' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const repo = 'Sabarish204/SecureVault';
      const ghResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'User-Agent': 'SecureVault-Feedback-Worker/1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          labels: Array.isArray(labels) ? labels : ['user-feedback'],
        }),
      });

      if (!ghResponse.ok) {
        const errorText = await ghResponse.text();
        return new Response(JSON.stringify({ error: 'GitHub API error', details: errorText }), {
          status: ghResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const issue = await ghResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          issueNumber: issue.number,
          issueUrl: issue.html_url,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Server error', message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

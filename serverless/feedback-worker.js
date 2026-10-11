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
      const { title, body, labels, attachments } = data;

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
      let finalBody = body;
      const uploadedImages = [];

      // Process up to 3 attachments and upload to repository contents
      if (Array.isArray(attachments) && attachments.length > 0) {
        for (let i = 0; i < Math.min(attachments.length, 3); i++) {
          const att = attachments[i];
          if (!att || !att.dataUrl) continue;

          try {
            const rawBase64 = att.dataUrl.includes(',')
              ? att.dataUrl.split(',')[1]
              : att.dataUrl;

            const ext = (att.type && att.type.includes('png')) ? 'png' : 'jpg';
            const safeName = (att.name || `screenshot_${i + 1}`)
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '_');
            const filePath = `.github/feedback-assets/${Date.now()}_${i + 1}_${safeName}.${ext}`;

            const uploadRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
              method: 'PUT',
              headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'SecureVault-Feedback-Worker/1.0',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Upload feedback attachment: ${safeName}`,
                content: rawBase64,
                branch: 'main',
              }),
            });

            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json();
              const rawUrl = uploadJson.content?.download_url ||
                `https://raw.githubusercontent.com/${repo}/main/${filePath}`;
              uploadedImages.push({ name: att.name || `Screenshot ${i + 1}`, url: rawUrl });
            } else {
              const errStatus = uploadRes.status;
              const errText = await uploadRes.text();
              console.warn(`Attachment upload failed (status ${errStatus}):`, errText);
            }
          } catch (uploadErr) {
            console.warn('Failed to upload attachment:', uploadErr);
          }
        }

        if (uploadedImages.length > 0) {
          const imageSection = `### 📸 Attached Screenshots (${uploadedImages.length})\n` +
            uploadedImages.map(img =>
              `<a href="${img.url}" target="_blank"><img src="${img.url}" alt="${img.name}" width="380" style="max-width:100%; border-radius:8px; margin:6px 0;" /></a>`
            ).join('\n\n') + '\n\n';

          if (finalBody.includes('### 📸 Attachments')) {
            finalBody = finalBody.replace(/### 📸 Attachments[\s\S]*?(?=\n>|\n---|$)/, imageSection);
          } else {
            finalBody += `\n\n---\n${imageSection}`;
          }
        }
      }

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
          body: finalBody,
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

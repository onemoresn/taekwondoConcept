import { Deno } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  event: 'attempted' | 'parent_verified' | 'approved' | 'denied';
  studentName: string;
  requirementTitle: string;
  beltName: string;
  linkPath: string;
  feedback?: string;
  toEmail?: string;
}

function buildHtml(payload: EmailPayload) {
  const { event, studentName, requirementTitle, beltName, linkPath, feedback } = payload;
  const subjects = {
    attempted: `${studentName} marked "${requirementTitle}" as attempted`,
    parent_verified: `Ready for review: ${studentName} — ${requirementTitle}`,
    approved: `Approved: ${requirementTitle}`,
    denied: `Needs work: ${requirementTitle}`,
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:Inter,Arial,sans-serif;background:#080808;color:#f2f2f2;margin:0;padding:24px}
.card{max-width:480px;margin:0 auto;background:#121212;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:24px}
h1{font-size:22px;color:#e8222a;margin:0 0 12px}.meta{color:#888;font-size:14px;margin-bottom:16px}
.btn{display:inline-block;background:#e8222a;color:#fff!important;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;margin-top:16px}
.feedback{background:#1a1a1a;padding:12px;border-radius:8px;margin-top:12px;font-size:14px}</style></head>
<body><div class="card">
<h1>Dojang</h1>
<p class="meta">${beltName} · ${requirementTitle}</p>
<p>${subjects[event] ?? 'Workflow update'}</p>
${feedback ? `<div class="feedback"><strong>Feedback:</strong> ${feedback}</div>` : ''}
<a class="btn" href="${linkPath}">Open in Dojang</a>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@dojang.app';
    const toEmail = payload.toEmail ?? Deno.env.get('WORKFLOW_EMAIL_TO');

    if (!sendgridKey || !toEmail) {
      console.log('[send-workflow-email] Skipped — missing SENDGRID_API_KEY or recipient', payload);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subjectMap = {
      attempted: `Verify: ${payload.studentName} — ${payload.requirementTitle}`,
      parent_verified: `Review: ${payload.studentName} — ${payload.requirementTitle}`,
      approved: `Approved: ${payload.requirementTitle}`,
      denied: `Needs work: ${payload.requirementTitle}`,
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail, name: 'Dojang' },
        subject: subjectMap[payload.event] ?? 'Dojang update',
        content: [{ type: 'text/html', value: buildHtml(payload) }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SendGrid error: ${text}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

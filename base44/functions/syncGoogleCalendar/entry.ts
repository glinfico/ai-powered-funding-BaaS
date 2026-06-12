import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const state = body.data?._provider_meta?.['x-goog-resource-state'];
    if (state === 'sync') {
      return Response.json({ status: 'sync_ack' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const existing = await base44.asServiceRole.entities.SyncState.filter({ key: 'googlecalendar' });
    const syncRecord = existing.length > 0 ? existing[0] : null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${syncRecord.sync_token}`;
    } else {
      url += '&timeMin=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    let res = await fetch(url, { headers: authHeader });

    // syncToken expired — full re-sync
    if (res.status === 410) {
      url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100'
        + '&timeMin=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      res = await fetch(url, { headers: authHeader });
    }

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ status: 'api_error', detail: err }, { status: 502 });
    }

    // Drain all pages
    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;

    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    // Upsert events into CalendarEvent entity
    for (const event of allItems) {
      const eventData = {
        google_event_id: event.id,
        title: event.summary || '(No Title)',
        description: event.description || '',
        start_time: event.start?.dateTime || event.start?.date || '',
        end_time: event.end?.dateTime || event.end?.date || '',
        attendees: (event.attendees || []).map(a => a.email),
        html_link: event.htmlLink || '',
        status: event.status || 'confirmed',
      };

      const existing_event = await base44.asServiceRole.entities.CalendarEvent.filter({ google_event_id: event.id });
      if (existing_event.length > 0) {
        await base44.asServiceRole.entities.CalendarEvent.update(existing_event[0].id, eventData);
      } else if (event.status !== 'cancelled') {
        await base44.asServiceRole.entities.CalendarEvent.create(eventData);
      }
    }

    // Save new sync token
    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
      } else {
        await base44.asServiceRole.entities.SyncState.create({ key: 'googlecalendar', sync_token: newSyncToken });
      }
    }

    return Response.json({ status: 'ok', processed: allItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
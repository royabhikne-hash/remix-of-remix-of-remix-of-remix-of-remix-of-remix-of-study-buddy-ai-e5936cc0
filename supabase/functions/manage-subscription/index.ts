import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SubscriptionAction = 
  | "get_requests"      // School: Get all pending upgrade requests
  | "approve_request"   // School: Approve a Pro plan request
  | "reject_request"    // School: Reject a request
  | "block_student"     // School: Block a student (revoke Pro immediately)
  | "cancel_pro"        // School: Cancel a student's Pro subscription
  | "request_upgrade"   // Student: Request Pro plan
  | "get_subscription"  // Student: Get own subscription details
  | "get_school_stats"  // Super Admin: Get subscription stats per school
  | "increment_tts"     // System: Increment TTS usage count
  | "check_expiry";     // System: Check and handle expired subscriptions

interface SubscriptionRequest {
  action: SubscriptionAction;
  sessionToken?: string;
  schoolId?: string;
  schoolUuid?: string;
  studentId?: string;
  requestId?: string;
  rejectionReason?: string;
  adminSessionToken?: string;
  ttsCharacters?: number;
}

// Validate school session token
async function validateSchoolSession(
  supabase: any,
  token: string,
  expectedSchoolId?: string
): Promise<{ valid: boolean; schoolUuid?: string }> {
  const { data, error } = await supabase
    .from('session_tokens')
    .select('user_id, user_type, expires_at, is_revoked')
    .eq('token', token)
    .maybeSingle();
  
  if (error || !data) return { valid: false };
  if (data.is_revoked || new Date(data.expires_at) < new Date()) return { valid: false };
  if (data.user_type !== 'school') return { valid: false };
  if (expectedSchoolId && data.user_id !== expectedSchoolId) return { valid: false };
  
  return { valid: true, schoolUuid: data.user_id };
}

// Validate admin session token
async function validateAdminSession(
  supabase: any,
  token: string
): Promise<{ valid: boolean; adminId?: string; role?: string }> {
  const { data, error } = await supabase
    .from('session_tokens')
    .select('user_id, user_type, expires_at, is_revoked')
    .eq('token', token)
    .maybeSingle();
  
  if (error || !data) return { valid: false };
  if (data.is_revoked || new Date(data.expires_at) < new Date()) return { valid: false };
  if (data.user_type !== 'admin') return { valid: false };
  
  // Get admin role
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', data.user_id)
    .maybeSingle();
  
  return { valid: true, adminId: data.user_id, role: admin?.role };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as SubscriptionRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Backend configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    switch (body.action) {
      // =============== STUDENT ACTIONS ===============
      case "request_upgrade": {
        if (!body.studentId) {
          return new Response(
            JSON.stringify({ success: false, error: "Student ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if student already has a pending request
        const { data: existing } = await admin
          .from('upgrade_requests')
          .select('id, status')
          .eq('student_id', body.studentId)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, error: "You already have a pending upgrade request" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check current subscription
        const { data: sub } = await admin
          .from('subscriptions')
          .select('plan')
          .eq('student_id', body.studentId)
          .maybeSingle();

        if (sub?.plan === 'pro') {
          return new Response(
            JSON.stringify({ success: false, error: "You already have a Pro plan" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create upgrade request
        const { error: insertError } = await admin
          .from('upgrade_requests')
          .insert({
            student_id: body.studentId,
            requested_plan: 'pro',
            status: 'pending',
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to submit request" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Upgrade request submitted" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_subscription": {
        if (!body.studentId) {
          return new Response(
            JSON.stringify({ success: false, error: "Student ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: subscription } = await admin
          .from('subscriptions')
          .select('*')
          .eq('student_id', body.studentId)
          .maybeSingle();

        const { data: pendingRequest } = await admin
          .from('upgrade_requests')
          .select('*')
          .eq('student_id', body.studentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return new Response(
          JSON.stringify({ 
            success: true, 
            subscription: subscription || { plan: 'basic', tts_used: 0, tts_limit: 150000 },
            pendingRequest
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "increment_tts": {
        if (!body.studentId || !body.ttsCharacters) {
          return new Response(
            JSON.stringify({ success: false, error: "Student ID and character count required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get current subscription
        const { data: sub } = await admin
          .from('subscriptions')
          .select('*')
          .eq('student_id', body.studentId)
          .maybeSingle();

        if (!sub) {
          return new Response(
            JSON.stringify({ success: true, usePremiumTTS: false, reason: "No subscription found" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if Pro plan and has quota
        const isPro = sub.plan === 'pro' && sub.is_active;
        const hasQuota = sub.tts_used + body.ttsCharacters <= sub.tts_limit;
        const isExpired = sub.end_date && new Date(sub.end_date) < new Date();

        if (isPro && hasQuota && !isExpired) {
          // Increment usage
          await admin
            .from('subscriptions')
            .update({ tts_used: sub.tts_used + body.ttsCharacters })
            .eq('id', sub.id);

          return new Response(
            JSON.stringify({ 
              success: true, 
              usePremiumTTS: true,
              ttsUsed: sub.tts_used + body.ttsCharacters,
              ttsLimit: sub.tts_limit,
              ttsRemaining: sub.tts_limit - (sub.tts_used + body.ttsCharacters)
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let reason = "Basic plan";
        if (isPro && !hasQuota) reason = "TTS limit reached";
        if (isPro && isExpired) reason = "Subscription expired";

        return new Response(
          JSON.stringify({ success: true, usePremiumTTS: false, reason }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =============== SCHOOL ADMIN ACTIONS ===============
      case "get_requests": {
        if (!body.sessionToken || !body.schoolUuid) {
          return new Response(
            JSON.stringify({ success: false, error: "Session token and school ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateSchoolSession(admin, body.sessionToken, body.schoolUuid);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid or expired session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all students with their subscriptions and pending requests
        const { data: students, error: studentsError } = await admin
          .from('students')
          .select(`
            id, full_name, class, photo_url, is_approved, is_banned,
            subscriptions (plan, tts_used, tts_limit, start_date, end_date, is_active),
            upgrade_requests (id, status, requested_at, rejection_reason)
          `)
          .eq('school_id', body.schoolUuid)
          .eq('is_approved', true);

        if (studentsError) {
          console.error("Students query error:", studentsError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch students" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Separate pending requests
        const pendingRequests = students?.filter(s => 
          Array.isArray(s.upgrade_requests) && 
          s.upgrade_requests.some((r: any) => r.status === 'pending')
        ).map(s => ({
          ...s,
          pendingRequest: Array.isArray(s.upgrade_requests) 
            ? s.upgrade_requests.find((r: any) => r.status === 'pending')
            : null
        })) || [];

        return new Response(
          JSON.stringify({ 
            success: true, 
            students: students || [],
            pendingRequests
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "approve_request": {
        if (!body.sessionToken || !body.schoolUuid || !body.requestId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateSchoolSession(admin, body.sessionToken, body.schoolUuid);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the request and verify it belongs to school's student
        const { data: request } = await admin
          .from('upgrade_requests')
          .select('student_id, status')
          .eq('id', body.requestId)
          .maybeSingle();

        if (!request || request.status !== 'pending') {
          return new Response(
            JSON.stringify({ success: false, error: "Request not found or already processed" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify student belongs to this school
        const { data: student } = await admin
          .from('students')
          .select('school_id')
          .eq('id', request.student_id)
          .maybeSingle();

        if (student?.school_id !== body.schoolUuid) {
          return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update request status
        await admin
          .from('upgrade_requests')
          .update({
            status: 'approved',
            processed_at: new Date().toISOString(),
            processed_by: body.schoolUuid
          })
          .eq('id', body.requestId);

        // Activate Pro plan for 30 days
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await admin
          .from('subscriptions')
          .update({
            plan: 'pro',
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            tts_used: 0,
            is_active: true
          })
          .eq('student_id', request.student_id);

        return new Response(
          JSON.stringify({ success: true, message: "Pro plan activated for 30 days" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reject_request": {
        if (!body.sessionToken || !body.schoolUuid || !body.requestId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateSchoolSession(admin, body.sessionToken, body.schoolUuid);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get request and verify ownership
        const { data: request } = await admin
          .from('upgrade_requests')
          .select('student_id, status')
          .eq('id', body.requestId)
          .maybeSingle();

        if (!request || request.status !== 'pending') {
          return new Response(
            JSON.stringify({ success: false, error: "Request not found or already processed" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: student } = await admin
          .from('students')
          .select('school_id')
          .eq('id', request.student_id)
          .maybeSingle();

        if (student?.school_id !== body.schoolUuid) {
          return new Response(
            JSON.stringify({ success: false, error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await admin
          .from('upgrade_requests')
          .update({
            status: 'rejected',
            processed_at: new Date().toISOString(),
            processed_by: body.schoolUuid,
            rejection_reason: body.rejectionReason || 'Request rejected by school'
          })
          .eq('id', body.requestId);

        return new Response(
          JSON.stringify({ success: true, message: "Request rejected" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "block_student": {
        if (!body.sessionToken || !body.schoolUuid || !body.studentId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateSchoolSession(admin, body.sessionToken, body.schoolUuid);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify student belongs to school
        const { data: student } = await admin
          .from('students')
          .select('school_id')
          .eq('id', body.studentId)
          .maybeSingle();

        if (student?.school_id !== body.schoolUuid) {
          return new Response(
            JSON.stringify({ success: false, error: "Student not found in your school" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mark any pending requests as blocked
        await admin
          .from('upgrade_requests')
          .update({
            status: 'blocked',
            processed_at: new Date().toISOString(),
            processed_by: body.schoolUuid
          })
          .eq('student_id', body.studentId)
          .eq('status', 'pending');

        // Downgrade to basic immediately
        await admin
          .from('subscriptions')
          .update({
            plan: 'basic',
            end_date: null,
            is_active: true
          })
          .eq('student_id', body.studentId);

        return new Response(
          JSON.stringify({ success: true, message: "Student blocked from Pro access" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel_pro": {
        if (!body.sessionToken || !body.schoolUuid || !body.studentId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateSchoolSession(admin, body.sessionToken, body.schoolUuid);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: student } = await admin
          .from('students')
          .select('school_id')
          .eq('id', body.studentId)
          .maybeSingle();

        if (student?.school_id !== body.schoolUuid) {
          return new Response(
            JSON.stringify({ success: false, error: "Student not found in your school" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await admin
          .from('subscriptions')
          .update({
            plan: 'basic',
            end_date: null,
            is_active: true
          })
          .eq('student_id', body.studentId);

        return new Response(
          JSON.stringify({ success: true, message: "Pro subscription cancelled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =============== SUPER ADMIN ACTIONS ===============
      case "get_school_stats": {
        if (!body.adminSessionToken) {
          return new Response(
            JSON.stringify({ success: false, error: "Admin session required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validation = await validateAdminSession(admin, body.adminSessionToken);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid admin session" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all schools with their subscription stats
        const { data: schools } = await admin
          .from('schools')
          .select('id, name, school_id, district, state');

        const schoolStats = await Promise.all((schools || []).map(async (school) => {
          // Get student counts
          const { count: totalStudents } = await admin
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('is_approved', true);

          // Get subscription breakdown
          const { data: subs } = await admin
            .from('subscriptions')
            .select('plan, students!inner(school_id)')
            .eq('students.school_id', school.id);

          const basicCount = subs?.filter(s => s.plan === 'basic').length || 0;
          const proCount = subs?.filter(s => s.plan === 'pro').length || 0;

          // Calculate estimated revenue (Pro = ₹199/month)
          const estimatedRevenue = proCount * 199;

          return {
            ...school,
            totalStudents: totalStudents || 0,
            basicUsers: basicCount,
            proUsers: proCount,
            estimatedRevenue
          };
        }));

        return new Response(
          JSON.stringify({ success: true, schools: schoolStats }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =============== SYSTEM ACTIONS ===============
      case "check_expiry": {
        // This is called by a cron job to expire subscriptions
        const { data: expiredSubs, error: expiredError } = await admin
          .from('subscriptions')
          .select('id, student_id')
          .eq('plan', 'pro')
          .lt('end_date', new Date().toISOString());

        if (expiredError) {
          console.error("Expiry check error:", expiredError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to check expired subscriptions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (expiredSubs && expiredSubs.length > 0) {
          const { error: updateError } = await admin
            .from('subscriptions')
            .update({
              plan: 'basic',
              end_date: null,
              is_active: true
            })
            .in('id', expiredSubs.map(s => s.id));

          if (updateError) {
            console.error("Expiry update error:", updateError);
          }

          console.log(`Expired ${expiredSubs.length} Pro subscriptions`);
        }

        return new Response(
          JSON.stringify({ success: true, expiredCount: expiredSubs?.length || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("manage-subscription error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);

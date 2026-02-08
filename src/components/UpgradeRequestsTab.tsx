import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
  Volume2,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentWithSubscription {
  id: string;
  full_name: string;
  class: string;
  photo_url: string | null;
  is_banned: boolean | null;
  subscriptions: {
    plan: 'basic' | 'pro';
    tts_used: number;
    tts_limit: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
  }[];
  upgrade_requests: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'blocked';
    requested_at: string;
    rejection_reason: string | null;
  }[];
  pendingRequest?: {
    id: string;
    status: 'pending';
    requested_at: string;
  };
}

interface UpgradeRequestsTabProps {
  students: StudentWithSubscription[];
  pendingRequests: StudentWithSubscription[];
  schoolUuid: string;
  onRefresh: () => void;
}

export const UpgradeRequestsTab = ({
  students,
  pendingRequests,
  schoolUuid,
  onRefresh,
}: UpgradeRequestsTabProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    requestId: string | null;
    studentName: string;
  }>({ open: false, requestId: null, studentName: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const getSchoolCredentials = () => {
    const sessionToken = localStorage.getItem('schoolSessionToken');
    if (!sessionToken) return null;
    return { sessionToken, schoolUuid };
  };

  const handleApprove = async (requestId: string) => {
    const creds = getSchoolCredentials();
    if (!creds) {
      toast({
        title: 'Session Expired',
        description: 'Please login again.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'approve_request',
          sessionToken: creds.sessionToken,
          schoolUuid: creds.schoolUuid,
          requestId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Pro Plan Activated! ✓',
        description: 'Student now has Pro access for 30 days.',
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Approval Failed',
        description: err.message || 'Could not approve request.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.requestId) return;

    const creds = getSchoolCredentials();
    if (!creds) {
      toast({
        title: 'Session Expired',
        description: 'Please login again.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(rejectDialog.requestId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'reject_request',
          sessionToken: creds.sessionToken,
          schoolUuid: creds.schoolUuid,
          requestId: rejectDialog.requestId,
          rejectionReason: rejectionReason.trim() || 'Request rejected by school',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Request Rejected',
        description: 'Student will be notified.',
      });
      setRejectDialog({ open: false, requestId: null, studentName: '' });
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Rejection Failed',
        description: err.message || 'Could not reject request.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlock = async (studentId: string) => {
    const creds = getSchoolCredentials();
    if (!creds) {
      toast({
        title: 'Session Expired',
        description: 'Please login again.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(studentId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'block_student',
          sessionToken: creds.sessionToken,
          schoolUuid: creds.schoolUuid,
          studentId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Student Blocked',
        description: 'Pro access revoked immediately.',
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Block Failed',
        description: err.message || 'Could not block student.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredRequests = pendingRequests.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="edu-card p-4 bg-amber-500/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold">Pro Plan Requests</h2>
          </div>
          <Badge variant="secondary">{pendingRequests.length} pending</Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Pending Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="edu-card p-8 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No pending upgrade requests</p>
          <p className="text-sm text-muted-foreground">Students can request Pro plan from their dashboard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((student) => (
            <div key={student.id} className="edu-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold border-2 border-amber-500/30">
                    {student.full_name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">Class: {student.class}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Basic → Pro
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {student.pendingRequest && formatDate(student.pendingRequest.requested_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => student.pendingRequest && handleApprove(student.pendingRequest.id)}
                    disabled={processingId === student.pendingRequest?.id}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {processingId === student.pendingRequest?.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectDialog({
                      open: true,
                      requestId: student.pendingRequest?.id || null,
                      studentName: student.full_name,
                    })}
                    disabled={processingId === student.pendingRequest?.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleBlock(student.id)}
                    disabled={processingId === student.id}
                    className="text-destructive/70 hover:text-destructive"
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Block
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, requestId: null, studentName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Upgrade Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Rejecting request for <strong>{rejectDialog.studentName}</strong>
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, requestId: null, studentName: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processingId}>
              {processingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpgradeRequestsTab;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Crown,
  Search,
  Volume2,
  Calendar,
  Ban,
  XCircle,
  Loader2,
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
}

interface StudentSubscriptionManagementProps {
  students: StudentWithSubscription[];
  schoolUuid: string;
  onRefresh: () => void;
}

export const StudentSubscriptionManagement = ({
  students,
  schoolUuid,
  onRefresh,
}: StudentSubscriptionManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'basic' | 'pro'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    studentId: string | null;
    studentName: string;
  }>({ open: false, studentId: null, studentName: '' });

  const getSchoolCredentials = () => {
    const sessionToken = localStorage.getItem('schoolSessionToken');
    if (!sessionToken) return null;
    return { sessionToken, schoolUuid };
  };

  const handleCancelPro = async () => {
    if (!cancelDialog.studentId) return;

    const creds = getSchoolCredentials();
    if (!creds) {
      toast({
        title: 'Session Expired',
        description: 'Please login again.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(cancelDialog.studentId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'cancel_pro',
          sessionToken: creds.sessionToken,
          schoolUuid: creds.schoolUuid,
          studentId: cancelDialog.studentId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Pro Subscription Cancelled',
        description: 'Student has been downgraded to Basic plan.',
      });
      setCancelDialog({ open: false, studentId: null, studentName: '' });
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not cancel subscription.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getSubscription = (student: StudentWithSubscription) => {
    return student.subscriptions?.[0] || {
      plan: 'basic',
      tts_used: 0,
      tts_limit: 150000,
      start_date: null,
      end_date: null,
      is_active: true,
    };
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const sub = getSubscription(student);
    const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const proStudents = students.filter(s => getSubscription(s).plan === 'pro');
  const basicStudents = students.filter(s => getSubscription(s).plan === 'basic');

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="edu-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-500">{proStudents.length}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Users
          </div>
        </div>
        <div className="edu-card p-3 text-center">
          <div className="text-2xl font-bold">{basicStudents.length}</div>
          <div className="text-xs text-muted-foreground">Basic Users</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPlan} onValueChange={(v: 'all' | 'basic' | 'pro') => setFilterPlan(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="pro">Pro Only</SelectItem>
            <SelectItem value="basic">Basic Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="edu-card p-8 text-center">
            <p className="text-muted-foreground">No students match your filters</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const sub = getSubscription(student);
            const isPro = sub.plan === 'pro';
            const daysRemaining = getDaysRemaining(sub.end_date);
            const usagePercent = (sub.tts_used / sub.tts_limit) * 100;

            return (
              <div
                key={student.id}
                className={`edu-card p-4 ${isPro ? 'ring-1 ring-amber-500/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                      {student.full_name.charAt(0)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{student.full_name}</p>
                      {isPro && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                      {!isPro && (
                        <Badge variant="outline" className="text-xs">Basic</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Class: {student.class}</p>

                    {/* Pro Details */}
                    {isPro && (
                      <div className="mt-2 space-y-2">
                        {/* Days remaining */}
                        {daysRemaining !== null && (
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className={daysRemaining <= 5 ? 'text-orange-500' : ''}>
                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                            </span>
                          </div>
                        )}

                        {/* TTS Usage */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              Voice Usage
                            </span>
                            <span>{Math.round(usagePercent)}%</span>
                          </div>
                          <Progress value={usagePercent} className="h-1.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isPro && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelDialog({
                        open: true,
                        studentId: student.id,
                        studentName: student.full_name,
                      })}
                      disabled={processingId === student.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {processingId === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel Pro
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, studentId: null, studentName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Pro Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately downgrade <strong>{cancelDialog.studentName}</strong> to Basic plan.
              They will lose access to premium voice features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Pro</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPro}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancel Pro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentSubscriptionManagement;

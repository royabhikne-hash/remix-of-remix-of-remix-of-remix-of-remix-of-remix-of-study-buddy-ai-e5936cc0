import { useState, useEffect } from 'react';
import { Crown, Users, Building2, IndianRupee, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SchoolStats {
  id: string;
  name: string;
  school_id: string;
  district: string | null;
  state: string | null;
  totalStudents: number;
  basicUsers: number;
  proUsers: number;
  estimatedRevenue: number;
}

export const SubscriptionAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolStats[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const adminSessionToken = localStorage.getItem('adminSessionToken');
      if (!adminSessionToken) {
        toast({
          title: 'Session Expired',
          description: 'Please login again.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'get_school_stats',
          adminSessionToken,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSchools(data?.schools || []);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      toast({
        title: 'Error Loading Data',
        description: err.message || 'Could not load subscription analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = schools.reduce(
    (acc, school) => ({
      totalStudents: acc.totalStudents + school.totalStudents,
      basicUsers: acc.basicUsers + school.basicUsers,
      proUsers: acc.proUsers + school.proUsers,
      estimatedRevenue: acc.estimatedRevenue + school.estimatedRevenue,
    }),
    { totalStudents: 0, basicUsers: 0, proUsers: 0, estimatedRevenue: 0 }
  );

  if (loading) {
    return (
      <div className="edu-card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">Loading subscription analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="edu-card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{totals.totalStudents}</p>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </div>

        <div className="edu-card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{totals.basicUsers}</p>
          <p className="text-xs text-muted-foreground">Basic Users</p>
        </div>

        <div className="edu-card p-4 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{totals.proUsers}</p>
          <p className="text-xs text-muted-foreground">Pro Users</p>
        </div>

        <div className="edu-card p-4 text-center bg-gradient-to-br from-accent/10 to-primary/10">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-2">
            <IndianRupee className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent">₹{totals.estimatedRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Est. Monthly Revenue</p>
        </div>
      </div>

      {/* Per-School Breakdown */}
      <div className="edu-card overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <h2 className="font-bold">School-wise Subscription Breakdown</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Read-only analytics view</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">School</th>
                <th className="text-left p-4 font-semibold">District</th>
                <th className="text-center p-4 font-semibold">Total</th>
                <th className="text-center p-4 font-semibold">Basic</th>
                <th className="text-center p-4 font-semibold">
                  <span className="flex items-center justify-center gap-1">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Pro
                  </span>
                </th>
                <th className="text-right p-4 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No schools found
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium">{school.name}</div>
                      <div className="text-xs text-muted-foreground">{school.school_id}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {school.district || '-'}
                    </td>
                    <td className="p-4 text-center font-medium">{school.totalStudents}</td>
                    <td className="p-4 text-center">{school.basicUsers}</td>
                    <td className="p-4 text-center">
                      {school.proUsers > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm">
                          <Crown className="w-3 h-3" />
                          {school.proUsers}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {school.estimatedRevenue > 0 ? (
                        <span className="font-medium text-accent">
                          ₹{school.estimatedRevenue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">₹0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {schools.length > 0 && (
              <tfoot className="bg-muted/50 font-semibold">
                <tr className="border-t-2 border-border">
                  <td className="p-4">Total ({schools.length} schools)</td>
                  <td className="p-4"></td>
                  <td className="p-4 text-center">{totals.totalStudents}</td>
                  <td className="p-4 text-center">{totals.basicUsers}</td>
                  <td className="p-4 text-center text-amber-600">{totals.proUsers}</td>
                  <td className="p-4 text-right text-accent">₹{totals.estimatedRevenue.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Conversion Rate */}
      {totals.totalStudents > 0 && (
        <div className="edu-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Pro Conversion Rate</p>
              <p className="text-2xl font-bold text-primary">
                {((totals.proUsers / totals.totalStudents) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionAnalytics;

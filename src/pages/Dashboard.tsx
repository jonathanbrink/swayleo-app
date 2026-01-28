import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, FileText, Mail, Zap, TrendingUp, Clock,
  ArrowRight, BarChart3, Users, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui';
import { 
  useCurrentOrganization,
  useDashboardStats,
  useBrandStats,
  useEmailTypeStats,
  useGenerationActivity,
  useTeamActivity
} from '../hooks';
import { EMAIL_TEMPLATES } from '../types/email';
import type { TimeRange } from '../types/analytics';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();
  const [timeRange] = useState<TimeRange>('30d');

  const { data: stats, isLoading: statsLoading } = useDashboardStats(org?.id || '');
  const { data: brandStats = [] } = useBrandStats(org?.id || '');
  const { data: emailTypeStats = [] } = useEmailTypeStats(org?.id || '', timeRange);
  const { data: activityData = [] } = useGenerationActivity(org?.id || '', timeRange);
  const { data: teamActivity = [] } = useTeamActivity(org?.id || '', 10);

  if (!org) return null;

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get activity action text
  const getActionText = (action: string, entityType: string) => {
    const entityName = entityType === 'brand_kit' ? 'Brand Kit' : entityType;
    switch (action) {
      case 'created': return `created a ${entityName}`;
      case 'updated': return `updated a ${entityName}`;
      case 'deleted': return `deleted a ${entityName}`;
      case 'completed': return `completed a ${entityName}`;
      default: return `${action} a ${entityName}`;
    }
  };

  // Calculate chart dimensions
  const maxActivityCount = Math.max(...activityData.map(d => d.count), 1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-semibold text-2xl text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with {org.name}.</p>
          </div>
          <Button onClick={() => navigate('/brands')}>
            <Tag className="w-4 h-4" />
            View Brands
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Tag}
            label="Total Brands"
            value={statsLoading ? '-' : stats?.totalBrands.toString() || '0'}
            subtext={`${stats?.completedKits || 0} kits complete`}
            color="purple"
          />
          <StatCard
            icon={Mail}
            label="Emails Generated"
            value={statsLoading ? '-' : formatNumber(stats?.totalEmails || 0)}
            subtext={`${stats?.emailsThisMonth || 0} this month`}
            color="blue"
          />
          <StatCard
            icon={Zap}
            label="Tokens Used"
            value={statsLoading ? '-' : formatNumber(stats?.tokensUsed || 0)}
            subtext={`${formatNumber(stats?.tokensThisMonth || 0)} this month`}
            color="amber"
          />
          <StatCard
            icon={FileText}
            label="Kit Completion"
            value={statsLoading ? '-' : `${Math.round((stats?.completedKits || 0) / Math.max(stats?.totalBrands || 1, 1) * 100)}%`}
            subtext="of brands complete"
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-slate-800">Generation Activity</h2>
                <p className="text-sm text-slate-500">Emails generated over the last 30 days</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>

            {/* Simple bar chart */}
            <div className="h-48 flex items-end gap-1">
              {activityData.slice(-30).map((day, i) => (
                <div
                  key={i}
                  className="flex-1 bg-sway-100 hover:bg-sway-200 rounded-t transition-colors cursor-pointer group relative"
                  style={{ height: `${Math.max((day.count / maxActivityCount) * 100, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.count} emails
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Email Type Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-800">Email Types</h2>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>

            {emailTypeStats.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No emails generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailTypeStats.slice(0, 5).map((stat) => {
                  const template = EMAIL_TEMPLATES.find(t => t.id === stat.emailType);
                  return (
                    <div key={stat.emailType} className="flex items-center gap-3">
                      <span className="text-lg">{template?.icon || '📧'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {template?.name || stat.emailType}
                          </span>
                          <span className="text-sm text-slate-500">{stat.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sway-400 rounded-full"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Brand Performance */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-800">Brand Performance</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/brands')}>
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {brandStats.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No brands yet</p>
                <Button size="sm" onClick={() => navigate('/brands')}>
                  Add your first brand
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {brandStats.slice(0, 5).map((brand) => (
                  <div 
                    key={brand.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/brands/${brand.id}`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sway-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-sway-600">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{brand.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{brand.kitProgress}% kit</span>
                        <span>•</span>
                        <span>{brand.emailCount} emails</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-800">Recent Activity</h2>
              <Users className="w-5 h-5 text-slate-400" />
            </div>

            {teamActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-slate-600">
                        {activity.userName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{activity.userName || 'User'}</span>
                        {' '}
                        {getActionText(activity.action, activity.entityType)}
                        {activity.entityName && (
                          <span className="font-medium"> "{activity.entityName}"</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-br from-sway-50 to-fuchsia-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-sway-500" />
            <h2 className="font-semibold text-slate-800">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Create Brand"
              description="Add a new client brand"
              onClick={() => navigate('/brands')}
            />
            <QuickActionCard
              title="Generate Email"
              description="Create AI-powered copy"
              onClick={() => brandStats.length > 0 && navigate(`/brands/${brandStats[0].id}/generate`)}
              disabled={brandStats.length === 0}
            />
            <QuickActionCard
              title="Invite Team"
              description="Add team members"
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  color: 'purple' | 'blue' | 'amber' | 'emerald';
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    purple: 'from-sway-100 to-sway-50 text-sway-600',
    blue: 'from-blue-100 to-blue-50 text-blue-600',
    amber: 'from-amber-100 to-amber-50 text-amber-600',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400">{subtext}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

function QuickActionCard({ title, description, onClick, disabled }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-4 bg-white rounded-xl border border-slate-100 transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-md hover:border-slate-200 cursor-pointer'
      }`}
    >
      <p className="font-medium text-slate-800">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </button>
  );
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

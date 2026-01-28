import { NavLink } from 'react-router-dom';
import { Tag, Settings, Sparkles, LogOut, Building2, LayoutDashboard, FileText } from 'lucide-react';
import { useAuth, useCurrentOrganization, useCurrentUserRole } from '../../hooks';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/brands', label: 'Brands', icon: Tag },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { signOut, profile } = useAuth();
  const { data: org } = useCurrentOrganization();
  const { data: role } = useCurrentUserRole(org?.id || '');

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sway-500 to-sway-600 flex items-center justify-center shadow-lg shadow-sway-500/25">
            <span className="text-white font-display font-bold text-lg">S</span>
          </div>
          <span className="font-display font-semibold text-xl text-slate-800">Swayleo</span>
        </div>
      </div>

      {/* Organization */}
      {org && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{org.name}</p>
              <p className="text-xs text-slate-400 capitalize">{role || 'Member'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-sway-50 text-sway-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Pro Tip */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-sway-50 to-fuchsia-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sway-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Pro Tip</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Complete your Brand Kit to unlock AI-powered email generation.
          </p>
        </div>
      </div>

      {/* User & Sign Out */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700 truncate max-w-[120px]">
                {profile?.full_name || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

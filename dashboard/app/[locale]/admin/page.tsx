import { DashboardOverview } from '../../../components/dashboard-overview';
import { DashboardShell } from '../../../components/dashboard-shell';
export default async function Admin({params}:{params:Promise<{locale:string}>}){const {locale}=await params,ar=locale==='ar';return <DashboardShell locale={locale} role="admin"><header className="page-header"><div><h1>{ar?'لوحة إدارة تريبي':'Tripi Admin'}</h1><p className="muted">{ar?'إدارة المنصة ومراقبة النشاط':'Platform operations and moderation'}</p></div></header><DashboardOverview locale={locale} role="admin"/></DashboardShell>}

import WorkspaceDashboard from './pages/WorkspaceDashboard.jsx';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Deals from './pages/Deals';
import Lenders from './pages/Lenders';
import Team from './pages/Team';
import __Layout from './Layout.jsx';

// Canonical command center for the FOD app.
export const PAGES = {
    "Dashboard": WorkspaceDashboard,
    "Leads": Leads,
    "Pipeline": Pipeline,
    "Deals": Deals,
    "Tasks": Tasks,
    "Lenders": Lenders,
    "Team": Team,
    "Reports": Reports,
};

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

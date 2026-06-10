import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Deals from './pages/Deals';
import Lenders from './pages/Lenders';
import Team from './pages/Team';
import __Layout from './Layout.jsx';

// NOTE: SiteBlueprint, Settings, DnsInstructions, FinVenturePro are CRM/internal pages
// kept safe in their files but not exposed in the FOD build routing loop.
// FinVenturePro has its own explicit route in App.jsx.

export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Pipeline": Pipeline,
    "Deals": Deals,
    "Tasks": Tasks,
    "Lenders": Lenders,
    "Team": Team,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
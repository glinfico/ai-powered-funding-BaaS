import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Deals from './pages/Deals';
import Lenders from './pages/Lenders';
import Team from './pages/Team';
import SiteBlueprint from './pages/SiteBlueprint';
import FinVenturePro from './pages/FinVenturePro';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "Pipeline": Pipeline,
    "Deals": Deals,
    "Tasks": Tasks,
    "Lenders": Lenders,
    "Team": Team,
    "Reports": Reports,
    "Settings": Settings,
    "SiteBlueprint": SiteBlueprint,
    "FinVenturePro": FinVenturePro,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};